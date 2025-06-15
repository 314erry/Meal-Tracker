import { NextResponse } from "next/server"
import { createUser, login } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json()

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json({ error: "Email, password, and name are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 })
    }

    // Create user
    const user = await createUser(email, password, name)

    // Log them in automatically
    await login(email, password)

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("Signup error:", error)

    if (error.message === "User with this email already exists") {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
