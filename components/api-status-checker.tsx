"use client"

import { useState, useEffect } from "react"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export function ApiStatusChecker() {
  const [nutritionixStatus, setNutritionixStatus] = useState<"checking" | "success" | "error">("checking")
  const [nutritionixMessage, setNutritionixMessage] = useState("")
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        // Check Nutritionix API
        const nutritionixResponse = await fetch("/api/nutritionix/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: "apple" }),
        })

        let nutritionixData
        try {
          nutritionixData = await nutritionixResponse.json()
        } catch (e) {
          console.error("Failed to parse Nutritionix API response:", e)
          setNutritionixStatus("error")
          setNutritionixMessage("Resposta da API inválida")
          return
        }

        if (!nutritionixResponse.ok) {
          setNutritionixStatus("error")
          setNutritionixMessage(nutritionixData.error || "Erro na API")
        } else {
          setNutritionixStatus("success")
          setNutritionixMessage("API Nutritionix conectada")

          // Auto-hide success message after 5 seconds
          setTimeout(() => {
            setVisible(false)
          }, 5000)
        }
      } catch (err) {
        console.error("Error checking API status:", err)
        setNutritionixStatus("error")
        setNutritionixMessage(err instanceof Error ? err.message : "Falha ao verificar status da API")
      }
    }

    checkApiStatus()
  }, [])

  if (!visible) return null

  return (
    <div className="api-status-container">
      <div className={`api-status ${nutritionixStatus}`}>
        {nutritionixStatus === "checking" && <Loader2 className="icon-small animate-spin" />}
        {nutritionixStatus === "success" && <CheckCircle className="icon-small" />}
        {nutritionixStatus === "error" && <XCircle className="icon-small" />}
        <span>{nutritionixMessage}</span>
      </div>

      <style jsx>{`
        .api-status-container {
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  )
}
