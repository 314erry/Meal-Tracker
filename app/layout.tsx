import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { AuthWrapper } from "@/components/auth-wrapper"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Meal Tracker",
  description: "Track your daily meals and nutrition",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthWrapper>{children}</AuthWrapper>
      </body>
    </html>
  )
}
