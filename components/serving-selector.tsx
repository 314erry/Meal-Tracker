"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Loader2 } from "lucide-react"
import type { ServingInfo } from "@/lib/store"

interface ServingSelectorProps {
  initialQuantity: number
  initialUnit: string
  foodName: string
  altMeasures?: Array<{
    serving_weight: number
    measure: string
    seq: number | null
    qty: number
  }>
  onServingChange: (
    serving: ServingInfo,
    nutritionData: {
      calories: number
      protein: number
      carbs: number
      fat: number
    },
  ) => void
  calories: number
}

export function ServingSelector({
  initialQuantity,
  initialUnit,
  foodName,
  altMeasures,
  onServingChange,
  calories,
}: ServingSelectorProps) {
  const [quantity, setQuantity] = useState(initialQuantity)
  const [unit, setUnit] = useState(initialUnit)
  const [adjustedCalories, setAdjustedCalories] = useState(calories)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch nutrition data from API when measure changes
  const fetchNutritionData = useCallback(
    async (newQuantity: number, newUnit: string) => {
      if (!foodName) return

      setLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/nutritionix/measure", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            foodName,
            measure: newUnit,
            quantity: newQuantity,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to get nutrition information")
        }

        const data = await response.json()

        if (data.foods && data.foods.length > 0) {
          const food = data.foods[0]

          // Update the displayed calories
          const newCalories = Math.round(food.nf_calories)
          setAdjustedCalories(newCalories)

          // Find the serving weight for this measure
          const servingWeight = food.serving_weight_grams || 100

          // Create the serving info object
          const newServing: ServingInfo = {
            quantity: newQuantity,
            unit: newUnit,
            weight: servingWeight,
          }

          // Pass the updated serving and nutrition data to the parent
          onServingChange(newServing, {
            calories: newCalories,
            protein: Math.round(food.nf_protein),
            carbs: Math.round(food.nf_total_carbohydrate),
            fat: Math.round(food.nf_total_fat),
          })
        } else {
          throw new Error("No nutrition data found for this food")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        console.error("Error getting nutrition information:", err)
      } finally {
        setLoading(false)
      }
    },
    [foodName, onServingChange],
  )

  // Update nutrition when quantity or unit changes
  useEffect(() => {
    // Skip the initial render
    const isInitialRender = quantity === initialQuantity && unit === initialUnit
    if (isInitialRender) return

    // Debounce API calls to prevent too many requests
    const timer = setTimeout(() => {
      fetchNutritionData(quantity, unit)
    }, 500)

    return () => clearTimeout(timer)
  }, [quantity, unit, fetchNutritionData, initialQuantity, initialUnit])

  // Handle quantity change
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = Number.parseFloat(e.target.value) || 1
    setQuantity(newQuantity)
  }

  // Handle unit change
  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUnit(e.target.value)
  }

  return (
    <div className="serving-selector">
      <div className="serving-inputs">
        <div className="quantity-input">
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={quantity}
            onChange={handleQuantityChange}
            className="form-input"
          />
        </div>
        <div className="unit-select">
          <select value={unit} onChange={handleUnitChange} className="form-input">
            <option value="serving">serving</option>
            {altMeasures?.map((measure, index) => (
              <option key={index} value={measure.measure}>
                {measure.measure}
              </option>
            ))}
          </select>
        </div>
        <div className="calories-display">
          {loading ? (
            <Loader2 className="icon-small animate-spin" />
          ) : (
            <>
              <span>{adjustedCalories}</span>
              <span className="calorie-unit">Cal</span>
            </>
          )}
        </div>
      </div>
      {error && <p className="error-message">{error}</p>}

      <style jsx>{`
        .error-message {
          color: var(--color-error);
          font-size: 0.75rem;
          margin-top: 0.25rem;
        }
      `}</style>
    </div>
  )
}
