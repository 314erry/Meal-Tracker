import Database from "better-sqlite3"
import bcrypt from "bcryptjs"

// Initialize the database
const db = new Database("./meal-tracker.db")

// Enable foreign keys
db.pragma("foreign_keys = ON")

export function initializeDatabase() {
  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create meals table with user_id
  db.exec(`
    CREATE TABLE IF NOT EXISTS meals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      name TEXT NOT NULL,
      original_name TEXT,
      calories INTEGER NOT NULL,
      protein REAL NOT NULL,
      carbs REAL NOT NULL,
      fat REAL NOT NULL,
      meal_type TEXT NOT NULL,
      food_id TEXT,
      image_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  // Create servings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS servings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meal_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      original_unit TEXT,
      weight REAL NOT NULL,
      FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  // Create alt_measures table
  db.exec(`
    CREATE TABLE IF NOT EXISTS alt_measures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meal_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      serving_weight REAL NOT NULL,
      measure TEXT NOT NULL,
      original_measure TEXT,
      seq INTEGER,
      qty REAL NOT NULL,
      FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  // Create sessions table for authentication
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  console.log("Database initialized successfully")
}

// Create a demo user
export async function createDemoUser() {
  const hashedPassword = await bcrypt.hash("demo123", 10)

  try {
    const stmt = db.prepare(`
      INSERT INTO users (email, password_hash, name)
      VALUES (?, ?, ?)
    `)

    stmt.run("demo@example.com", hashedPassword, "Demo User")
    console.log("Demo user created: demo@example.com / demo123")
  } catch (error: any) {
    if (error.code !== "SQLITE_CONSTRAINT_UNIQUE") {
      console.log("Error creating demo user:", error.message)
    }
  }
}

// Initialize database on import
initializeDatabase()
createDemoUser()

export default db
