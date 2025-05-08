"use client"

import { useEffect, useState } from "react"
import { useMealStore } from "@/lib/store"

export function MigrationHelper() {
  const { migrateMeals } = useMealStore()
  const [migrated, setMigrated] = useState(false)

  useEffect(() => {
    // Run migration once when component mounts
    migrateMeals()
    setMigrated(true)
  }, [migrateMeals])

  return null // This component doesn't render anything
}
