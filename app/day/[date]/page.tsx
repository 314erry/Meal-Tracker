"use client"

import { useState, useEffect, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Trash2, Plus, Loader2, Edit, Check, X } from "lucide-react"
import { useMealStore, type MealType, type ServingInfo } from "@/lib/store"
import { FoodSearch } from "@/components/food-search"
import { ServingSelector } from "@/components/serving-selector"

export default function DayPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = use(params)
  const router = useRouter()
  const { meals, addMeal, removeMeal, updateMeal, error: storeError, clearError, fetchMeals } = useMealStore()

  // Force refresh data when page loads and when date changes
  useEffect(() => {
    console.log("DayPage mounted/date changed for date:", date)
    console.log("Current meals in store:", meals.length)

    // Always fetch fresh data for this specific date
    const refreshData = async () => {
      try {
        await fetchMeals(date)
        console.log("Data refreshed for date:", date)
      } catch (error) {
        console.error("Error refreshing data:", error)
      }
    }

    refreshData()
  }, [date]) // Remove fetchMeals from dependencies to avoid infinite loops

  // Also refresh when returning to this page (visibility change)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("Page became visible, refreshing data for date:", date)
        fetchMeals(date)
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [date, fetchMeals])

  const [mealName, setMealName] = useState("")
  const [originalFoodName, setOriginalFoodName] = useState("")
  const [calories, setCalories] = useState("")
  const [protein, setProtein] = useState("")
  const [carbs, setCarbs] = useState("")
  const [fat, setFat] = useState("")
  const [mealType, setMealType] = useState<MealType>("Breakfast")
  const [isAddingManually, setIsAddingManually] = useState(false)
  const [selectedFood, setSelectedFood] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingMeal, setEditingMeal] = useState<any>(null)
  const [serving, setServing] = useState<ServingInfo>({
    quantity: 1,
    unit: "serving",
    weight: 100,
  })
  const [altMeasures, setAltMeasures] = useState<any[]>([])
  const [foodImage, setFoodImage] = useState<string | null>(null)

  // Filter meals for this specific date
  const dayMeals = meals.filter((meal) => meal.date === date)

  // Group meals by type - now using only mealType since data is normalized
  const mealsByType = dayMeals.reduce(
    (acc, meal) => {
      const type = meal.mealType
      console.log("Processing meal for grouping:", meal.name, "type:", type)

      if (!type) {
        console.warn("Meal without type:", meal)
        return acc
      }

      if (!acc[type]) {
        acc[type] = []
      }
      acc[type].push(meal)
      return acc
    },
    {} as Record<MealType, typeof dayMeals>,
  )

  console.log("Meals grouped by type:", mealsByType)

  // Calculate totals
  const totalCalories = dayMeals.reduce((sum, meal) => sum + meal.calories, 0)
  const totalProtein = dayMeals.reduce((sum, meal) => sum + meal.protein, 0)
  const totalCarbs = dayMeals.reduce((sum, meal) => sum + meal.carbs, 0)
  const totalFat = dayMeals.reduce((sum, meal) => sum + meal.fat, 0)

  const handleAddMeal = async () => {
    if (mealName && calories) {
      console.log("Adding meal for date:", date, "type:", mealType)

      try {
        await addMeal({
          date,
          name: mealName,
          originalName: originalFoodName || undefined,
          calories: Number(calories),
          protein: Number(protein) || 0,
          carbs: Number(carbs) || 0,
          fat: Number(fat) || 0,
          mealType,
          serving,
          altMeasures,
          imageUrl: foodImage || undefined,
        })

        console.log("Meal added successfully, refreshing data...")

        // Force refresh meals for this date after adding
        await fetchMeals(date)

        console.log("Data refreshed after adding meal")
        resetForm()
      } catch (error) {
        console.error("Error adding meal:", error)
      }
    }
  }

  const resetForm = () => {
    setMealName("")
    setOriginalFoodName("")
    setCalories("")
    setProtein("")
    setCarbs("")
    setFat("")
    setSelectedFood(null)
    setIsAddingManually(false)
    setServing({
      quantity: 1,
      unit: "serving",
      weight: 100,
    })
    setAltMeasures([])
    setFoodImage(null)
    setEditingMeal(null)
  }

  const handleSelectFood = async (foodName: string, originalName?: string) => {
    setSelectedFood(foodName)
    setLoading(true)
    setError(null)

    if (originalName) {
      setOriginalFoodName(originalName)
    }

    try {
      const response = await fetch("/api/nutritionix/nutrients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ foodName }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to get nutrition information")
      }

      const data = await response.json()

      if (data.foods && data.foods.length > 0) {
        const food = data.foods[0]

        setMealName(food.food_name)

        if (food.original_food_name) {
          setOriginalFoodName(food.original_food_name)
        }

        const newCalories = Math.round(food.nf_calories)
        const newProtein = Math.round(food.nf_protein)
        const newCarbs = Math.round(food.nf_total_carbohydrate)
        const newFat = Math.round(food.nf_total_fat)

        setCalories(newCalories.toString())
        setProtein(newProtein.toString())
        setCarbs(newCarbs.toString())
        setFat(newFat.toString())

        const newServing = {
          quantity: food.serving_qty || 1,
          unit: food.serving_unit || "porção",
          originalUnit: food.original_serving_unit || food.serving_unit || "serving",
          weight: food.serving_weight_grams || 100,
        }
        setServing(newServing)

        if (food.alt_measures && food.alt_measures.length > 0) {
          setAltMeasures(food.alt_measures)
        }

        if (food.photo && food.photo.thumb) {
          setFoodImage(food.photo.thumb)
        }
      } else {
        throw new Error("No nutrition data found for this food")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      console.error("Error getting nutrition information:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleEditMeal = (meal: any) => {
    setEditingMeal(meal)
    setMealName(meal.name)
    setOriginalFoodName(meal.originalName || "")
    setCalories(meal.calories.toString())
    setProtein(meal.protein.toString())
    setCarbs(meal.carbs.toString())
    setFat(meal.fat.toString())
    setMealType(meal.mealType) // Now only using mealType

    const mealServing = meal.serving || {
      quantity: 1,
      unit: "porção",
      originalUnit: "serving",
      weight: 100,
    }
    setServing(mealServing)

    setAltMeasures(meal.altMeasures || [])
    setFoodImage(meal.imageUrl || null)
    setIsAddingManually(true)
  }

  const handleUpdateMeal = async () => {
    if (editingMeal && editingMeal.id && mealName && calories) {
      console.log("Updating meal:", editingMeal.id, "type:", mealType)

      try {
        const updatedMeal = {
          ...editingMeal,
          name: mealName,
          originalName: originalFoodName || undefined,
          calories: Number(calories),
          protein: Number(protein) || 0,
          carbs: Number(carbs) || 0,
          fat: Number(fat) || 0,
          mealType,
          serving,
          altMeasures,
          imageUrl: foodImage || undefined,
        }

        await updateMeal(editingMeal.id, updatedMeal)

        console.log("Meal updated successfully, refreshing data...")

        // Force refresh meals for this date after updating
        await fetchMeals(date)

        console.log("Data refreshed after updating meal")
        resetForm()
      } catch (error) {
        console.error("Error updating meal:", error)
      }
    }
  }

  const handleRemoveMeal = async (meal: any) => {
    if (meal.id) {
      console.log("Removing meal:", meal.id)

      try {
        await removeMeal(meal.id)

        console.log("Meal removed successfully, refreshing data...")

        // Force refresh meals for this date after removing
        await fetchMeals(date)

        console.log("Data refreshed after removing meal")
      } catch (error) {
        console.error("Error removing meal:", error)
      }
    }
  }

  const handleServingChange = useCallback(
    (newServing: ServingInfo, nutritionData: { calories: number; protein: number; carbs: number; fat: number }) => {
      setServing(newServing)
      setCalories(nutritionData.calories.toString())
      setProtein(nutritionData.protein.toString())
      setCarbs(nutritionData.carbs.toString())
      setFat(nutritionData.fat.toString())
    },
    [],
  )

  const dateObj = new Date(date + "T12:00:00Z")
  const formattedDate = format(dateObj, "d 'de' MMMM 'de' yyyy", { locale: ptBR })

  const translateMealType = (type: MealType): string => {
    switch (type) {
      case "Breakfast":
        return "Café da Manhã"
      case "Lunch":
        return "Almoço"
      case "Dinner":
        return "Jantar"
      case "Snack":
        return "Lanche"
      default:
        return type
    }
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Refeições para {formattedDate}</h1>
        <button className="button button-outline" onClick={() => router.push("/")}>
          Voltar ao Calendário
        </button>
      </div>

      {storeError && (
        <div className="error-banner">
          <p>{storeError}</p>
          <button onClick={clearError} className="button button-outline">
            Fechar
          </button>
        </div>
      )}

      <div className="grid-layout">
        <div className="card span-two">
          <div className="card-header">
            <h2 className="card-title">Refeições de Hoje</h2>
            <p className="card-description">Todas as refeições registradas para {formattedDate}</p>
          </div>
          <div className="card-content">
            {Object.keys(mealsByType).length > 0 ? (
              <div className="meals-by-type">
                {(["Breakfast", "Lunch", "Dinner", "Snack"] as MealType[]).map(
                  (type) =>
                    mealsByType[type] &&
                    mealsByType[type].length > 0 && (
                      <div key={type} className="meal-type-section">
                        <h3 className="meal-type-title">{translateMealType(type)}</h3>
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th style={{ width: "40px" }}></th>
                              <th>Alimento</th>
                              <th>Porção</th>
                              <th>Calorias</th>
                              <th>Proteína (g)</th>
                              <th>Carboidratos (g)</th>
                              <th>Gordura (g)</th>
                              <th style={{ width: "80px" }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {mealsByType[type].map((meal, index) => {
                              return (
                                <tr key={meal.id || index}>
                                  <td>
                                    {meal.imageUrl && (
                                      <img
                                        src={meal.imageUrl || "/placeholder.svg"}
                                        alt={meal.name}
                                        className="food-thumbnail"
                                      />
                                    )}
                                  </td>
                                  <td>{meal.name}</td>
                                  <td>{meal.serving ? `${meal.serving.quantity} ${meal.serving.unit}` : "1 porção"}</td>
                                  <td>{meal.calories}</td>
                                  <td>{meal.protein}</td>
                                  <td>{meal.carbs}</td>
                                  <td>{meal.fat}</td>
                                  <td>
                                    <div className="action-buttons">
                                      <button
                                        className="button-icon"
                                        onClick={() => handleEditMeal(meal)}
                                        title="Editar refeição"
                                      >
                                        <Edit className="icon-small" />
                                      </button>
                                      <button
                                        className="button-icon"
                                        onClick={() => handleRemoveMeal(meal)}
                                        title="Excluir refeição"
                                      >
                                        <Trash2 className="icon-small" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    ),
                )}
                <div className="meal-totals">
                  <h3 className="meal-type-title">Totais Diários</h3>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Calorias</th>
                        <th>Proteína (g)</th>
                        <th>Carboidratos (g)</th>
                        <th>Gordura (g)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="total-row">
                        <td>{totalCalories}</td>
                        <td>{totalProtein}</td>
                        <td>{totalCarbs}</td>
                        <td>{totalFat}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="empty-table-message">Nenhuma refeição registrada para hoje</p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">{editingMeal ? "Editar Refeição" : "Adicionar Nova Refeição"}</h2>
            <p className="card-description">
              {editingMeal ? "Atualizar informações da refeição" : "Registre o que você comeu hoje"}
            </p>
          </div>
          <div className="card-content">
            {!isAddingManually && !selectedFood && !editingMeal && <FoodSearch onSelectFood={handleSelectFood} />}

            {(isAddingManually || selectedFood || editingMeal) && (
              <div className="form-grid">
                <div className="food-header">
                  {foodImage && <img src={foodImage || "/placeholder.svg"} alt={mealName} className="food-image" />}
                  <div className="food-name-container">
                    <h3 className="food-name">{mealName}</h3>
                  </div>
                </div>

                {(altMeasures && altMeasures.length > 0) || serving ? (
                  <div className="form-group">
                    <label className="form-label">Tamanho da Porção</label>
                    <ServingSelector
                      initialQuantity={serving.quantity}
                      initialUnit={serving.originalUnit || serving.unit}
                      foodName={mealName}
                      originalFoodName={originalFoodName} // Pass this to determine if from search
                      altMeasures={altMeasures}
                      onServingChange={handleServingChange}
                      calories={Number(calories)}
                    />
                  </div>
                ) : null}

                <div className="form-group">
                  <label htmlFor="meal-type" className="form-label">
                    Tipo de Refeição
                  </label>
                  <select
                    id="meal-type"
                    className="form-input"
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value as MealType)}
                  >
                    <option value="Breakfast">Café da Manhã</option>
                    <option value="Lunch">Almoço</option>
                    <option value="Dinner">Jantar</option>
                    <option value="Snack">Lanche</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="meal-name" className="form-label">
                    Nome do Alimento
                  </label>
                  <input
                    id="meal-name"
                    className="form-input"
                    value={mealName}
                    onChange={(e) => setMealName(e.target.value)}
                    placeholder="ex: Aveia, Frango"
                  />
                </div>

                <div className="nutrition-grid">
                  <div className="form-group">
                    <label htmlFor="calories" className="form-label">
                      Calorias
                    </label>
                    <input
                      id="calories"
                      className="form-input"
                      type="number"
                      value={calories}
                      onChange={(e) => setCalories(e.target.value)}
                      placeholder="ex: 500"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="protein" className="form-label">
                      Proteína (g)
                    </label>
                    <input
                      id="protein"
                      className="form-input"
                      type="number"
                      value={protein}
                      onChange={(e) => setProtein(e.target.value)}
                      placeholder="ex: 20"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="carbs" className="form-label">
                      Carboidratos (g)
                    </label>
                    <input
                      id="carbs"
                      className="form-input"
                      type="number"
                      value={carbs}
                      onChange={(e) => setCarbs(e.target.value)}
                      placeholder="ex: 50"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="fat" className="form-label">
                      Gordura (g)
                    </label>
                    <input
                      id="fat"
                      className="form-input"
                      type="number"
                      value={fat}
                      onChange={(e) => setFat(e.target.value)}
                      placeholder="ex: 15"
                    />
                  </div>
                </div>
              </div>
            )}

            {error && <p className="error-message">{error}</p>}

            <div className="form-actions">
              {!isAddingManually && !selectedFood && !editingMeal ? (
                <button className="button button-outline full-width" onClick={() => setIsAddingManually(true)}>
                  <Plus className="icon-small" /> Adicionar Alimento Manualmente
                </button>
              ) : (
                <>
                  <button className="button button-outline" onClick={resetForm}>
                    <X className="icon-small" /> Cancelar
                  </button>
                  <button
                    className="button button-primary"
                    onClick={editingMeal ? handleUpdateMeal : handleAddMeal}
                    disabled={loading || !mealName || !calories}
                  >
                    {loading ? (
                      <Loader2 className="icon-small animate-spin" />
                    ) : editingMeal ? (
                      <>
                        <Check className="icon-small" /> Atualizar Refeição
                      </>
                    ) : (
                      <>
                        <Plus className="icon-small" /> Adicionar Refeição
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .meals-by-type {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .meal-type-section {
          margin-bottom: 1rem;
        }
        .meal-type-title {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          padding-bottom: 0.25rem;
          border-bottom: 1px solid var(--color-card-border);
        }
        .meal-totals {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 2px solid var(--color-card-border);
        }
        .form-actions {
          display: flex;
          justify-content: ${isAddingManually || selectedFood || editingMeal ? "space-between" : "center"};
          margin-top: 1rem;
        }
        .error-message {
          color: var(--color-error);
          margin-top: 1rem;
          font-size: 0.875rem;
        }
        .food-thumbnail {
          width: 32px;
          height: 32px;
          object-fit: cover;
          border-radius: 4px;
        }
        .action-buttons {
          display: flex;
          gap: 0.5rem;
        }
        .food-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .food-image {
          width: 60px;
          height: 60px;
          object-fit: cover;
          border-radius: 6px;
        }
        .food-name-container {
          flex: 1;
        }
        .food-name {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0;
        }
        .nutrition-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .error-banner {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 1rem;
          border-radius: var(--border-radius);
          margin-bottom: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
      `}</style>
    </div>
  )
}
