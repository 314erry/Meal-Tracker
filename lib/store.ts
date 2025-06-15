"use client"

import { create } from "zustand"

export type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snack"

export interface ServingInfo {
  quantity: number
  unit: string
  weight: number
  originalUnit?: string
}

export interface Meal {
  id?: number
  date: string
  name: string
  originalName?: string
  calories: number
  protein: number
  carbs: number
  fat: number
  mealType: MealType
  foodId?: string
  serving?: ServingInfo
  altMeasures?: Array<{
    serving_weight: number
    measure: string
    original_measure?: string
    seq: number | null
    qty: number
  }>
  imageUrl?: string
}

// Interface for raw data from API (with snake_case fields)
export interface RawMeal {
  id?: number
  date: string
  name: string
  original_name?: string
  calories: number
  protein: number
  carbs: number
  fat: number
  meal_type: string // snake_case from database
  food_id?: string
  serving?: ServingInfo
  altMeasures?: Array<{
    serving_weight: number
    measure: string
    original_measure?: string
    seq: number | null
    qty: number
  }>
  image_url?: string
}

interface MealStore {
  meals: Meal[]
  loading: boolean
  error: string | null
  initialized: boolean
  currentUserId: number | null
  fetchMeals: (date?: string, month?: string) => Promise<void>
  addMeal: (meal: Meal) => Promise<void>
  removeMeal: (mealId: number) => Promise<void>
  updateMeal: (mealId: number, updatedMeal: Meal) => Promise<void>
  initializeStore: () => Promise<void>
  clearError: () => void
  resetStore: () => void
  setCurrentUser: (userId: number | null) => void
}

// Helper function to normalize raw meal data from API
function normalizeMeal(rawMeal: RawMeal): Meal {
  return {
    id: rawMeal.id,
    date: rawMeal.date,
    name: rawMeal.name,
    originalName: rawMeal.original_name,
    calories: rawMeal.calories,
    protein: rawMeal.protein,
    carbs: rawMeal.carbs,
    fat: rawMeal.fat,
    mealType: rawMeal.meal_type as MealType,
    foodId: rawMeal.food_id,
    serving: rawMeal.serving,
    altMeasures: rawMeal.altMeasures,
    imageUrl: rawMeal.image_url,
  }
}

