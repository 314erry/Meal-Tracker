import { NextResponse } from "next/server"
import { translatePtToEn, translateEnToPt, translateAltMeasures } from "@/lib/deepl-translation"

export async function POST(request: Request) {
  try {
    const { foodName, measure, quantity } = await request.json()

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

    // Translate food name and measure from Portuguese to English
    let translatedFoodName = foodName
    let translatedMeasure = measure
    const originalFoodName = foodName
    const originalMeasure = measure

    try {
      translatedFoodName = await translatePtToEn(foodName)
      console.log(`Translated food name: "${foodName}" -> "${translatedFoodName}"`)

      if (measure) {
        translatedMeasure = await translatePtToEn(measure)
        console.log(`Translated measure: "${measure}" -> "${translatedMeasure}"`)
      }
    } catch (translationError) {
      console.error("Translation error, using original values:", translationError)
      // Continue with the original values if translation fails
    }

    // Construct the query with the measure and quantity if provided
    let query = translatedFoodName
    if (translatedMeasure && quantity) {
      query = `${quantity} ${translatedMeasure} ${translatedFoodName}`
    }

    console.log("Querying Nutritionix with:", query)

    // Call Nutritionix API to get detailed nutrition information with the specified measure
    const response = await fetch("https://trackapi.nutritionix.com/v2/natural/nutrients", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-app-id": NUTRITIONIX_APP_ID,
        "x-app-key": NUTRITIONIX_API_KEY,
      },
      body: JSON.stringify({ query }),
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
        original: {
          foodName: originalFoodName,
          measure: originalMeasure,
        },
        translated: {
          foodName: translatedFoodName,
          measure: translatedMeasure,
        },
        wasTranslated: foodName !== translatedFoodName || measure !== translatedMeasure,
      },
    }

    return NextResponse.json(responseWithTranslation)
  } catch (error) {
    console.error("Error in Nutritionix measure:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
