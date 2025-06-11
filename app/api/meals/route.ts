import { NextResponse } from "next/server"
import Database from "better-sqlite3"
import { getUser } from "@/lib/auth"
import path from "path"

// Initialize database connection with better error handling
let db: Database.Database

try {
  const dbPath = path.join(process.cwd(), "meal-tracker.db")
  db = new Database(dbPath, { verbose: console.log })
  db.pragma("foreign_keys = ON")
} catch (error) {
  console.error("Failed to initialize database:", error)
  throw error
}

// GET all meals for the authenticated user
export async function GET(request: Request) {
  try {
    console.log("GET /api/meals - Fetching meals")

    const user = await getUser()
    if (!user) {
      console.log("GET /api/meals - User not authenticated")
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    console.log("GET /api/meals - User authenticated:", user.id, user.email)

    const url = new URL(request.url)
    const date = url.searchParams.get("date")
    const month = url.searchParams.get("month")

    let query = "SELECT * FROM meals WHERE user_id = ?"
    const params: any[] = [user.id]

    if (date) {
      query += " AND date = ?"
      params.push(date)
    } else if (month) {
      query += " AND date LIKE ?"
      params.push(`${month}%`)
    }

    query += " ORDER BY date DESC, created_at DESC"

    console.log("GET /api/meals - Executing query:", query, "with params:", params)

    const meals = db.prepare(query).all(...params)

    console.log("GET /api/meals - Found meals for user", user.id, ":", meals.length)

    // For each meal, get its serving and alt_measures (also filtered by user_id)
    const mealsWithDetails = meals.map((meal: any) => {
      const serving = db.prepare("SELECT * FROM servings WHERE meal_id = ? AND user_id = ?").get(meal.id, user.id)
      const altMeasures = db
        .prepare("SELECT * FROM alt_measures WHERE meal_id = ? AND user_id = ?")
        .all(meal.id, user.id)

      return {
        ...meal,
        serving: serving || undefined,
        altMeasures: altMeasures.length > 0 ? altMeasures : undefined,
      }
    })

    console.log("GET /api/meals - Returning meals with details:", mealsWithDetails.length)

    return NextResponse.json(mealsWithDetails)
  } catch (error) {
    console.error("Error fetching meals:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch meals",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// POST a new meal for the authenticated user
export async function POST(request: Request) {
  try {
    console.log("POST /api/meals - Adding new meal")

    const user = await getUser()
    if (!user) {
      console.log("POST /api/meals - User not authenticated")
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    console.log("POST /api/meals - User authenticated:", user.id, user.email)

    const mealData = await request.json()
    console.log("POST /api/meals - Meal data received for user", user.id, ":", JSON.stringify(mealData, null, 2))

    // Validate required fields
    if (!mealData.date || !mealData.name || !mealData.calories || !mealData.mealType) {
      console.log("POST /api/meals - Missing required fields")
      return NextResponse.json(
        {
          error: "Missing required fields",
          required: ["date", "name", "calories", "mealType"],
        },
        { status: 400 },
      )
    }

    // Start a transaction
    const transaction = db.transaction(() => {
      console.log("POST /api/meals - Starting transaction for user:", user.id)

      // Insert meal with user_id
      const mealInsert = db.prepare(`
        INSERT INTO meals (
          user_id, date, name, original_name, calories, protein, carbs, fat, 
          meal_type, food_id, image_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      const mealResult = mealInsert.run(
        user.id, // Ensure user_id is set correctly
        mealData.date,
        mealData.name,
        mealData.originalName || null,
        mealData.calories,
        mealData.protein || 0,
        mealData.carbs || 0,
        mealData.fat || 0,
        mealData.mealType,
        mealData.foodId || null,
        mealData.imageUrl || null,
      )

      const mealId = mealResult.lastInsertRowid
      console.log("POST /api/meals - Meal inserted with ID:", mealId, "for user:", user.id)

      // Insert serving if provided (with user_id for additional security)
      if (mealData.serving) {
        console.log("POST /api/meals - Inserting serving for user:", user.id)

        const servingInsert = db.prepare(`
          INSERT INTO servings (
            meal_id, user_id, quantity, unit, original_unit, weight
          ) VALUES (?, ?, ?, ?, ?, ?)
        `)

        servingInsert.run(
          mealId,
          user.id, // Ensure user_id is set
          mealData.serving.quantity,
          mealData.serving.unit,
          mealData.serving.originalUnit || null,
          mealData.serving.weight,
        )

        console.log("POST /api/meals - Serving inserted for user:", user.id)
      }

      // Insert alt_measures if provided (with user_id for additional security)
      if (mealData.altMeasures && mealData.altMeasures.length > 0) {
        console.log(
          "POST /api/meals - Inserting alt_measures for user:",
          user.id,
          "count:",
          mealData.altMeasures.length,
        )

        const altMeasureInsert = db.prepare(`
          INSERT INTO alt_measures (
            meal_id, user_id, serving_weight, measure, original_measure, seq, qty
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `)

        for (const measure of mealData.altMeasures) {
          altMeasureInsert.run(
            mealId,
            user.id, // Ensure user_id is set
            measure.serving_weight,
            measure.measure,
            measure.original_measure || null,
            measure.seq || null,
            measure.qty,
          )
        }

        console.log("POST /api/meals - Alt measures inserted for user:", user.id)
      }

      // Return the inserted meal with its ID
      return {
        id: mealId,
        user_id: user.id,
        ...mealData,
      }
    })

    // Execute the transaction
    console.log("POST /api/meals - Executing transaction for user:", user.id)
    const result = transaction()
    console.log("POST /api/meals - Transaction completed successfully for user:", user.id)

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("Error adding meal:", error)
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")

    return NextResponse.json(
      {
        error: "Failed to add meal",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
