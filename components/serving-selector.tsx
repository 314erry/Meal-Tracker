"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Loader2 } from "lucide-react"
import type { ServingInfo } from "@/lib/store"

interface ServingSelectorProps {
  initialQuantity: number
  initialUnit: string
  foodName: string
  originalFoodName?: string // Add this to know if food came from search
  altMeasures?: Array<{
    serving_weight: number
    measure: string
    original_measure?: string
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
  originalFoodName,
  altMeasures,
  onServingChange,
  calories,
}: ServingSelectorProps) {
  const [quantity, setQuantity] = useState(initialQuantity)
  const [tempQuantity, setTempQuantity] = useState(initialQuantity.toString())
  const [isEditing, setIsEditing] = useState(false)
  const [unit, setUnit] = useState(initialUnit)
  const [adjustedCalories, setAdjustedCalories] = useState(calories)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Determine if this food came from the API search or was manually entered
  const isFromSearch = Boolean(originalFoodName)
  const searchFoodName = originalFoodName || foodName

  // Fetch nutrition data from API when measure changes
  const fetchNutritionData = useCallback(
    async (newQuantity: number, newUnit: string) => {
      // Only fetch nutrition data if the food came from search
      if (!isFromSearch) {
        console.log("Skipping API call for manually entered food:", foodName)

        // For manually entered foods, just calculate proportional calories
        const baseCalories = calories / initialQuantity
        const newCalories = Math.round(baseCalories * newQuantity)

        setAdjustedCalories(newCalories)

        // Create a basic serving info object
        const newServing: ServingInfo = {
          quantity: newQuantity,
          unit: newUnit,
          weight: 100, // Default weight
        }

        // Calculate proportional nutrition (basic estimation)
        const ratio = newQuantity / initialQuantity
        onServingChange(newServing, {
          calories: newCalories,
          protein: 0, // We don't have this data for manual entries
          carbs: 0,
          fat: 0,
        })

        return
      }

      if (!searchFoodName) {
        console.log("No food name available for API call")
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Find the original measure if available
        let originalMeasure = newUnit
        if (altMeasures) {
          const measureObj = altMeasures.find((m) => m.measure === newUnit || m.original_measure === newUnit)
          if (measureObj && measureObj.original_measure) {
            originalMeasure = measureObj.original_measure
          }
        }

        console.log(
          "Fetching nutrition data for:",
          searchFoodName,
          "measure:",
          originalMeasure,
          "quantity:",
          newQuantity,
        )

        const response = await fetch("/api/nutritionix/measure", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            foodName: searchFoodName,
            measure: originalMeasure, // Always use the original English measure for API calls
            quantity: newQuantity,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()

          // Handle specific "no foods found" error more gracefully
          if (errorData.error && errorData.error.includes("couldn't match any of your foods")) {
            console.log("Food not found in Nutritionix, falling back to proportional calculation")

            // Fall back to proportional calculation
            const baseCalories = calories / initialQuantity
            const newCalories = Math.round(baseCalories * newQuantity)

            setAdjustedCalories(newCalories)

            const newServing: ServingInfo = {
              quantity: newQuantity,
              unit: newUnit,
              weight: 100,
            }

            const ratio = newQuantity / initialQuantity
            onServingChange(newServing, {
              calories: newCalories,
              protein: 0,
              carbs: 0,
              fat: 0,
            })

            setError("Informações nutricionais detalhadas não disponíveis para este alimento")
            return
          }

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

          // Get the translated unit from the response
          const translatedUnit = food.serving_unit || newUnit

          // Create the serving info object
          const newServing: ServingInfo = {
            quantity: newQuantity,
            unit: translatedUnit,
            originalUnit: food.original_serving_unit || originalMeasure, // Store original English unit
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
        console.error("Error getting nutrition information:", err)

        // Fall back to proportional calculation on any error
        const baseCalories = calories / initialQuantity
        const newCalories = Math.round(baseCalories * newQuantity)

        setAdjustedCalories(newCalories)

        const newServing: ServingInfo = {
          quantity: newQuantity,
          unit: newUnit,
          weight: 100,
        }

        const ratio = newQuantity / initialQuantity
        onServingChange(newServing, {
          calories: newCalories,
          protein: 0,
          carbs: 0,
          fat: 0,
        })

        setError("Usando cálculo proporcional - informações detalhadas não disponíveis")
      } finally {
        setLoading(false)
      }
    },
    [searchFoodName, onServingChange, altMeasures, isFromSearch, foodName, calories, initialQuantity],
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

  // Handle quantity input changes during editing
  const handleQuantityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setTempQuantity(value)
  }

  // Handle when user focuses on the quantity input
  const handleQuantityFocus = () => {
    setIsEditing(true)
    setTempQuantity(quantity.toString())
  }

  // Handle when user leaves the quantity input
  const handleQuantityBlur = () => {
    setIsEditing(false)

    // Parse the temporary value
    const newQuantity = Number.parseFloat(tempQuantity)

    // If invalid, empty, or zero, reset to 1
    if (isNaN(newQuantity) || newQuantity <= 0 || tempQuantity.trim() === "") {
      setQuantity(1)
      setTempQuantity("1")
    } else {
      setQuantity(newQuantity)
      setTempQuantity(newQuantity.toString())
    }
  }

  // Handle Enter key press to confirm input
  const handleQuantityKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur() // This will trigger handleQuantityBlur
    }
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
            value={isEditing ? tempQuantity : quantity}
            onChange={handleQuantityInputChange}
            onFocus={handleQuantityFocus}
            onBlur={handleQuantityBlur}
            onKeyPress={handleQuantityKeyPress}
            className="form-input"
          />
        </div>
        <div className="unit-select">
          <select value={unit} onChange={handleUnitChange} className="form-input">
            <option value="serving">porção</option>
            {altMeasures?.map((measure, index) => (
              <option key={index} value={measure.original_measure || measure.measure}>
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
      {!isFromSearch && (
        <p className="info-message">Alimento adicionado manualmente - usando cálculo proporcional de calorias</p>
      )}

      <style jsx>{`
        .error-message {
          color: var(--color-warning);
          font-size: 0.75rem;
          margin-top: 0.25rem;
        }
        .info-message {
          color: var(--color-muted);
          font-size: 0.75rem;
          margin-top: 0.25rem;
          font-style: italic;
        }
      `}</style>
    </div>
  )
}
