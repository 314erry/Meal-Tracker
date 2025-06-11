import { NextResponse } from "next/server"
import db from "@/lib/database"

export async function GET() {
  try {
    // Verificar conexão com o banco
    const dbTest = db.prepare("SELECT 1 as test").get()

    // Verificar tabelas
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()

    // Verificar usuário demo
    const demoUser = db.prepare("SELECT id, email, name FROM users WHERE email = ?").get("demo@example.com")

    // Contar registros em cada tabela
    const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number }
    const mealCount = db.prepare("SELECT COUNT(*) as count FROM meals").get() as { count: number }
    const sessionCount = db.prepare("SELECT COUNT(*) as count FROM sessions").get() as { count: number }

    return NextResponse.json({
      status: "ok",
      database: {
        connected: !!dbTest,
        tables: tables.map((t: any) => t.name),
      },
      counts: {
        users: userCount?.count || 0,
        meals: mealCount?.count || 0,
        sessions: sessionCount?.count || 0,
      },
      demoUser: demoUser || "não encontrado",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Erro na verificação do banco de dados:", error)
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Erro desconhecido",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
