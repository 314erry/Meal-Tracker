import { NextResponse } from "next/server"

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

    // Construct the query with the measure and quantity if provided
    let query = foodName
    if (measure && quantity) {
      query = `${quantity} ${measure} ${foodName}`
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
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in Nutritionix measure:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
