"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { useMealStore } from "@/lib/store"
import { BasicCalendar } from "@/components/basic-calendar"
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
} from "chart.js"
import { Pie, Line } from "react-chartjs-2"

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title)

export default function Home() {
  const [selectedDateStr, setSelectedDateStr] = useState(format(new Date(), "yyyy-MM-dd"))
  const router = useRouter()
  const { meals } = useMealStore()
  const [chartData, setChartData] = useState<{ pie: any; line: any }>({ pie: null, line: null })
  const selectedDate = new Date(selectedDateStr + "T12:00:00Z")

  const handleDateSelect = (dateStr: string) => {
    setSelectedDateStr(dateStr)
  }

  const goToMealEntry = () => {
    router.push(`/day/${selectedDateStr}`)
  }

  // Calculate totals based on current meals
  const totalProtein = meals.reduce((sum, meal) => sum + meal.protein, 0)
  const totalCarbs = meals.reduce((sum, meal) => sum + meal.carbs, 0)
  const totalFat = meals.reduce((sum, meal) => sum + meal.fat, 0)
  const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0)

  // Get dates for the last 7 days
  const today = new Date()
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(today.getDate() - i)
    return format(date, "yyyy-MM-dd")
  }).reverse()

  // Calculate calorie data for each day without random values
  const calorieData = last7Days.map((day) => {
    const dayMeals = meals.filter((meal) => meal.date === day)
    const calories = dayMeals.reduce((sum, meal) => sum + meal.calories, 0)
    return {
      date: format(new Date(day + "T12:00:00Z"), "MM/dd"),
      calories,
      target: 2000, // Daily calorie target
    }
  })

  // Calculate adherence rate based on actual data
  const calorieTarget = 2000 // Daily calorie target
  const totalTarget = calorieTarget * last7Days.length
  const adherenceRate = totalTarget > 0 ? Math.min(100, Math.round((totalCalories / totalTarget) * 100)) : 0

  // Update chart data whenever meals change
  useEffect(() => {
    // Only create pie chart if there's actual data
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

    const lineData = {
      labels: calorieData.map((item) => item.date),
      datasets: [
        {
          label: "Calories",
          data: calorieData.map((item) => item.calories),
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.2)",
          tension: 0.4,
          fill: true,
        },
        {
          label: "Target",
          data: calorieData.map(() => calorieTarget),
          borderColor: "#6366f1",
          borderDash: [5, 5],
          backgroundColor: "transparent",
          tension: 0,
          fill: false,
        },
      ],
    }

    setChartData({ pie: pieData, line: lineData })
  }, [meals, totalProtein, totalCarbs, totalFat]) // Include all dependencies

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
      <h1 className="page-title">Registrador de Refeição</h1>

      <div className="grid-layout" style={{ alignItems: "stretch" }}>
        <div className="card" style={{ display: "flex", flexDirection: "column", height: "450px" }}>
          <div className="card-header">
            <h2 className="card-title">Calendário</h2>
            <p className="card-description">
            Selecione um dia para adicionar refeições</p>
          </div>
          <div className="card-content" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ marginBottom: "1rem", transform: "scale(0.85)", transformOrigin: "top center" }}>
              <BasicCalendar selectedDateStr={selectedDateStr} onSelectDate={handleDateSelect} />
              <button className="button button-primary full-width" onClick={goToMealEntry}>
              Adicionar refeições para {format(selectedDate, "MMMM d, yyyy")}
              </button>
            </div>
          </div>
        </div>

        <div className="card" style={{ display: "flex", flexDirection: "column", height: "450px" }}>
          <div className="card-header">
            <h2 className="card-title">Distribuição de Macronutrientes</h2>
            <p className="card-description">Porcentagem de proteína, carboidrato e gordura</p>
          </div>
          <div
            className="card-content chart-container"
            style={{ display: "flex", justifyContent: "center", alignItems: "center", flex: 1, padding: "1.25rem" }}
          >
            {hasMacroData && chartData.pie ? (
              <div style={{ width: "80%", maxWidth: "250px" }}>
                <Pie
                  data={chartData.pie}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: {
                          boxWidth: 12,
                          padding: 15,
                          font: { size: 11 },
                        },
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
              </div>
            ) : (
              <div className="empty-chart-message">
                <p>Não há dados disponíveis sobre macronutrientes</p>
                <p className="empty-chart-subtitle">Adicione refeições para ver sua distribuição de macronutrientes</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="full-width-section">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Ingestão calórica diária</h2>
            <p className="card-description">Comparando o consumo diário com a meta</p>
          </div>
          <div className="card-content chart-container">
            {chartData.line ? (
              <Line
                data={chartData.line}
                options={{
                  responsive: true,
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: { display: true, text: "Calories" },
                    },
                    x: {
                      title: { display: true, text: "Date" },
                    },
                  },
                  plugins: {
                    legend: { position: "bottom" },
                    tooltip: { mode: "index", intersect: false },
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

      <div className="grid-layout three-columns">
        <div className="card span-two">
          <div className="card-header">
            <h2 className="card-title">Refeições Recentes            </h2>
            <p className="card-description">Suas últimas refeições registradas</p>
          </div>
          <div className="card-content">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Refeição</th>
                  <th>Tipo</th>
                  <th>Calorias</th>
                  <th>Proteínas</th>
                  <th>Carboidratos</th>
                  <th>Gorduras</th>
                </tr>
              </thead>
              <tbody>
                {meals.length > 0 ? (
                  meals.slice(0, 5).map((meal, index) => (
                    <tr key={index}>
                      <td>{format(new Date(meal.date + "T12:00:00Z"), "MM/dd/yyyy")}</td>
                      <td>{meal.name}</td>
                      <td>{meal.mealType}</td>
                      <td>{meal.calories}</td>
                      <td>{meal.protein}g</td>
                      <td>{meal.carbs}g</td>
                      <td>{meal.fat}g</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="empty-table-message">
                      Nenhuma refeição registrada. Adicione sua primeira refeição selecionando um dia!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <button className="button button-outline full-width" onClick={() => router.push("/reports")}>
              Ver relatório completo
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Adesão à meta calórica</h2>
            <p className="card-description">Quão bem você está atingindo sua meta semanal</p>
          </div>
          <div
            className="card-content adherence-container"
            style={{ display: "flex", justifyContent: "center", alignItems: "center" }}
          >
            <DonutProgress percentage={adherenceRate} />
            <p className="card-description" style={{ textAlign: "center", marginTop: "1rem" }}>
              {totalCalories > 0 ? (
                <>
                  da {totalTarget} meta semanal de calorias atingida
                  <br />
                  <span className="adherence-detail">
                    ({totalCalories} / {totalTarget} calories)
                  </span>
                </>
              ) : (
                "No calorie data available"
              )}
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .empty-chart-message {
          text-align: center;
          color: var(--color-muted);
          font-size: 0.9rem;
        }
        .empty-chart-subtitle {
          font-size: 0.8rem;
          margin-top: 0.5rem;
        }
        .adherence-detail {
          font-size: 0.8rem;
          color: var(--color-muted);
        }
      `}</style>
    </div>
  )
}
