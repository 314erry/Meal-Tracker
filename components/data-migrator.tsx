"use client"

import { useState } from "react"
import { useMealStore } from "@/lib/store"

export function DataMigrator() {
  const [migrating, setMigrating] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const { fetchMeals } = useMealStore()

  const migrateData = async () => {
    setMigrating(true)
    setResult(null)

    try {
      // Get data from localStorage
      const storedData = localStorage.getItem("meal-storage")
      if (!storedData) {
        setResult("No data found in localStorage")
        setMigrating(false)
        return
      }

      const parsedData = JSON.parse(storedData)
      const meals = parsedData.state?.meals || []

      if (meals.length === 0) {
        setResult("No meals found in localStorage")
        setMigrating(false)
        return
      }

      // Send data to migration API
      const response = await fetch("/api/migrate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ meals }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Migration failed")
      }

      setResult(`${data.message}`)

      // Refresh meals from the database
      await fetchMeals()
    } catch (error) {
      console.error("Migration error:", error)
      setResult(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setMigrating(false)
    }
  }

  return (
    <div className="migration-container">
      <h2>Data Migration</h2>
      <p>Migrate your meal data from localStorage to SQLite database</p>

      <button className="button button-primary" onClick={migrateData} disabled={migrating}>
        {migrating ? "Migrating..." : "Start Migration"}
      </button>

      {result && (
        <div className="migration-result">
          <p>{result}</p>
        </div>
      )}

      <style jsx>{`
        .migration-container {
          padding: 1rem;
          border: 1px solid var(--color-card-border);
          border-radius: var(--border-radius);
          margin-bottom: 1rem;
        }
        .migration-result {
          margin-top: 1rem;
          padding: 0.5rem;
          background-color: var(--color-card);
          border-radius: var(--border-radius);
        }
      `}</style>
    </div>
  )
}
