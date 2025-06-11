"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"
import { Loader2 } from "lucide-react"

interface AuthWrapperProps {
  children: React.ReactNode
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, loading, checkAuth } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/signup"]
  const isPublicRoute = publicRoutes.includes(pathname)

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    console.log(
      "AuthWrapper effect - user:",
      user,
      "loading:",
      loading,
      "isPublicRoute:",
      isPublicRoute,
      "pathname:",
      pathname,
    )

    if (!loading) {
      if (!user && !isPublicRoute) {
        // User is not authenticated and trying to access a protected route
        console.log("Redirecting to login - user not authenticated")
        router.replace("/login")
      } else if (user && isPublicRoute) {
        // User is authenticated and trying to access a public route
        console.log("Redirecting to home - user authenticated on public route")
        router.replace("/")
      }
    }
  }, [user, loading, isPublicRoute, router, pathname])

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="loading-container">
        <Loader2 className="loading-spinner" />
        <p>Carregando...</p>

        <style jsx>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            gap: 1rem;
          }
          
          .loading-spinner {
            width: 2rem;
            height: 2rem;
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    )
  }

  // Don't render anything if user should be redirected
  if (!loading && ((!user && !isPublicRoute) || (user && isPublicRoute))) {
    return null
  }

  return <>{children}</>
}
