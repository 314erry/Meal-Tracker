"use client"

import { useEffect } from "react"
import { useMealStore } from "@/lib/store"
import { useAuthStore } from "@/lib/auth-store"

export function DataFetcher() {
  const { user } = useAuthStore()
  const { setCurrentUser, currentUserId, initialized } = useMealStore()

  useEffect(() => {
    console.log("DataFetcher: User changed", user?.id, "Current store user:", currentUserId)

    if (user) {
      // User is authenticated, set current user in meal store
      if (currentUserId !== user.id) {
        console.log("DataFetcher: Setting new user in meal store:", user.id)
        setCurrentUser(user.id)
      }
    } else {
      // User is not authenticated, clear meal store
      if (currentUserId !== null) {
        console.log("DataFetcher: Clearing meal store (user logged out)")
        setCurrentUser(null)
      }
    }
  }, [user, currentUserId, setCurrentUser])

  return null // This component doesn't render anything
}
