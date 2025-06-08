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
      if (date) {
        url += `?date=${date}`
      } else if (month) {
        url += `?month=${month}`
      }

      console.log("Fetching meals from:", url)

      const response = await fetch(url, {
        credentials: "include", // Ensure cookies are sent
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

      const data = await response.json()
      console.log("Fetched meals for current user:", data.length)
      set({ meals: data, loading: false })
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

      const newMeal = await response.json()
      console.log("Meal added successfully:", newMeal)

      set((state) => ({
        meals: [newMeal, ...state.meals],
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
      console.log("Removing meal:", mealId)

      const response = await fetch(`/api/meals/${mealId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("Remove meal error:", errorData)
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      console.log("Meal removed successfully")

      set((state) => ({
        meals: state.meals.filter((meal) => meal.id !== mealId),
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

      const updated = await response.json()
      console.log("Meal updated successfully")

      set((state) => ({
        meals: state.meals.map((meal) => (meal.id === mealId ? updated : meal)),
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
