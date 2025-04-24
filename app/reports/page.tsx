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

  const availableMonths = [...new Set(meals.map((meal) => meal.date.substring(0, 7)))].sort()
  const monthMeals = meals.filter((meal) => meal.date.startsWith(selectedMonth))

  const totalCalories = monthMeals.reduce((sum, meal) => sum + meal.calories, 0)
  const totalProtein = monthMeals.reduce((sum, meal) => sum + meal.protein, 0)
  const totalCarbs = monthMeals.reduce((sum, meal) => sum + meal.carbs, 0)
  const totalFat = monthMeals.reduce((sum, meal) => sum + meal.fat, 0)

  const daysInMonth = monthMeals.length > 0 ? new Set(monthMeals.map((meal) => meal.date)).size : 1
  const avgCaloriesPerDay = Math.round(totalCalories / daysInMonth)
  const avgProteinPerDay = Math.round(totalProtein / daysInMonth)
  const avgCarbsPerDay = Math.round(totalCarbs / daysInMonth)
  const avgFatPerDay = Math.round(totalFat / daysInMonth)

  const calorieTarget = 2000
  const daysInSelectedMonth = selectedMonth
    ? eachDayOfInterval({
        start: startOfMonth(new Date(`${selectedMonth}-01T12:00:00Z`)),
        end: endOfMonth(new Date(`${selectedMonth}-01T12:00:00Z`)),
      }).length
    : 30

  const adherenceRate = Math.min(100, Math.round((totalCalories / (calorieTarget * daysInSelectedMonth)) * 100))

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

  useEffect(() => {
    const pieData = {
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
  }, [selectedMonth, meals])

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
            {totalProtein + totalCarbs + totalFat > 0 ? (
              chartData.pie && (
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
                            const percentage = Math.round((value / total) * 100)
                            return `${context.label}: ${value}g (${percentage}%)`
                          },
                        },
                      },
                    },
                  }}
                />
              )
            ) : (
              <p className="empty-message">No meal data available</p>
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
              of {calorieTarget * daysInSelectedMonth} calorie monthly goal
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
            {chartData.bar && (
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
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Meal</th>
                <th>Calories</th>
                <th>Protein (g)</th>
                <th>Carbs (g)</th>
                <th>Fat (g)</th>
              </tr>
            </thead>
            <tbody>
              {monthMeals.length > 0 ? (
                monthMeals.map((meal, index) => (
                  <tr key={index}>
                    <td>{format(new Date(meal.date + "T12:00:00Z"), "MM/dd/yyyy")}</td>
                    <td>{meal.name}</td>
                    <td>{meal.calories}</td>
                    <td>{meal.protein}</td>
                    <td>{meal.carbs}</td>
                    <td>{meal.fat}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="empty-table-message">
                    No meals recorded for this month
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}