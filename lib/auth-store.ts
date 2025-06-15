"use client"

import { create } from "zustand"

export interface User {
  id: number
  email: string
  name: string
}

interface AuthStore {
  user: User | null
  loading: boolean
  error: string | null
  checkAuth: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  loading: false,
  error: null,

  checkAuth: async () => {
    set({ loading: true, error: null })
    try {
      console.log("Checking authentication...")

      const response = await fetch("/api/auth/me", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        console.log("User authenticated:", data.user)
        set({ user: data.user, loading: false })

        // Notify meal store about the current user
        const { useMealStore } = await import("./store")
        useMealStore.getState().setCurrentUser(data.user.id)
      } else {
        console.log("User not authenticated")
        set({ user: null, loading: false })

        // Clear meal store when not authenticated
        const { useMealStore } = await import("./store")
        useMealStore.getState().resetStore()
      }
    } catch (error) {
      console.error("Auth check error:", error)
      set({ user: null, loading: false })

      // Clear meal store on error
      const { useMealStore } = await import("./store")
      useMealStore.getState().resetStore()
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null })
    try {
      console.log("Logging in user:", email)

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Login failed")
      }

      console.log("Login successful for user:", data.user)
      set({ user: data.user, loading: false })

      // Initialize meal store for the new user
      const { useMealStore } = await import("./store")
      useMealStore.getState().setCurrentUser(data.user.id)
    } catch (error) {
      console.error("Login error:", error)
      set({
        error: error instanceof Error ? error.message : "An error occurred",
        loading: false,
      })
      throw error
    }
  },

  signup: async (name, email, password) => {
    set({ loading: true, error: null })
    try {
      console.log("Signing up user:", email)

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Signup failed")
      }

      console.log("Signup successful for user:", data.user)
      set({ user: data.user, loading: false })

      // Initialize meal store for the new user
      const { useMealStore } = await import("./store")
      useMealStore.getState().setCurrentUser(data.user.id)
    } catch (error) {
      console.error("Signup error:", error)
      set({
        error: error instanceof Error ? error.message : "An error occurred",
        loading: false,
      })
      throw error
    }
  },

  logout: async () => {
    set({ loading: true, error: null })
    try {
      console.log("Logging out user")

      // Clear meal store before logout
      const { useMealStore } = await import("./store")
      useMealStore.getState().resetStore()

      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })

      console.log("Logout successful")
      set({ user: null, loading: false })
    } catch (error) {
      console.error("Logout error:", error)
      set({ user: null, loading: false })
    }
  },

  clearError: () => set({ error: null }),
}))
