import { NextResponse } from "next/server"
import { translatePtToEn, translateFoodItems } from "@/lib/deepl-translation"

export async function POST(request: Request) {
  try {
    const { query } = await request.json()

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    // Get Nutritionix API credentials from environment variables
    const NUTRITIONIX_APP_ID = process.env.NUTRITIONIX_APP_ID
    const NUTRITIONIX_API_KEY = process.env.NUTRITIONIX_API_KEY

    // Validate API credentials
    if (!NUTRITIONIX_APP_ID || !NUTRITIONIX_API_KEY) {
      console.error("Missing Nutritionix API credentials")
      return NextResponse.json({ error: "API configuration error" }, { status: 500 })
    }

    // Translate query from Portuguese to English
    let translatedQuery = query
    let wasTranslated = false

    try {
      translatedQuery = await translatePtToEn(query)
      wasTranslated = translatedQuery !== query
      console.log(`Translated query: "${query}" -> "${translatedQuery}"`)
    } catch (translationError) {
      console.error("Translation error, using original query:", translationError)
      // Continue with the original query if translation fails
    }

    // Call Nutritionix API with the translated query
    const response = await fetch("https://trackapi.nutritionix.com/v2/search/instant", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-app-id": NUTRITIONIX_APP_ID,
        "x-app-key": NUTRITIONIX_API_KEY,
      },
      body: JSON.stringify({ query: translatedQuery }),
    })

    if (!response.ok) {
      let errorMessage = "Failed to fetch data from Nutritionix"
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        // If we can't parse the error as JSON, just use the default message
      }
      console.error("Nutritionix API error:", errorMessage)
      return NextResponse.json({ error: errorMessage }, { status: response.status })
    }

    const data = await response.json()

    // Translate food names in the results from English to Portuguese
    let translatedCommon = []
    let translatedBranded = []

    if (data.common && data.common.length > 0) {
      translatedCommon = await translateFoodItems(data.common)
    }

    if (data.branded && data.branded.length > 0) {
      translatedBranded = await translateFoodItems(data.branded)
    }

    // Add the original and translated query to the response
    const responseWithTranslation = {
      common: translatedCommon,
      branded: translatedBranded,
      translation: {
        original: query,
        translated: translatedQuery,
        wasTranslated,
      },
    }

    return NextResponse.json(responseWithTranslation)
  } catch (error) {
    console.error("Error in Nutritionix search:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
