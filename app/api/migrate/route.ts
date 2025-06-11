import { NextResponse } from "next/server"
import Database from "better-sqlite3"

const db = new Database("./meal-tracker.db", { verbose: console.log })

db.pragma("foreign_keys = ON")

export async function POST(request: Request) {
  try {
    const { meals } = await request.json()

    const transaction = db.transaction(() => {
      const results = []

      for (const meal of meals) {
        // Insert meal
        const mealInsert = db.prepare(`
          INSERT INTO meals (
            date, name, original_name, calories, protein, carbs, fat, 
            meal_type, food_id, image_url
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)

        const mealResult = mealInsert.run(
          meal.date,
          meal.name,
          meal.originalName || null,
          meal.calories,
          meal.protein,
          meal.carbs,
          meal.fat,
          meal.mealType,
          meal.foodId || null,
          meal.imageUrl || null,
        )

        const mealId = mealResult.lastInsertRowid

        if (meal.serving) {
          const servingInsert = db.prepare(`
            INSERT INTO servings (
              meal_id, quantity, unit, original_unit, weight
            ) VALUES (?, ?, ?, ?, ?)
          `)

          servingInsert.run(
            mealId,
            meal.serving.quantity,
            meal.serving.unit,
            meal.serving.originalUnit || null,
            meal.serving.weight,
          )
        }

        if (meal.altMeasures && meal.altMeasures.length > 0) {
          const altMeasureInsert = db.prepare(`
            INSERT INTO alt_measures (
              meal_id, serving_weight, measure, original_measure, seq, qty
            ) VALUES (?, ?, ?, ?, ?, ?)
          `)

          for (const measure of meal.altMeasures) {
            altMeasureInsert.run(
              mealId,
              measure.serving_weight,
              measure.measure,
              measure.original_measure || null,
              measure.seq || null,
              measure.qty,
            )
          }
        }

        results.push({
          id: mealId,
          ...meal,
        })
      }

      return results
    })

    const results = transaction()

    return NextResponse.json({
      message: `Successfully migrated ${results.length} meals`,
      meals: results,
    })
  } catch (error) {
    console.error("Error migrating data:", error)
    return NextResponse.json({ error: "Failed to migrate data" }, { status: 500 })
  }
}
