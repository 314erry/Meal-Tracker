"use client"

import type React from "react"

import { useState } from "react"
import { Search, Loader2, AlertCircle } from "lucide-react"

interface FoodItem {
  food_name: string
  nix_item_id?: string
  nf_calories?: number
  photo?: {
    thumb: string
  }
}

interface FoodSearchProps {
  onSelectFood: (foodName: string) => void
}

export function FoodSearch({ onSelectFood }: FoodSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<FoodItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchFood = async () => {
    if (!query.trim()) return

    setLoading(true)
    setError(null)
    setResults([])

    try {
      const response = await fetch("/api/nutritionix/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to search for food")
      }

      // Combine common foods and branded foods
      const combinedResults = [...(data.common || []), ...(data.branded || [])].slice(0, 10) // Limit to 10 results for better UX

      setResults(combinedResults)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while searching for food")
      console.error("Error searching for food:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    searchFood()
  }

  return (
    <div className="food-search">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-container">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a food (e.g., apple, chicken breast)"
            className="form-input"
          />
          <button type="submit" className="button button-primary search-button">
            {loading ? <Loader2 className="icon-small animate-spin" /> : <Search className="icon-small" />}
          </button>
        </div>
      </form>

      {error && (
        <div className="error-message">
          <AlertCircle className="icon-small" />
          <span>{error}</span>
        </div>
      )}

      {results.length > 0 && (
        <div className="search-results">
          <h3 className="results-title">Search Results</h3>
          <ul className="results-list">
            {results.map((item, index) => (
              <li key={index} className="result-item" onClick={() => onSelectFood(item.food_name)}>
                <div className="result-content">
                  {item.photo?.thumb && (
                    <img src={item.photo.thumb || "/placeholder.svg"} alt={item.food_name} className="food-thumbnail" />
                  )}
                  <div className="food-info">
                    <span className="food-name">{item.food_name}</span>
                    {item.nf_calories && <span className="food-calories">{Math.round(item.nf_calories)} calories</span>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <style jsx>{`
        .food-search {
          margin-bottom: 1.5rem;
        }
        .search-form {
          margin-bottom: 1rem;
        }
        .search-input-container {
          display: flex;
          gap: 0.5rem;
          width: 100%; /* Make it take full width of parent */
          max-width: 100%;
        }
        .search-button {
          padding: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .search-input-container input.form-input {
          flex: 1;
          min-width: 0;
          width: 100%;
        }
        .error-message {
          color: var(--color-error);
          margin-bottom: 1rem;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background-color: rgba(239, 68, 68, 0.1);
          border-radius: var(--border-radius);
        }
        .results-title {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        .results-list {
          list-style: none;
          padding: 0;
          margin: 0;
          border: 1px solid var(--color-card-border);
          border-radius: var(--border-radius);
          overflow: hidden;
        }
        .result-item {
          padding: 0.75rem;
          border-bottom: 1px solid var(--color-card-border);
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .result-item:last-child {
          border-bottom: none;
        }
        .result-item:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }
        .result-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .food-thumbnail {
          width: 40px;
          height: 40px;
          object-fit: cover;
          border-radius: 4px;
        }
        .food-info {
          display: flex;
          flex-direction: column;
        }
        .food-name {
          font-weight: 500;
        }
        .food-calories {
          font-size: 0.75rem;
          color: var(--color-muted);
        }
      `}</style>
    </div>
  )
}
