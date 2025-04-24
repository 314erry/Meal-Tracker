"use client"

import { useState, useEffect } from "react"
import { format, addMonths, subMonths, getYear, getMonth, parseISO } from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useMealStore } from "@/lib/store"

interface BasicCalendarProps {
  selectedDateStr: string
  onSelectDate: (dateStr: string) => void
}

export function BasicCalendar({ selectedDateStr, onSelectDate }: BasicCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  // Get meals data to check which days have meals
  const { meals } = useMealStore()

  // Log props for debugging
  useEffect(() => {
    console.log("Calendar received selectedDateStr:", selectedDateStr)
  }, [selectedDateStr])

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  // Get day of week for first day of month (0 = Sunday, 6 = Saturday)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  const year = getYear(currentMonth)
  const month = getMonth(currentMonth)
  const daysInMonth = getDaysInMonth(year, month)
  const firstDayOfMonth = getFirstDayOfMonth(year, month)

  // Parse the selected date string
  const selectedDate = parseISO(selectedDateStr)

  // Create calendar days
  const days = []

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>)
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    // Create a date string in YYYY-MM-DD format
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`

    // Check if this day has any meals
    const hasMeals = meals.some((meal) => meal.date === dateStr)

    const today = new Date()
    const isSelected =
      selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year

    const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year

    days.push(
      <div
        key={`day-${day}`}
        className={`calendar-day ${isSelected ? "selected" : ""} ${isToday ? "today" : ""}`}
        onClick={() => {
          // Log the exact date string being selected
          console.log("Day clicked, dateStr:", dateStr)
          onSelectDate(dateStr)
        }}
      >
        <span className="day-number">{day}</span>
        {hasMeals && <span className="meal-indicator"></span>}
      </div>,
    )
  }

  return (
    <div className="basic-calendar">
      <style jsx>{`
        .calendar-day {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
        }
        .meal-indicator {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: var(--color-primary);
          display: block;
        }
      `}</style>
      <div className="calendar-header">
        <button onClick={prevMonth} className="calendar-nav-button">
          <ChevronLeft className="icon-small" />
        </button>
        <div className="calendar-month">{format(currentMonth, "MMMM yyyy")}</div>
        <button onClick={nextMonth} className="calendar-nav-button">
          <ChevronRight className="icon-small" />
        </button>
      </div>

      <div className="calendar-weekdays">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>

      <div className="calendar-grid">{days}</div>
    </div>
  )
}
