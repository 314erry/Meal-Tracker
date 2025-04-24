"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Trash2 } from "lucide-react"
import { useMealStore } from "@/lib/store"

export default function DayPage({ params }: { params: Promise<{ date: string }> }) {
  const router = useRouter()
  const [date, setDate] = useState<string | null>(null)
  const { meals, addMeal, removeMeal } = useMealStore()

  // Unwrap params and set the date
  useEffect(() => {
    params
      .then((resolvedParams) => {
        setDate(resolvedParams.date)
      })
      .catch((error) => {
        console.error("Failed to resolve params:", error)
      })
  }, [params])

  // Log the date parameter for debugging
  useEffect(() => {
    if (date) {
      console.log("Date parameter in DayPage:", date)
    }
  }, [date])

  const [mealName, setMealName] = useState("")
  const [calories, setCalories] = useState("")
  const [protein, setProtein] = useState("")
  const [carbs, setCarbs] = useState("")
  const [fat, setFat] = useState("")

  const dayMeals = date ? meals.filter((meal) => meal.date === date) : []

  const totalCalories = dayMeals.reduce((sum, meal) => sum + meal.calories, 0)
  const totalProtein = dayMeals.reduce((sum, meal) => sum + meal.protein, 0)
  const totalCarbs = dayMeals.reduce((sum, meal) => sum + meal.carbs, 0)
  const totalFat = dayMeals.reduce((sum, meal) => sum + meal.fat, 0)

  const handleAddMeal = () => {
    if (mealName && calories && date) {
      console.log("Adding meal for date:", date)

      addMeal({
        id: Math.random().toString(36).substr(2, 9),
        date,
        name: mealName,
        calories: Number(calories),
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0,
      })

      setMealName("")
      setCalories("")
      setProtein("")
      setCarbs("")
      setFat("")
    }
  }

  const dateObj = date ? new Date(date + "T12:00:00Z") : null
  const formattedDate = dateObj ? format(dateObj, "MMMM d, yyyy") : "Loading..."

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Meals for {formattedDate}</h1>
        <button className="button button-outline" onClick={() => router.push("/")}>
          Back to Calendar
        </button>
      </div>

      <div className="grid-layout">
        <div className="card span-two">
          <div className="card-header">
            <h2 className="card-title">Today's Meals</h2>
            <p className="card-description">All meals recorded for {formattedDate}</p>
          </div>
          <div className="card-content">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Meal</th>
                  <th>Calories</th>
                  <th>Protein (g)</th>
                  <th>Carbs (g)</th>
                  <th>Fat (g)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {dayMeals.length > 0 ? (
                  dayMeals.map((meal, index) => (
                    <tr key={index}>
                      <td>{meal.name}</td>
                      <td>{meal.calories}</td>
                      <td>{meal.protein}</td>
                      <td>{meal.carbs}</td>
                      <td>{meal.fat}</td>
                      <td>
                        <button
                          className="button-icon"
                          onClick={() => removeMeal(meal.id)}
                        >
                          <Trash2 className="icon-small" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="empty-table-message">
                      No meals recorded for today
                    </td>
                  </tr>
                )}
                {dayMeals.length > 0 && (
                  <tr className="total-row">
                    <td>Total</td>
                    <td>{totalCalories}</td>
                    <td>{totalProtein}</td>
                    <td>{totalCarbs}</td>
                    <td>{totalFat}</td>
                    <td></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Add New Meal</h2>
            <p className="card-description">Record what you ate today</p>
          </div>
          <div className="card-content">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="meal-name" className="form-label">
                  Meal Name
                </label>
                <input
                  id="meal-name"
                  className="form-input"
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                  placeholder="e.g., Breakfast, Lunch, Snack"
                />
              </div>
              <div className="form-group">
                <label htmlFor="calories" className="form-label">
                  Calories
                </label>
                <input
                  id="calories"
                  className="form-input"
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="e.g., 500"
                />
              </div>
              <div className="form-group">
                <label htmlFor="protein" className="form-label">
                  Protein (g)
                </label>
                <input
                  id="protein"
                  className="form-input"
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  placeholder="e.g., 20"
                />
              </div>
              <div className="form-group">
                <label htmlFor="carbs" className="form-label">
                  Carbs (g)
                </label>
                <input
                  id="carbs"
                  className="form-input"
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  placeholder="e.g., 50"
                />
              </div>
              <div className="form-group">
                <label htmlFor="fat" className="form-label">
                  Fat (g)
                </label>
                <input
                  id="fat"
                  className="form-input"
                  type="number"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  placeholder="e.g., 15"
                />
              </div>
            </div>
          </div>
          <div className="card-footer">
            <button className="button button-primary full-width" onClick={handleAddMeal}>
              Add Meal
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}