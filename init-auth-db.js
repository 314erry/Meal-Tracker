// This demonstrates the updated database schema with user authentication

import Database from "better-sqlite3"
import bcrypt from "bcryptjs"

// Initialize the database
const db = new Database("./meal-tracker.db")

// Enable foreign keys
db.pragma("foreign_keys = ON")

function initializeAuthDatabase() {
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

  // Update meals table to include user_id
  db.exec(`
    CREATE TABLE IF NOT EXISTS meals_new (
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

  // Update servings table to include user_id reference
  db.exec(`
    CREATE TABLE IF NOT EXISTS servings_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meal_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      original_unit TEXT,
      weight REAL NOT NULL,
      FOREIGN KEY (meal_id) REFERENCES meals_new(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  // Update alt_measures table to include user_id reference
  db.exec(`
    CREATE TABLE IF NOT EXISTS alt_measures_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meal_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      serving_weight REAL NOT NULL,
      measure TEXT NOT NULL,
      original_measure TEXT,
      seq INTEGER,
      qty REAL NOT NULL,
      FOREIGN KEY (meal_id) REFERENCES meals_new(id) ON DELETE CASCADE,
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

  console.log("Authentication database initialized successfully")
}

// Initialize the database
initializeAuthDatabase()

// Create a demo user
async function createDemoUser() {
  const hashedPassword = await bcrypt.hash("demo123", 10)

  try {
    const stmt = db.prepare(`
      INSERT INTO users (email, password_hash, name)
      VALUES (?, ?, ?)
    `)

    stmt.run("demo@example.com", hashedPassword, "Demo User")
    console.log("Demo user created: demo@example.com / demo123")
  } catch (error) {
    console.log("Demo user already exists or error:", error.message)
  }
}

createDemoUser()

export default db
