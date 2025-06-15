import { NextResponse } from "next/server"
import Database from "better-sqlite3"
import { getUser } from "@/lib/auth"

// Initialize database connection
const db = new Database("./meal-tracker.db", { verbose: console.log })
db.pragma("foreign_keys = ON")

// GET a specific meal for the authenticated user
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const id = params.id

    // Get the meal (only if it belongs to the user)
    const meal = db.prepare("SELECT * FROM meals WHERE id = ? AND user_id = ?").get(id, user.id)

    if (!meal) {
      return NextResponse.json({ error: "Meal not found" }, { status: 404 })
    }

    // Get the serving
    const serving = db.prepare("SELECT * FROM servings WHERE meal_id = ? AND user_id = ?").get(id, user.id)

    // Get the alt_measures
    const altMeasures = db.prepare("SELECT * FROM alt_measures WHERE meal_id = ? AND user_id = ?").all(id, user.id)

    // Combine the data
    const mealWithDetails = {
      ...meal,
      serving: serving || undefined,
      altMeasures: altMeasures.length > 0 ? altMeasures : undefined,
    }

    return NextResponse.json(mealWithDetails)
  } catch (error) {
    console.error("Error fetching meal:", error)
    return NextResponse.json({ error: "Failed to fetch meal" }, { status: 500 })
  }
}

// PUT (update) a meal for the authenticated user
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const id = params.id
    const mealData = await request.json()

    // Check if the meal belongs to the user
    const existingMeal = db.prepare("SELECT id FROM meals WHERE id = ? AND user_id = ?").get(id, user.id)

    if (!existingMeal) {
      return NextResponse.json({ error: "Meal not found" }, { status: 404 })
    }

    // Start a transaction
    const transaction = db.transaction(() => {
      // Update meal
      const mealUpdate = db.prepare(`
        UPDATE meals SET
          date = ?, name = ?, original_name = ?, calories = ?, 
          protein = ?, carbs = ?, fat = ?, meal_type = ?, 
          food_id = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
      `)

      mealUpdate.run(
        mealData.date,
        mealData.name,
        mealData.originalName || null,
        mealData.calories,
        mealData.protein,
        mealData.carbs,
        mealData.fat,
        mealData.mealType,
        mealData.foodId || null,
        mealData.imageUrl || null,
        id,
        user.id,
      )

      // Delete existing serving and alt_measures
      db.prepare("DELETE FROM servings WHERE meal_id = ? AND user_id = ?").run(id, user.id)
      db.prepare("DELETE FROM alt_measures WHERE meal_id = ? AND user_id = ?").run(id, user.id)

      // Insert new serving if provided
      if (mealData.serving) {
        const servingInsert = db.prepare(`
          INSERT INTO servings (
            meal_id, user_id, quantity, unit, original_unit, weight
          ) VALUES (?, ?, ?, ?, ?, ?)
        `)

        servingInsert.run(
          id,
          user.id,
          mealData.serving.quantity,
          mealData.serving.unit,
          mealData.serving.originalUnit || null,
          mealData.serving.weight,
        )
      }

      // Insert new alt_measures if provided
      if (mealData.altMeasures && mealData.altMeasures.length > 0) {
        const altMeasureInsert = db.prepare(`
          INSERT INTO alt_measures (
            meal_id, user_id, serving_weight, measure, original_measure, seq, qty
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `)

        for (const measure of mealData.altMeasures) {
          altMeasureInsert.run(
            id,
            user.id,
            measure.serving_weight,
            measure.measure,
            measure.original_measure || null,
            measure.seq || null,
            measure.qty,
          )
        }
      }

      // Return the updated meal
      return {
        id: Number(id),
        user_id: user.id,
        ...mealData,
      }
    })

    // Execute the transaction
    const result = transaction()

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error updating meal:", error)
    return NextResponse.json({ error: "Failed to update meal" }, { status: 500 })
  }
}

// DELETE a meal for the authenticated user
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const id = params.id

    // Check if the meal exists and belongs to the user
    const meal = db.prepare("SELECT id FROM meals WHERE id = ? AND user_id = ?").get(id, user.id)

    if (!meal) {
      return NextResponse.json({ error: "Meal not found" }, { status: 404 })
    }

    // Delete the meal (cascade will delete related servings and alt_measures)
    db.prepare("DELETE FROM meals WHERE id = ? AND user_id = ?").run(id, user.id)

    return NextResponse.json({ message: "Meal deleted successfully" })
  } catch (error) {
    console.error("Error deleting meal:", error)
    return NextResponse.json({ error: "Failed to delete meal" }, { status: 500 })
  }
}
