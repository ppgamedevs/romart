"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff } from "lucide-react"

interface MatureGuardProps {
  children: React.ReactNode
  className?: string
  blurText?: string
}

export function MatureGuard({ 
  children, 
  className = "",
  blurText = "Sensitive content — click to view"
}: MatureGuardProps) {
  const [isRevealed, setIsRevealed] = useState(false)

  const handleReveal = () => {
    setIsRevealed(true)
  }

  const handleHide = () => {
    setIsRevealed(false)
  }

  return (
    <div className={`relative ${className}`}>
      {!isRevealed ? (
        <div className="relative">
          {/* Blurred content */}
          <div className="blur-sm select-none pointer-events-none">
            {children}
          </div>
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <div className="text-center space-y-4 p-6">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
                <EyeOff className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                <p className="text-sm font-medium text-gray-700 mb-3">
                  {blurText}
                </p>
                <Button 
                  onClick={handleReveal}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Content
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative">
          {children}
          <Button
            onClick={handleHide}
            size="sm"
            variant="outline"
            className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm hover:bg-white"
          >
            <EyeOff className="w-4 h-4 mr-2" />
            Hide
          </Button>
        </div>
      )}
    </div>
  )
}
