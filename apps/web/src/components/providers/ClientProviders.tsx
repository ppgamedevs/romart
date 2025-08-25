"use client"

import { TooltipProvider } from "@/components/ui/tooltip"

interface ClientProvidersProps {
  children: React.ReactNode
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <TooltipProvider>
      {children}
    </TooltipProvider>
  )
}
