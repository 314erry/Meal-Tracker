"use client"

import { useState, useEffect } from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns"
import { ptBR } from "date-fns/locale"
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
  const [chartData, setChartData] = useState<{ pie: any; bar: any }>({
    pie: null,
    bar: null,
  })

  // State for calculated values
  const [monthMeals, setMonthMeals] = useState<any[]>([])
  const [totalCalories, setTotalCalories] = useState(0)
  const [totalProtein, setTotalProtein] = useState(0)
  const [totalCarbs, setTotalCarbs] = useState(0)
  const [totalFat, setTotalFat] = useState(0)
  const [avgCaloriesPerDay, setAvgCaloriesPerDay] = useState(0)
  const [avgProteinPerDay, setAvgProteinPerDay] = useState(0)
  const [avgCarbsPerDay, setAvgCarbsPerDay] = useState(0)
  const [avgFatPerDay, setAvgFatPerDay] = useState(0)
  const [adherenceRate, setAdherenceRate] = useState(0)
  const [totalMonthlyTarget, setTotalMonthlyTarget] = useState(0)

  // Get available months from meal data
  const availableMonths = [...new Set(meals.map((meal) => meal.date.substring(0, 7)))].sort()

  // If no months with data, default to current month
  useEffect(() => {
    if (availableMonths.length > 0 && !availableMonths.includes(selectedMonth)) {
      setSelectedMonth(availableMonths[availableMonths.length - 1])
    }
  }, [availableMonths, selectedMonth])

  // Calculate all data when meals or selected month changes
  useEffect(() => {
    // Filter meals for selected month
    const filteredMonthMeals = meals.filter((meal) => meal.date.startsWith(selectedMonth))
    setMonthMeals(filteredMonthMeals)

    // Calculate nutrition totals
    const monthTotalCalories = filteredMonthMeals.reduce((sum, meal) => sum + meal.calories, 0)
    const monthTotalProtein = filteredMonthMeals.reduce((sum, meal) => sum + meal.protein, 0)
    const monthTotalCarbs = filteredMonthMeals.reduce((sum, meal) => sum + meal.carbs, 0)
    const monthTotalFat = filteredMonthMeals.reduce((sum, meal) => sum + meal.fat, 0)

    setTotalCalories(monthTotalCalories)
    setTotalProtein(monthTotalProtein)
    setTotalCarbs(monthTotalCarbs)
    setTotalFat(monthTotalFat)

    // Calculate averages
    const daysWithMeals = filteredMonthMeals.length > 0 ? new Set(filteredMonthMeals.map((meal) => meal.date)).size : 1
    setAvgCaloriesPerDay(Math.round(monthTotalCalories / daysWithMeals))
    setAvgProteinPerDay(Math.round(monthTotalProtein / daysWithMeals))
    setAvgCarbsPerDay(Math.round(monthTotalCarbs / daysWithMeals))
    setAvgFatPerDay(Math.round(monthTotalFat / daysWithMeals))

    // Calculate adherence
    const calorieTarget = 2000
    const daysInSelectedMonth = selectedMonth
      ? eachDayOfInterval({
          start: startOfMonth(new Date(`${selectedMonth}-01T12:00:00Z`)),
          end: endOfMonth(new Date(`${selectedMonth}-01T12:00:00Z`)),
        }).length
      : 30

    const calculatedMonthlyTarget = calorieTarget * daysInSelectedMonth
    setTotalMonthlyTarget(calculatedMonthlyTarget)

    const calculatedAdherenceRate =
      calculatedMonthlyTarget > 0 ? Math.min(100, Math.round((monthTotalCalories / calculatedMonthlyTarget) * 100)) : 0
    setAdherenceRate(calculatedAdherenceRate)

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
            date: format(day, "dd", { locale: ptBR }),
            calories,
            target: calorieTarget,
          }
        })
      : []

    // Only create pie chart if there's data
    const hasMacroData = monthTotalProtein > 0 || monthTotalCarbs > 0 || monthTotalFat > 0

    const pieData = hasMacroData
      ? {
          labels: ["Proteína", "Carboidratos", "Gordura"],
          datasets: [
            {
              data: [monthTotalProtein, monthTotalCarbs, monthTotalFat],
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
          label: "Calorias",
          data: dailyData.map((item) => item.calories),
          backgroundColor: "#10b981",
        },
        {
          label: "Meta",
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

  // Determine if we have enough data to show the pie chart
  const hasMacroData = totalProtein > 0 || totalCarbs > 0 || totalFat > 0

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Relatório Mensal</h1>
        <button className="button button-outline" onClick={() => router.push("/")}>
          Voltar ao Calendário
        </button>
      </div>

      <div className="select-container">
        <select className="month-select" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
          {availableMonths.length > 0 ? (
            availableMonths.map((month) => (
              <option key={month} value={month}>
                {format(new Date(`${month}-01T12:00:00Z`), "MMMM yyyy", { locale: ptBR })}
              </option>
            ))
          ) : (
            <option value={selectedMonth}>
              {format(new Date(`${selectedMonth}-01T12:00:00Z`), "MMMM yyyy", { locale: ptBR })}
            </option>
          )}
        </select>
      </div>

      <div className="full-width-section">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Resumo Nutricional Mensal</h2>
            <p className="card-description">
              Visão geral da sua ingestão nutricional para{" "}
              {format(new Date(`${selectedMonth}-01T12:00:00Z`), "MMMM yyyy", { locale: ptBR })}
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
                    <h3>Total de Calorias</h3>
                    <p>{avgCaloriesPerDay} por dia</p>
                  </div>
                </div>

                <div className="nutrition-item">
                  <div className="nutrition-icon protein">
                    <span>{totalProtein}g</span>
                  </div>
                  <div className="nutrition-details">
                    <h3>Total de Proteína</h3>
                    <p>{avgProteinPerDay}g por dia</p>
                  </div>
                </div>

                <div className="nutrition-item">
                  <div className="nutrition-icon carbs">
                    <span>{totalCarbs}g</span>
                  </div>
                  <div className="nutrition-details">
                    <h3>Total de Carboidratos</h3>
                    <p>{avgCarbsPerDay}g por dia</p>
                  </div>
                </div>

                <div className="nutrition-item">
                  <div className="nutrition-icon fat">
                    <span>{totalFat}g</span>
                  </div>
                  <div className="nutrition-details">
                    <h3>Total de Gordura</h3>
                    <p>{avgFatPerDay}g por dia</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-data-message">
                <p>Nenhum dado de refeição disponível para este mês</p>
                <p>Adicione refeições para ver seu resumo nutricional</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid-layout">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Distribuição de Macronutrientes</h2>
            <p className="card-description">Divisão mensal de proteína, carboidratos e gordura</p>
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
                <p>Nenhum dado de macronutrientes disponível</p>
                <p className="empty-chart-subtitle">Adicione refeições para ver sua distribuição de macronutrientes</p>
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <div className="card-header">
            <h2 className="card-title">Aderência à Meta Calórica</h2>
            <p className="card-description">Quão bem você está atingindo sua meta mensal</p>
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
                  da meta mensal de {totalMonthlyTarget} calorias
                  <br />
                  <span className="adherence-detail">
                    ({totalCalories} / {totalMonthlyTarget} calorias)
                  </span>
                </>
              ) : (
                "Nenhum dado de calorias disponível"
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="full-width-section">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Consumo Diário de Calorias</h2>
            <p className="card-description">
              Consumo diário para {format(new Date(`${selectedMonth}-01T12:00:00Z`), "MMMM yyyy", { locale: ptBR })}
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
                        text: "Calorias",
                      },
                    },
                    x: {
                      title: {
                        display: true,
                        text: "Dia do Mês",
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
                      callbacks: {
                        title: (context) => {
                          if (context[0] && context[0].dataIndex !== undefined) {
                            const dataIndex = context[0].dataIndex
                            const date = new Date(`${selectedMonth}-${context[0].label.padStart(2, "0")}T12:00:00Z`)
                            return format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR })
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

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Todas as Refeições</h2>
          <p className="card-description">
            Lista completa de refeições para{" "}
            {format(new Date(`${selectedMonth}-01T12:00:00Z`), "MMMM yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="card-content">
          {monthMeals.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Refeição</th>
                  <th>Tipo</th>
                  <th>Calorias</th>
                  <th>Proteína (g)</th>
                  <th>Carboidratos (g)</th>
                  <th>Gordura (g)</th>
                </tr>
              </thead>
              <tbody>
                {monthMeals.map((meal, index) => (
                  <tr key={index}>
                    <td>{format(new Date(meal.date + "T12:00:00Z"), "dd/MM/yyyy", { locale: ptBR })}</td>
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
            <div className="empty-table-message">Nenhuma refeição registrada para este mês</div>
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
