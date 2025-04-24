"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface Meal {
  id: string
  date: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface MealStore {
  meals: Meal[]
  addMeal: (meal: Meal) => void
  removeMeal: (id: string) => void
}

// Create some sample meals for demonstration
const today = new Date()
const todayStr = today.toISOString().split("T")[0]
const yesterdayStr = new Date(today.setDate(today.getDate() - 1)).toISOString().split("T")[0]

const initialMeals: Meal[] = [
  {
    id: "1",
    date: todayStr,
    name: "Breakfast",
    calories: 450,
    protein: 20,
    carbs: 50,
    fat: 15,
  },
  {
    id: "2",
    date: todayStr,
    name: "Lunch",
    calories: 650,
    protein: 35,
    carbs: 70,
    fat: 18,
  },
  {
    id: "3",
    date: yesterdayStr,
    name: "Dinner",
    calories: 550,
    protein: 30,
    carbs: 45,
    fat: 18,
  },
]

// In store.ts
export const useMealStore = create<MealStore>()(
  persist(
    (set) => ({
      meals: initialMeals,
      addMeal: (meal) => set((state) => ({ meals: [...state.meals, meal] })),
      removeMeal: (id: string) => set((state) => ({
        meals: state.meals.filter((meal) => meal.id !== id)
      }))
    }),
    {
      name: "meal-storage",
    },
  )
)