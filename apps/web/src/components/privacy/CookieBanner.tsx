"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Cookie, Settings, X } from "lucide-react"

interface CookieBannerProps {
  onConsentChange?: (consents: Record<string, boolean>) => void
}

export default function CookieBanner({ onConsentChange }: CookieBannerProps) {
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [consents, setConsents] = useState({
    NECESSARY: true,
    ANALYTICS: false,
    MARKETING: false
  })

  useEffect(() => {
    // Check if consent has been given
    const savedConsents = localStorage.getItem('cookie-consents')
    if (!savedConsents) {
      setShowBanner(true)
    } else {
      try {
        const parsed = JSON.parse(savedConsents)
        setConsents(parsed)
        onConsentChange?.(parsed)
      } catch (error) {
        setShowBanner(true)
      }
    }
  }, [onConsentChange])

  const saveConsents = (newConsents: { NECESSARY: boolean; ANALYTICS: boolean; MARKETING: boolean }) => {
    setConsents(newConsents)
    localStorage.setItem('cookie-consents', JSON.stringify(newConsents))
    onConsentChange?.(newConsents)
  }

  const handleAcceptAll = () => {
    const allConsents = {
      NECESSARY: true,
      ANALYTICS: true,
      MARKETING: true
    }
    saveConsents(allConsents)
    setShowBanner(false)
  }

  const handleAcceptNecessary = () => {
    const necessaryConsents = {
      NECESSARY: true,
      ANALYTICS: false,
      MARKETING: false
    }
    saveConsents(necessaryConsents)
    setShowBanner(false)
  }

  const handleSaveSettings = () => {
    saveConsents(consents)
    setShowBanner(false)
    setShowSettings(false)
  }

  const handleConsentChange = (key: string, value: boolean) => {
    setConsents(prev => ({
      ...prev,
      [key]: value
    }))
  }

  if (!showBanner) {
    return null
  }

  if (showSettings) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="h-5 w-5" />
                Cookie Settings
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>
              Customize your cookie preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Necessary Cookies</div>
                  <div className="text-sm text-muted-foreground">
                    Required for basic site functionality
                  </div>
                </div>
                <Switch 
                  checked={consents.NECESSARY} 
                  disabled 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Analytics Cookies</div>
                  <div className="text-sm text-muted-foreground">
                    Help us improve our services
                  </div>
                </div>
                <Switch 
                  checked={consents.ANALYTICS} 
                  onCheckedChange={(checked) => handleConsentChange('ANALYTICS', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Marketing Cookies</div>
                  <div className="text-sm text-muted-foreground">
                    Personalized content and offers
                  </div>
                </div>
                <Switch 
                  checked={consents.MARKETING} 
                  onCheckedChange={(checked) => handleConsentChange('MARKETING', checked)}
                />
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setShowSettings(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveSettings}
                className="flex-1"
              >
                Save Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Cookie className="h-6 w-6 mt-1 text-blue-600" />
            <div className="flex-1">
              <h3 className="font-semibold mb-2">We use cookies</h3>
              <p className="text-sm text-muted-foreground mb-4">
                We use cookies to enhance your browsing experience, serve personalized content, 
                and analyze our traffic. By clicking &quot;Accept All&quot;, you consent to our use of cookies.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowSettings(true)}
                >
                  Customize
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleAcceptNecessary}
                >
                  Accept Necessary
                </Button>
                <Button 
                  size="sm"
                  onClick={handleAcceptAll}
                  className="flex-1 sm:flex-none"
                >
                  Accept All
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
