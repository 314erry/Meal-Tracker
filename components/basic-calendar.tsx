"use client"

import { useState, useEffect } from "react"
import { format, addMonths, subMonths, getYear, getMonth, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useMealStore } from "@/lib/store"

interface BasicCalendarProps {
  selectedDateStr: string
  onSelectDate: (dateStr: string) => void
}

export function BasicCalendar({ selectedDateStr, onSelectDate }: BasicCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const { meals } = useMealStore()

  useEffect(() => {
    console.log("Calendar received selectedDateStr:", selectedDateStr)
  }, [selectedDateStr])

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  const year = getYear(currentMonth)
  const month = getMonth(currentMonth)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const selectedDate = parseISO(selectedDateStr)
  const today = new Date()

  const days = []

  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    const hasMeals = meals.some((meal) => meal.date === dateStr)

    const isSelected =
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === month &&
      selectedDate.getFullYear() === year

    const isToday =
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year

    days.push(
      <div
        key={`day-${day}`}
        className={`calendar-day ${isSelected ? "selected" : ""} ${isToday ? "today" : ""}`}
        onClick={() => onSelectDate(dateStr)}
      >
        <span className="day-number">{day}</span>
        {hasMeals && <span className="meal-indicator"></span>}
      </div>,
    )
  }

  return (
    <div className="basic-calendar">
      <style jsx>{`
        .basic-calendar {
          background-color: var(--background);
          color: var(--foreground);
          padding: 1rem;
          border-radius: 0.5rem;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
        }

        .calendar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .calendar-month {
          font-size: 1.2rem;
          font-weight: bold;
        }

        .calendar-nav-button {
          background-color: var(--green-500); /* Ou use sua classe de botão verde */
          color: white;
          border: none;
          padding: 0.25rem 0.5rem;
          border-radius: 0.375rem;
          cursor: pointer;
        }

        .calendar-nav-button:hover {
          background-color: var(--green-600);
        }

        .calendar-weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          text-align: center;
          font-weight: bold;
          color: var(--muted-foreground);
          margin-bottom: 0.5rem;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.5rem;
        }

        .calendar-day {
          height: 3rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background-color: var(--muted);
          border-radius: 0.375rem;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .calendar-day:hover {
          background-color: var(--muted-hover);
        }

        .calendar-day.selected {
          background-color: var(--green-500);
          color: white;
        }

        .calendar-day.today {
          border: 2px solid var(--green-500);
        }

        .meal-indicator {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: var(--green-500);
          display: block;
          margin-top: 2px;
        }

        .calendar-day.empty {
          background: transparent;
          cursor: default;
        }
      `}</style>

      <div className="calendar-header">
        <button onClick={prevMonth} className="calendar-nav-button">
          <ChevronLeft className="icon-small" />
        </button>
        <div className="calendar-month">{format(currentMonth, "MMMM yyyy", { locale: ptBR })}</div>
        <button onClick={nextMonth} className="calendar-nav-button">
          <ChevronRight className="icon-small" />
        </button>
      </div>

      <div className="calendar-weekdays">
        <div>Dom</div>
        <div>Seg</div>
        <div>Ter</div>
        <div>Qua</div>
        <div>Qui</div>
        <div>Sex</div>
        <div>Sáb</div>
      </div>

      <div className="calendar-grid">{days}</div>
    </div>
  )
}
