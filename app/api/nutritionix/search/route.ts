import { NextResponse } from "next/server"

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

    console.log("Using Nutritionix credentials:", {
      appId: NUTRITIONIX_APP_ID.substring(0, 3) + "...",
      apiKey: NUTRITIONIX_API_KEY.substring(0, 3) + "...",
    })

    // Call Nutritionix API
    const response = await fetch("https://trackapi.nutritionix.com/v2/search/instant", {
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
      console.error("Nutritionix API error:", errorData)
      return NextResponse.json(
        { error: errorData.message || "Failed to fetch data from Nutritionix" },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in Nutritionix search:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
