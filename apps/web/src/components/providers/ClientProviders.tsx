"use client"

import { useEffect, useState } from "react"
import { TooltipProvider } from "@/components/ui/tooltip"

interface ClientProvidersProps {
  children: React.ReactNode
}

export function ClientProviders({ children }: ClientProvidersProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch by not rendering until client-side
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background font-sans antialiased">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      {children}
    </TooltipProvider>
  )
}
