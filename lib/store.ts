"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snack"

export interface ServingInfo {
  quantity: number
  unit: string
  weight: number
  originalUnit?: string // Add original English unit
}

export interface Meal {
  date: string
  name: string
  originalName?: string // Add original English name
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
    original_measure?: string // Add original English measure
    seq: number | null
    qty: number
  }>
  imageUrl?: string
}

interface MealStore {
  meals: Meal[]
  addMeal: (meal: Meal) => void
  removeMeal: (mealToRemove: Meal) => void
  updateMeal: (oldMeal: Meal, updatedMeal: Meal) => void
  migrateMeals: () => void
}

// Create some sample meals for demonstration
const today = new Date()
const todayStr = today.toISOString().split("T")[0]
const yesterdayStr = new Date(today.setDate(today.getDate() - 1)).toISOString().split("T")[0]

const initialMeals: Meal[] = [
  {
    date: todayStr,
    name: "Aveia com Frutas Vermelhas",
    originalName: "Oatmeal with Berries",
    calories: 450,
    protein: 20,
    carbs: 50,
    fat: 15,
    mealType: "Breakfast",
    serving: {
      quantity: 1,
      unit: "tigela",
      originalUnit: "bowl",
      weight: 240,
    },
  },
  {
    date: todayStr,
    name: "Salada de Frango Grelhado",
    originalName: "Grilled Chicken Salad",
    calories: 650,
    protein: 35,
    carbs: 70,
    fat: 20,
    mealType: "Lunch",
    serving: {
      quantity: 1,
      unit: "porção",
      originalUnit: "serving",
      weight: 350,
    },
  },
  {
    date: yesterdayStr,
    name: "Salmão com Legumes",
    originalName: "Salmon with Vegetables",
    calories: 550,
    protein: 30,
    carbs: 45,
    fat: 18,
    mealType: "Dinner",
    serving: {
      quantity: 1,
      unit: "prato",
      originalUnit: "plate",
      weight: 300,
    },
  },
]

// Helper function to determine meal type based on name or time
function guessMealType(meal: any): MealType {
  const name = meal.name.toLowerCase()

  // Check for meal type in name
  if (name.includes("breakfast") || name.includes("oatmeal") || name.includes("cereal") || name.includes("toast")) {
    return "Breakfast"
  }
  if (name.includes("lunch") || name.includes("sandwich") || name.includes("salad")) {
    return "Lunch"
  }
  if (name.includes("dinner") || name.includes("supper")) {
    return "Dinner"
  }
  if (name.includes("snack")) {
    return "Snack"
  }

  // Default assignment based on meal name
  if (name.includes("egg") || name.includes("bacon") || name.includes("pancake") || name.includes("waffle")) {
    return "Breakfast"
  }

  // Default to Lunch as a fallback
  return "Lunch"
}

export const useMealStore = create<MealStore>()(
  persist(
    (set, get) => ({
      meals: initialMeals, // Start with sample data
      addMeal: (meal) =>
        set((state) => ({
          meals: [...state.meals, meal],
        })),
      removeMeal: (mealToRemove) =>
        set((state) => ({
          meals: state.meals.filter((meal) => meal !== mealToRemove),
        })),
      updateMeal: (oldMeal, updatedMeal) =>
        set((state) => ({
          meals: state.meals.map((meal) => (meal === oldMeal ? updatedMeal : meal)),
        })),
      migrateMeals: () => {
        set((state) => {
          // Check if any meals are missing the mealType field
          const needsMigration = state.meals.some((meal) => !("mealType" in meal))

          if (!needsMigration) {
            console.log("No migration needed")
            return state
          }

          console.log("Migrating meals to include mealType")

          // Migrate meals to include mealType
          const migratedMeals = state.meals.map((meal) => {
            if ("mealType" in meal) {
              return meal
            }

            // Add mealType to meals that don't have it
            return {
              ...meal,
              mealType: guessMealType(meal),
              serving: meal.serving || {
                quantity: 1,
                unit: "serving",
                weight: 100,
              },
            }
          })

          return { meals: migratedMeals }
        })
      },
    }),
    {
      name: "meal-storage",
    },
  ),
)
