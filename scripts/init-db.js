const Database = require("better-sqlite3")
const bcrypt = require("bcryptjs")
const path = require("path")
const fs = require("fs")

// Caminho para o banco de dados
const dbPath = path.join(process.cwd(), "meal-tracker.db")
console.log("Inicializando banco de dados em:", dbPath)

// Verificar se o arquivo existe e removê-lo para começar do zero
if (fs.existsSync(dbPath)) {
  console.log("Removendo banco de dados existente...")
  fs.unlinkSync(dbPath)
}

// Criar uma nova conexão com o banco de dados
const db = new Database(dbPath, { verbose: console.log })

// Habilitar chaves estrangeiras
db.pragma("foreign_keys = ON")

console.log("Criando tabelas...")

// Criar tabela de usuários
db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`)

// Criar tabela de refeições
db.exec(`
  CREATE TABLE meals (
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

// Criar tabela de porções
db.exec(`
  CREATE TABLE servings (
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

// Criar tabela de medidas alternativas
db.exec(`
  CREATE TABLE alt_measures (
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

// Criar tabela de sessões
db.exec(`
  CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`)

console.log("Tabelas criadas com sucesso!")

// Criar usuário de demonstração
async function createDemoUser() {
  try {
    console.log("Criando usuário de demonstração...")
    const hashedPassword = await bcrypt.hash("demo123", 10)

    const stmt = db.prepare(`
      INSERT INTO users (email, password_hash, name)
      VALUES (?, ?, ?)
    `)

    const result = stmt.run("demo@example.com", hashedPassword, "Demo User")
    console.log("Usuário de demonstração criado com ID:", result.lastInsertRowid)

    return result.lastInsertRowid
  } catch (error) {
    console.error("Erro ao criar usuário de demonstração:", error)
    throw error
  }
}

// Criar algumas refeições de exemplo para o usuário demo
function createSampleMeals(userId) {
  try {
    console.log("Criando refeições de exemplo...")

    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const todayStr = today.toISOString().split("T")[0]
    const yesterdayStr = yesterday.toISOString().split("T")[0]

    // Inserir refeição de café da manhã
    const breakfastStmt = db.prepare(`
      INSERT INTO meals (user_id, date, name, calories, protein, carbs, fat, meal_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const breakfastResult = breakfastStmt.run(userId, todayStr, "Aveia com banana", 350, 12, 60, 8, "Breakfast")

    // Inserir refeição de almoço
    const lunchStmt = db.prepare(`
      INSERT INTO meals (user_id, date, name, calories, protein, carbs, fat, meal_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const lunchResult = lunchStmt.run(userId, todayStr, "Frango com arroz e salada", 650, 40, 70, 15, "Lunch")

    // Inserir refeição de ontem
    const yesterdayMealStmt = db.prepare(`
      INSERT INTO meals (user_id, date, name, calories, protein, carbs, fat, meal_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const yesterdayMealResult = yesterdayMealStmt.run(
      userId,
      yesterdayStr,
      "Omelete com legumes",
      450,
      25,
      10,
      35,
      "Dinner",
    )

    console.log("Refeições de exemplo criadas com sucesso!")
  } catch (error) {
    console.error("Erro ao criar refeições de exemplo:", error)
  }
}

// Executar a criação do usuário demo e refeições de exemplo
async function initializeData() {
  try {
    const userId = await createDemoUser()
    createSampleMeals(userId)
    console.log("Banco de dados inicializado com sucesso!")
  } catch (error) {
    console.error("Erro ao inicializar dados:", error)
  } finally {
    db.close()
  }
}

initializeData()
