"use client"

import { useState, useEffect } from "react"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
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
  const [weekRangeDisplay, setWeekRangeDisplay] = useState("")
  const [monthDisplay, setMonthDisplay] = useState("")
  const [adherenceRate, setAdherenceRate] = useState(0)
  const [totalCalories, setTotalCalories] = useState(0)
  const [weeklyCalorieTarget, setWeeklyCalorieTarget] = useState(0)
  const [totalProtein, setTotalProtein] = useState(0)
  const [totalCarbs, setTotalCarbs] = useState(0)
  const [totalFat, setTotalFat] = useState(0)

  const handleDateSelect = (dateStr: string) => {
    setSelectedDateStr(dateStr)
  }

  const goToMealEntry = () => {
    router.push(`/day/${selectedDateStr}`)
  }

  // Calculate weekly data and update state
  useEffect(() => {
    // Get the current week's start and end dates
    const today = new Date()
    const weekStart = startOfWeek(today, { weekStartsOn: 0 }) // 0 = Sunday
    const weekEnd = endOfWeek(today, { weekStartsOn: 0 })

    // Get the current month's start and end dates
    const monthStart = startOfMonth(today)
    const monthEnd = endOfMonth(today)

    // Format the week range for display
    const formattedWeekRange = `${format(weekStart, "dd/MM", { locale: ptBR })} - ${format(weekEnd, "dd/MM/yyyy", { locale: ptBR })}`
    setWeekRangeDisplay(formattedWeekRange)

    // Format the month for display
    const formattedMonth = format(today, "MMMM yyyy", { locale: ptBR })
    setMonthDisplay(formattedMonth)

    // Get dates for the current week
    const currentWeekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

    // Get dates for the current month
    const currentMonthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

    // Filter meals to only include those from the current week
    const currentWeekMeals = meals.filter((meal) => {
      const mealDate = new Date(meal.date + "T12:00:00Z")
      return mealDate >= weekStart && mealDate <= weekEnd
    })

    // Calculate totals based on current week's meals
    const weekProtein = currentWeekMeals.reduce((sum, meal) => sum + meal.protein, 0)
    const weekCarbs = currentWeekMeals.reduce((sum, meal) => sum + meal.carbs, 0)
    const weekFat = currentWeekMeals.reduce((sum, meal) => sum + meal.fat, 0)
    const weekCalories = currentWeekMeals.reduce((sum, meal) => sum + meal.calories, 0)

    // Update state with calculated values
    setTotalProtein(weekProtein)
    setTotalCarbs(weekCarbs)
    setTotalFat(weekFat)
    setTotalCalories(weekCalories)

    // Calculate daily calorie target and weekly target
    const dailyCalorieTarget = 2000 // Daily calorie target
    const weeklyTarget = dailyCalorieTarget * 7 // Weekly target (7 days)
    setWeeklyCalorieTarget(weeklyTarget)

    // Calculate adherence rate
    const calculatedAdherenceRate =
      weeklyTarget > 0 ? Math.min(100, Math.round((weekCalories / weeklyTarget) * 100)) : 0
    setAdherenceRate(calculatedAdherenceRate)

    // Get calorie data for each day of the current MONTH (not just week)
    const calorieData = currentMonthDays.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd")
      const dayMeals = meals.filter((meal) => meal.date === dateStr)
      const dayCalories = dayMeals.reduce((sum, meal) => sum + meal.calories, 0)
      return {
        date: format(day, "dd"), // Day of month
        fullDate: format(day, "dd/MM", { locale: ptBR }), // Day/Month for tooltip
        calories: dayCalories,
        target: dailyCalorieTarget,
      }
    })

    // Create pie chart data
    const pieData = {
      labels: ["Proteína", "Carboidratos", "Gordura"],
      datasets: [
        {
          data: [weekProtein, weekCarbs, weekFat],
          backgroundColor: ["#10b981", "#3b82f6", "#f59e0b"],
          borderColor: ["#059669", "#2563eb", "#d97706"],
          borderWidth: 1,
        },
      ],
    }

    // Create line chart data
    const lineData = {
      labels: calorieData.map((item) => item.date),
      datasets: [
        {
          label: "Calorias",
          data: calorieData.map((item) => item.calories),
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.2)",
          tension: 0.4,
          fill: true,
        },
        {
          label: "Meta",
          data: calorieData.map(() => dailyCalorieTarget),
          borderColor: "#6366f1",
          borderDash: [5, 5],
          backgroundColor: "transparent",
          tension: 0,
          fill: false,
        },
      ],
    }

    // Update chart data
    setChartData({ pie: pieData, line: lineData })
  }, [meals]) // Only depend on meals, not derived values

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
      <h1 className="page-title">Rastreador de Refeições</h1>

      <div className="grid-layout" style={{ alignItems: "stretch" }}>
        <div className="card" style={{ display: "flex", flexDirection: "column", height: "450px" }}>
          <div className="card-header">
            <h2 className="card-title">Calendário</h2>
            <p className="card-description">Selecione um dia para adicionar refeições</p>
          </div>
          <div className="card-content" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ marginBottom: "1rem", transform: "scale(0.85)", transformOrigin: "top center" }}>
              <BasicCalendar selectedDateStr={selectedDateStr} onSelectDate={handleDateSelect} />
              <button className="button button-primary full-width" onClick={goToMealEntry}>
                Adicionar Refeições para {format(selectedDate, "d 'de' MMMM, yyyy", { locale: ptBR })}
              </button>
            </div>
          </div>
        </div>

        <div className="card" style={{ display: "flex", flexDirection: "column", height: "450px" }}>
          <div className="card-header">
            <h2 className="card-title">Distribuição de Macronutrientes</h2>
            <p className="card-description">Porcentagem de proteína, carboidratos e gordura</p>
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
                <p>Nenhum dado de macronutrientes disponível</p>
                <p className="empty-chart-subtitle">Adicione refeições para ver sua distribuição de macronutrientes</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="full-width-section">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Consumo Diário de Calorias</h2>
            <p className="card-description">Consumo diário para {monthDisplay}</p>
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
                      title: { display: true, text: "Calorias" },
                    },
                    x: {
                      title: { display: true, text: "Dia do Mês" },
                    },
                  },
                  plugins: {
                    legend: { position: "bottom" },
                    tooltip: {
                      mode: "index",
                      intersect: false,
                      callbacks: {
                        title: (context) => {
                          // Use the stored full date (day/month) for the tooltip title
                          if (context[0] && context[0].dataIndex !== undefined) {
                            const dataIndex = context[0].dataIndex
                            const calorieData = chartData.line.labels.map((_: string, i: number) => ({
                              fullDate:
                                format(new Date(), "yyyy-MM") +
                                "-" +
                                (Number.parseInt(chartData.line.labels[i] as string) < 10
                                  ? "0" + chartData.line.labels[i]
                                  : chartData.line.labels[i]),
                            }))

                            if (calorieData[dataIndex]) {
                              return format(new Date(calorieData[dataIndex].fullDate), "dd/MM/yyyy", { locale: ptBR })
                            }
                          }
                          return ""
                        },
                      },
                    },
                  },
                }}
              />
            ) : (
              <div className="empty-chart-message">
                <p>Nenhum dado de calorias disponível</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid-layout three-columns">
        <div className="card span-two">
          <div className="card-header">
            <h2 className="card-title">Refeições Recentes</h2>
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
                  <th>Proteína</th>
                  <th>Carboidratos</th>
                  <th>Gordura</th>
                </tr>
              </thead>
              <tbody>
                {meals.length > 0 ? (
                  meals.slice(0, 5).map((meal, index) => (
                    <tr key={index}>
                      <td>{format(new Date(meal.date + "T12:00:00Z"), "dd/MM/yyyy", { locale: ptBR })}</td>
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
              Ver Relatório Completo
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Aderência à Meta Calórica</h2>
            <p className="card-description">Semana atual: {weekRangeDisplay}</p>
          </div>
          <div
            className="card-content adherence-container"
            style={{ display: "flex", justifyContent: "center", alignItems: "center" }}
          >
            <DonutProgress percentage={adherenceRate} />
            <p className="card-description" style={{ textAlign: "center", marginTop: "1rem" }}>
              {totalCalories > 0 ? (
                <>
                  da meta semanal de {weeklyCalorieTarget} calorias atingida
                  <br />
                  <span className="adherence-detail">
                    ({totalCalories} / {weeklyCalorieTarget} calorias)
                  </span>
                </>
              ) : (
                "Nenhum dado de calorias disponível"
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
