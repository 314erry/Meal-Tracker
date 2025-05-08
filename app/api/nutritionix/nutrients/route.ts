import { NextResponse } from "next/server"
import { translatePtToEn, translateEnToPt, translateAltMeasures } from "@/lib/deepl-translation"

export async function POST(request: Request) {
  try {
    const { foodName } = await request.json()

    if (!foodName) {
      return NextResponse.json({ error: "Food name is required" }, { status: 400 })
    }

    // Get Nutritionix API credentials from environment variables
    const NUTRITIONIX_APP_ID = process.env.NUTRITIONIX_APP_ID
    const NUTRITIONIX_API_KEY = process.env.NUTRITIONIX_API_KEY

    // Validate API credentials
    if (!NUTRITIONIX_APP_ID || !NUTRITIONIX_API_KEY) {
      console.error("Missing Nutritionix API credentials")
      return NextResponse.json({ error: "API configuration error" }, { status: 500 })
    }

    // Translate food name from Portuguese to English
    let translatedFoodName = foodName
    const originalFoodName = foodName
    let wasTranslated = false

    try {
      translatedFoodName = await translatePtToEn(foodName)
      wasTranslated = translatedFoodName !== foodName
      console.log(`Translated food name: "${foodName}" -> "${translatedFoodName}"`)
    } catch (translationError) {
      console.error("Translation error, using original food name:", translationError)
      // Continue with the original food name if translation fails
    }

    // Call Nutritionix API with the translated food name
    const response = await fetch("https://trackapi.nutritionix.com/v2/natural/nutrients", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-app-id": NUTRITIONIX_APP_ID,
        "x-app-key": NUTRITIONIX_API_KEY,
      },
      body: JSON.stringify({ query: translatedFoodName }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Unknown API error" }))
      console.error("Nutritionix nutrients API error:", errorData)
      return NextResponse.json(
        { error: errorData.message || "Failed to fetch nutrition data" },
        { status: response.status },
      )
    }

    const data = await response.json()

    // Translate food names and measures in the results back to Portuguese
    if (data.foods && data.foods.length > 0) {
      for (let i = 0; i < data.foods.length; i++) {
        const food = data.foods[i]

        // Store the original English food name
        food.original_food_name = food.food_name

        // Translate the food name to Portuguese
        try {
          food.food_name = await translateEnToPt(food.food_name)
        } catch (translationError) {
          console.error("Error translating food name to Portuguese:", translationError)
          // Keep the English name if translation fails
        }

        // Translate serving unit if available
        if (food.serving_unit) {
          food.original_serving_unit = food.serving_unit
          try {
            food.serving_unit = await translateEnToPt(food.serving_unit)
          } catch (translationError) {
            console.error("Error translating serving unit to Portuguese:", translationError)
          }
        }

        // Translate alt_measures if available
        if (food.alt_measures && food.alt_measures.length > 0) {
          try {
            food.alt_measures = await translateAltMeasures(food.alt_measures)
          } catch (translationError) {
            console.error("Error translating alt measures to Portuguese:", translationError)
          }
        }
      }
    }

    // Add translation information to the response
    const responseWithTranslation = {
      ...data,
      translation: {
        original: originalFoodName,
        translated: translatedFoodName,
        wasTranslated,
      },
    }

    return NextResponse.json(responseWithTranslation)
  } catch (error) {
    console.error("Error in Nutritionix nutrients:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
