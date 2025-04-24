"use client"

import { useState } from "react"
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
} from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface SimpleCalendarProps {
  value: Date
  onChange: (date: Date) => void
}

export function SimpleCalendar({ value, onChange }: SimpleCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const onDateClick = (day: Date) => {
    onChange(day)
  }

  const renderHeader = () => {
    return (
      <div className="calendar-header">
        <button onClick={prevMonth} className="calendar-nav-button">
          <ChevronLeft className="icon-small" />
        </button>
        <div className="calendar-month">{format(currentMonth, "MMMM yyyy")}</div>
        <button onClick={nextMonth} className="calendar-nav-button">
          <ChevronRight className="icon-small" />
        </button>
      </div>
    )
  }

  const renderDays = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    return (
      <div className="calendar-days">
        {days.map((day) => (
          <div className="calendar-day-name" key={day}>
            {day}
          </div>
        ))}
      </div>
    )
  }

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const dateFormat = "d"
    const rows = []

    let days = []
    let day = startDate
    let formattedDate = ""

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat)
        const cloneDay = new Date(day)

        days.push(
          <div
            className={`calendar-day ${
              !isSameMonth(day, monthStart)
                ? "calendar-day-disabled"
                : isSameDay(day, value)
                  ? "calendar-day-selected"
                  : isSameDay(day, new Date())
                    ? "calendar-day-today"
                    : ""
            }`}
            key={day.toString()}
            onClick={() => isSameMonth(day, monthStart) && onDateClick(cloneDay)}
          >
            <span>{formattedDate}</span>
          </div>,
        )
        day = addDays(day, 1)
      }

      rows.push(
        <div className="calendar-row" key={day.toString()}>
          {days}
        </div>,
      )
      days = []
    }

    return <div className="calendar-body">{rows}</div>
  }

  return (
    <div className="simple-calendar">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
    </div>
  )
}
