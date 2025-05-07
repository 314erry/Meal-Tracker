"use client"

import { useState, useEffect } from "react"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export function ApiStatusChecker() {
  const [status, setStatus] = useState<"checking" | "success" | "error">("checking")
  const [message, setMessage] = useState("")
  const [successTimerActive, setSuccessTimerActive] = useState(false)

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        // Try a simple search to verify API credentials
        const response = await fetch("/api/nutritionix/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: "apple" }),
        })

        const data = await response.json()

        if (!response.ok) {
          setStatus("error")
          setMessage(data.error || "API error")
          return
        }

        setStatus("success")
        setMessage("Nutritionix API connected successfully")
        setSuccessTimerActive(true) // Activate the timer when success
      } catch (err) {
        setStatus("error")
        setMessage(err instanceof Error ? err.message : "Failed to check API status")
      }
    }

    checkApiStatus()
  }, [])

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null

    if (status === "success" && successTimerActive) {
      timer = setTimeout(() => {
        const element = document.querySelector(".api-status.success")
        if (element) {
          element.classList.add("fade-out")
        }
        setSuccessTimerActive(false) // Deactivate the timer
      }, 3000)
    }

    return () => {
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [status, successTimerActive])

  if (status === "checking") {
    return (
      <div className="api-status checking">
        <Loader2 className="icon-small animate-spin" />
        <span>Checking API connection...</span>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="api-status error">
        <XCircle className="icon-small" />
        <span>API Error: {message}</span>
      </div>
    )
  }

  return (
    <div className="api-status success">
      <CheckCircle className="icon-small" />
      <span>{message}</span>
    </div>
  )
}