export const useMealStore = create<MealStore>((set, get) => ({
  meals: [],
  loading: false,
  error: null,
  initialized: false,
  currentUserId: null,

  clearError: () => set({ error: null }),

  resetStore: () => {
    console.log("Resetting meal store")
    set({
      meals: [],
      loading: false,
      error: null,
      initialized: false,
      currentUserId: null,
    })
  },

  setCurrentUser: (userId: number | null) => {
    const currentUserId = get().currentUserId
    console.log("Setting current user:", userId, "Previous user:", currentUserId)

    // If user changed, reset the store and reinitialize
    if (currentUserId !== userId) {
      set({
        meals: [],
        loading: false,
        error: null,
        initialized: false,
        currentUserId: userId,
      })

      // If we have a new user, initialize their data
      if (userId) {
        get().initializeStore()
      }
    }
  },

  initializeStore: async () => {
    const state = get()
    if (state.initialized && state.currentUserId) {
      console.log("Store already initialized for user:", state.currentUserId)
      return
    }

    console.log("Initializing store for user:", state.currentUserId)

    try {
      await get().fetchMeals()
      set({ initialized: true })
    } catch (error) {
      console.error("Failed to initialize store:", error)
    }
  },

  fetchMeals: async (date, month) => {
    set({ loading: true, error: null })
    try {
      let url = "/api/meals"
      const params = new URLSearchParams()

      if (date) {
        params.append("date", date)
        console.log("Fetching meals for specific date:", date)
      } else if (month) {
        params.append("month", month)
        console.log("Fetching meals for month:", month)
      } else {
        console.log("Fetching ALL meals (no date/month filter)")
      }

      if (params.toString()) {
        url += `?${params.toString()}`
      }

      console.log("Fetching meals from:", url)

      const response = await fetch(url, {
        credentials: "include", // Ensure cookies are sent
        cache: "no-store", // Force fresh data
      })

      if (response.status === 401) {
        console.log("User not authenticated, clearing meals")
        set({ meals: [], loading: false, initialized: false, currentUserId: null })
        return
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("Fetch meals error:", errorData)
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const rawData: RawMeal[] = await response.json()
      console.log("Fetched raw meals for current user:", rawData.length)

      if (date) {
        console.log("Fetched meals for date", date, ":", rawData.length)
      } else if (month) {
        console.log("Fetched meals for month", month, ":", rawData.length)
      } else {
        console.log("Fetched ALL meals:", rawData.length)
        console.log(
          "Date range:",
          rawData.length > 0 ? `${rawData[rawData.length - 1]?.date} to ${rawData[0]?.date}` : "No meals",
        )
      }

      // Normalize the data to ensure consistent field names
      const normalizedMeals = rawData.map(normalizeMeal)

      console.log("Normalized meals:", normalizedMeals.length)

      set({ meals: normalizedMeals, loading: false })
    } catch (error) {
      console.error("Error fetching meals:", error)
      set({
        error: error instanceof Error ? error.message : "An error occurred while fetching meals",
        loading: false,
      })
    }
  },

  addMeal: async (meal) => {
    set({ loading: true, error: null })
    try {
      console.log("Adding meal for current user:", meal)

      // Validate meal data before sending
      if (!meal.date || !meal.name || !meal.calories || !meal.mealType) {
        throw new Error("Missing required meal data")
      }

      const response = await fetch("/api/meals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Ensure cookies are sent
        body: JSON.stringify(meal),
      })

      console.log("Add meal response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("Add meal error response:", errorData)
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const rawNewMeal: RawMeal = await response.json()
      console.log("Raw meal added successfully:", rawNewMeal)

      // Normalize the new meal data
      const normalizedMeal = normalizeMeal(rawNewMeal)

      set((state) => ({
        meals: [normalizedMeal, ...state.meals],
        loading: false,
      }))
    } catch (error) {
      console.error("Error adding meal:", error)
      set({
        error: error instanceof Error ? error.message : "An error occurred while adding the meal",
        loading: false,
      })
      throw error
    }
  },

  removeMeal: async (mealId) => {
    set({ loading: true, error: null })
    try {
      console.log("Removing meal:", mealId, "type:", typeof mealId)

      // Ensure mealId is a number
      const id = typeof mealId === "string" ? Number.parseInt(mealId) : mealId
      if (isNaN(id)) {
        throw new Error("Invalid meal ID")
      }

      const response = await fetch(`/api/meals/${id}`, {
        method: "DELETE",
        credentials: "include",
      })

      console.log("Remove meal response status:", response.status)

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        try {
          const errorData = await response.json()
          console.error("Remove meal error response:", errorData)
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError)
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log("Meal removed successfully:", result)

      set((state) => ({
        meals: state.meals.filter((meal) => meal.id !== id),
        loading: false,
      }))
    } catch (error) {
      console.error("Error removing meal:", error)
      set({
        error: error instanceof Error ? error.message : "An error occurred while removing the meal",
        loading: false,
      })
      throw error
    }
  },

  updateMeal: async (mealId, updatedMeal) => {
    set({ loading: true, error: null })
    try {
      console.log("Updating meal:", mealId, updatedMeal)

      const response = await fetch(`/api/meals/${mealId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updatedMeal),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("Update meal error:", errorData)
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const rawUpdated: RawMeal = await response.json()
      console.log("Meal updated successfully")

      // Normalize the updated meal data
      const normalizedMeal = normalizeMeal(rawUpdated)

      set((state) => ({
        meals: state.meals.map((meal) => (meal.id === mealId ? normalizedMeal : meal)),
        loading: false,
      }))
    } catch (error) {
      console.error("Error updating meal:", error)
      set({
        error: error instanceof Error ? error.message : "An error occurred while updating the meal",
        loading: false,
      })
      throw error
    }
  },
}))
