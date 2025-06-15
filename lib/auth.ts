import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import { v4 as uuidv4 } from "uuid"
import db from "./database"

// Usar uma chave secreta mais segura e garantir que ela seja consistente
const secretKey = process.env.JWT_SECRET || "super-secret-key-for-meal-tracker-app-change-in-production"
const key = new TextEncoder().encode(secretKey)

export interface User {
  id: number
  email: string
  name: string
  created_at: string
}

export interface Session {
  id: string
  user_id: number
  expires_at: string
}

// JWT token functions
export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(key)
}

export async function decrypt(input: string): Promise<any> {
  if (!input) return null

  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ["HS256"],
    })
    return payload
  } catch (error) {
    console.error("JWT decrypt error:", error)
    return null
  }
}

// User management functions
export async function createUser(email: string, password: string, name: string): Promise<User> {
  try {
    const hashedPassword = await bcrypt.hash(password, 10)

    const stmt = db.prepare(`
      INSERT INTO users (email, password_hash, name)
      VALUES (?, ?, ?)
    `)

    const result = stmt.run(email, hashedPassword, name)

    const user = db
      .prepare("SELECT id, email, name, created_at FROM users WHERE id = ?")
      .get(result.lastInsertRowid) as User

    return user
  } catch (error: any) {
    console.error("Create user error:", error)
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      throw new Error("User with this email already exists")
    }
    throw new Error("Failed to create user")
  }
}

export async function verifyUser(email: string, password: string): Promise<User | null> {
  try {
    console.log("Verificando usuário:", email)

    const user = db
      .prepare(`
      SELECT id, email, password_hash, name, created_at 
      FROM users 
      WHERE email = ?
    `)
      .get(email) as any

    if (!user) {
      console.log("Usuário não encontrado:", email)
      return null
    }

    console.log("Usuário encontrado, verificando senha")

    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) {
      console.log("Senha inválida para usuário:", email)
      return null
    }

    console.log("Autenticação bem-sucedida para:", email)

    // Return user without password hash
    const { password_hash, ...userWithoutPassword } = user
    return userWithoutPassword
  } catch (error) {
    console.error("Verify user error:", error)
    return null
  }
}

export function getUserById(id: number): User | null {
  try {
    const user = db
      .prepare(`
      SELECT id, email, name, created_at 
      FROM users 
      WHERE id = ?
    `)
      .get(id) as User | undefined

    return user || null
  } catch (error) {
    console.error("Get user by ID error:", error)
    return null
  }
}

// Session management functions
export function createSession(userId: number): string {
  try {
    const sessionId = uuidv4()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    db.prepare(`
      INSERT INTO sessions (id, user_id, expires_at)
      VALUES (?, ?, ?)
    `).run(sessionId, userId, expiresAt.toISOString())

    return sessionId
  } catch (error) {
    console.error("Create session error:", error)
    throw new Error("Failed to create session")
  }
}

export function getSession(sessionId: string): Session | null {
  try {
    const session = db
      .prepare(`
      SELECT id, user_id, expires_at 
      FROM sessions 
      WHERE id = ? AND expires_at > datetime('now')
    `)
      .get(sessionId) as Session | undefined

    return session || null
  } catch (error) {
    console.error("Get session error:", error)
    return null
  }
}

export function deleteSession(sessionId: string): void {
  try {
    db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId)
  } catch (error) {
    console.error("Delete session error:", error)
  }
}

export function cleanupExpiredSessions(): void {
  try {
    db.prepare('DELETE FROM sessions WHERE expires_at <= datetime("now")').run()
  } catch (error) {
    console.error("Cleanup sessions error:", error)
  }
}

// Authentication middleware functions
export async function login(email: string, password: string) {
  try {
    console.log("Tentando login para:", email)

    const user = await verifyUser(email, password)
    if (!user) {
      console.log("Credenciais inválidas para:", email)
      throw new Error("Invalid credentials")
    }

    console.log("Login bem-sucedido, criando sessão para usuário:", user.id)

    const sessionId = createSession(user.id)
    const token = await encrypt({ sessionId, userId: user.id })

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set("session", token, {
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    })

    console.log("Sessão criada com sucesso, ID:", sessionId)

    return { user, sessionId }
  } catch (error) {
    console.error("Login error:", error)
    throw error
  }
}

export async function logout() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")?.value

    if (sessionCookie) {
      const payload = await decrypt(sessionCookie)
      if (payload && payload.sessionId) {
        deleteSession(payload.sessionId)
      }
    }

    // Clear cookie
    cookieStore.set("session", "", {
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    })
  } catch (error) {
    console.error("Logout error:", error)
  }
}

export async function getUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")?.value

    if (!sessionCookie) {
      return null
    }

    const payload = await decrypt(sessionCookie)
    if (!payload || !payload.sessionId) {
      return null
    }

    const session = getSession(payload.sessionId)
    if (!session) {
      return null
    }

    const user = getUserById(session.user_id)
    return user
  } catch (error) {
    console.error("Get user error:", error)
    return null
  }
}

// Cleanup expired sessions periodically
setInterval(cleanupExpiredSessions, 60 * 60 * 1000) // Every hour
