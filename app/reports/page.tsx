"use client"

import { useState, useEffect } from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns"
import { useRouter } from "next/navigation"
import { useMealStore } from "@/lib/store"
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
} from "chart.js"
import { Pie, Bar } from "react-chartjs-2"

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title)

export default function ReportsPage() {
  const router = useRouter()
  const { meals } = useMealStore()
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"))
  const [chartData, setChartData] = useState<{ pie: any; bar: any }>({ pie: null, bar: null })

  // Get available months from meal data
  const availableMonths = [...new Set(meals.map((meal) => meal.date.substring(0, 7)))].sort()

  // If no months with data, default to current month
  useEffect(() => {
    if (availableMonths.length > 0 && !availableMonths.includes(selectedMonth)) {
      setSelectedMonth(availableMonths[availableMonths.length - 1])
    }
  }, [availableMonths, selectedMonth])

  // Filter meals for selected month
  const monthMeals = meals.filter((meal) => meal.date.startsWith(selectedMonth))

  // Calculate nutrition totals
  const totalCalories = monthMeals.reduce((sum, meal) => sum + meal.calories, 0)
  const totalProtein = monthMeals.reduce((sum, meal) => sum + meal.protein, 0)
  const totalCarbs = monthMeals.reduce((sum, meal) => sum + meal.carbs, 0)
  const totalFat = monthMeals.reduce((sum, meal) => sum + meal.fat, 0)

  // Calculate averages
  const daysWithMeals = monthMeals.length > 0 ? new Set(monthMeals.map((meal) => meal.date)).size : 1
  const avgCaloriesPerDay = Math.round(totalCalories / daysWithMeals)
  const avgProteinPerDay = Math.round(totalProtein / daysWithMeals)
  const avgCarbsPerDay = Math.round(totalCarbs / daysWithMeals)
  const avgFatPerDay = Math.round(totalFat / daysWithMeals)

  // Calculate adherence
  const calorieTarget = 2000
  const daysInSelectedMonth = selectedMonth
    ? eachDayOfInterval({
        start: startOfMonth(new Date(`${selectedMonth}-01T12:00:00Z`)),
        end: endOfMonth(new Date(`${selectedMonth}-01T12:00:00Z`)),
      }).length
    : 30

  const totalMonthlyTarget = calorieTarget * daysInSelectedMonth
  const adherenceRate =
    totalMonthlyTarget > 0 ? Math.min(100, Math.round((totalCalories / totalMonthlyTarget) * 100)) : 0

  // Prepare daily data for chart
  const dailyData = selectedMonth
    ? eachDayOfInterval({
        start: startOfMonth(new Date(`${selectedMonth}-01T12:00:00Z`)),
        end: endOfMonth(new Date(`${selectedMonth}-01T12:00:00Z`)),
      }).map((day) => {
        const dateStr = format(day, "yyyy-MM-dd")
        const dayMeals = meals.filter((meal) => meal.date === dateStr)
        const calories = dayMeals.reduce((sum, meal) => sum + meal.calories, 0)
        return {
          date: format(day, "dd"),
          calories,
          target: calorieTarget,
        }
      })
    : []

  // Update chart data when meals or selected month changes
  useEffect(() => {
    // Only create pie chart if there's data
    const hasMacroData = totalProtein > 0 || totalCarbs > 0 || totalFat > 0

    const pieData = hasMacroData
      ? {
          labels: ["Protein", "Carbs", "Fat"],
          datasets: [
            {
              data: [totalProtein, totalCarbs, totalFat],
              backgroundColor: ["#10b981", "#3b82f6", "#f59e0b"],
              borderColor: ["#059669", "#2563eb", "#d97706"],
              borderWidth: 1,
            },
          ],
        }
      : null

    const barData = {
      labels: dailyData.map((item) => item.date),
      datasets: [
        {
          label: "Calories",
          data: dailyData.map((item) => item.calories),
          backgroundColor: "#10b981",
        },
        {
          label: "Target",
          data: dailyData.map(() => calorieTarget),
          type: "line" as const,
          borderColor: "#6366f1",
          borderDash: [5, 5],
          backgroundColor: "transparent",
          fill: false,
        },
      ],
    }

    setChartData({ pie: pieData, bar: barData })
  }, [selectedMonth, meals, totalProtein, totalCarbs, totalFat])

  const DonutProgress = ({ percentage }: { percentage: number }) => {
    const radius = 60
    const stroke = 10
    const normalizedRadius = radius - stroke / 2
    const circumference = normalizedRadius * 2 * Math.PI
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    return (
      <div style={{ width: "140px", height: "140px", margin: "0 auto" }}>
        <svg height="140" width="140">
          <circle stroke="#2e2e2e" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx="70" cy="70" />
          <circle
            stroke="var(--color-primary)"
            fill="transparent"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference + " " + circumference}
            strokeDashoffset={strokeDashoffset}
            r={normalizedRadius}
            cx="70"
            cy="70"
            transform="rotate(-90 70 70)"
          />
          <text
            x="50%"
            y="50%"
            dominantBaseline="middle"
            textAnchor="middle"
            fontSize="32px"
            fill="white"
            fontWeight="bold"
          >
            {percentage}%
          </text>
        </svg>
      </div>
    )
  }

  // Determine if we have enough data to show the pie chart
  const hasMacroData = totalProtein > 0 || totalCarbs > 0 || totalFat > 0

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Monthly Report</h1>
        <button className="button button-outline" onClick={() => router.push("/")}>
          Back to Calendar
        </button>
      </div>

      <div className="select-container">
        <select className="month-select" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
          {availableMonths.length > 0 ? (
            availableMonths.map((month) => (
              <option key={month} value={month}>
                {format(new Date(`${month}-01T12:00:00Z`), "MMMM yyyy")}
              </option>
            ))
          ) : (
            <option value={selectedMonth}>{format(new Date(`${selectedMonth}-01T12:00:00Z`), "MMMM yyyy")}</option>
          )}
        </select>
      </div>

      <div className="full-width-section">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Monthly Nutrition Summary</h2>
            <p className="card-description">
              Overview of your nutritional intake for {format(new Date(`${selectedMonth}-01T12:00:00Z`), "MMMM yyyy")}
            </p>
          </div>
          <div className="card-content">
            {monthMeals.length > 0 ? (
              <div className="nutrition-summary">
                <div className="nutrition-item">
                  <div className="nutrition-icon calories">
                    <span>{totalCalories}</span>
                  </div>
                  <div className="nutrition-details">
                    <h3>Total Calories</h3>
                    <p>{avgCaloriesPerDay} per day</p>
                  </div>
                </div>

                <div className="nutrition-item">
                  <div className="nutrition-icon protein">
                    <span>{totalProtein}g</span>
                  </div>
                  <div className="nutrition-details">
                    <h3>Total Protein</h3>
                    <p>{avgProteinPerDay}g per day</p>
                  </div>
                </div>

                <div className="nutrition-item">
                  <div className="nutrition-icon carbs">
                    <span>{totalCarbs}g</span>
                  </div>
                  <div className="nutrition-details">
                    <h3>Total Carbs</h3>
                    <p>{avgCarbsPerDay}g per day</p>
                  </div>
                </div>

                <div className="nutrition-item">
                  <div className="nutrition-icon fat">
                    <span>{totalFat}g</span>
                  </div>
                  <div className="nutrition-details">
                    <h3>Total Fat</h3>
                    <p>{avgFatPerDay}g per day</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-data-message">
                <p>No meal data available for this month</p>
                <p>Add meals to see your nutrition summary</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid-layout">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Macronutrient Distribution</h2>
            <p className="card-description">Monthly breakdown of protein, carbs, and fat</p>
          </div>
          <div className="card-content chart-container">
            {hasMacroData && chartData.pie ? (
              <Pie
                data={chartData.pie}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: "bottom",
                    },
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
                          const value = context.raw as number
                          const percentage = total > 0 ? Math.round((value / total) * 100) : 0
                          return `${context.label}: ${value}g (${percentage}%)`
                        },
                      },
                    },
                  },
                }}
              />
            ) : (
              <div className="empty-chart-message">
                <p>No macronutrient data available</p>
                <p className="empty-chart-subtitle">Add meals to see your macronutrient distribution</p>
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <div className="card-header">
            <h2 className="card-title">Caloric Goal Adherence</h2>
            <p className="card-description">How well you're meeting your monthly target</p>
          </div>
          <div
            className="card-content adherence-container"
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
              flex: 1,
              minHeight: "250px",
              padding: "2rem 1rem",
            }}
          >
            <DonutProgress percentage={adherenceRate} />
            <p className="adherence-description" style={{ textAlign: "center", marginTop: "1rem" }}>
              {totalCalories > 0 ? (
                <>
                  of {totalMonthlyTarget} calorie monthly goal
                  <br />
                  <span className="adherence-detail">
                    ({totalCalories} / {totalMonthlyTarget} calories)
                  </span>
                </>
              ) : (
                "No calorie data available"
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="full-width-section">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Daily Calorie Intake</h2>
            <p className="card-description">
              Daily consumption for {format(new Date(`${selectedMonth}-01T12:00:00Z`), "MMMM yyyy")}
            </p>
          </div>
          <div className="card-content chart-container">
            {chartData.bar ? (
              <Bar
                data={chartData.bar}
                options={{
                  responsive: true,
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: "Calories",
                      },
                    },
                    x: {
                      title: {
                        display: true,
                        text: "Day of Month",
                      },
                    },
                  },
                  plugins: {
                    legend: {
                      position: "bottom",
                    },
                    tooltip: {
                      mode: "index",
                      intersect: false,
                    },
                  },
                }}
              />
            ) : (
              <div className="empty-chart-message">
                <p>No calorie data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">All Meals</h2>
          <p className="card-description">
            Complete list of meals for {format(new Date(`${selectedMonth}-01T12:00:00Z`), "MMMM yyyy")}
          </p>
        </div>
        <div className="card-content">
          {monthMeals.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Meal</th>
                  <th>Type</th>
                  <th>Calories</th>
                  <th>Protein (g)</th>
                  <th>Carbs (g)</th>
                  <th>Fat (g)</th>
                </tr>
              </thead>
              <tbody>
                {monthMeals.map((meal, index) => (
                  <tr key={index}>
                    <td>{format(new Date(meal.date + "T12:00:00Z"), "MM/dd/yyyy")}</td>
                    <td>{meal.name}</td>
                    <td>{meal.mealType}</td>
                    <td>{meal.calories}</td>
                    <td>{meal.protein}</td>
                    <td>{meal.carbs}</td>
                    <td>{meal.fat}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-table-message">No meals recorded for this month</div>
          )}
        </div>
      </div>

      <style jsx>{`
        .empty-chart-message {
          text-align: center;
          color: var(--color-muted);
          font-size: 0.9rem;
          padding: 2rem 0;
        }
        .empty-chart-subtitle {
          font-size: 0.8rem;
          margin-top: 0.5rem;
        }
        .empty-data-message {
          text-align: center;
          color: var(--color-muted);
          padding: 2rem 0;
        }
        .adherence-detail {
          font-size: 0.8rem;
          color: var(--color-muted);
        }
      `}</style>
    </div>
  )
}
