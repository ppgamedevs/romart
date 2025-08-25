"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings, X } from "lucide-react";

interface CookieBannerProps {
  onConsentChange?: (consents: { NECESSARY: boolean; ANALYTICS: boolean; MARKETING: boolean }) => void;
}

export default function CookieBanner({ onConsentChange }: CookieBannerProps) {
  const [mounted, setMounted] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [consents, setConsents] = useState({
    NECESSARY: true,
    ANALYTICS: false,
    MARKETING: false
  });

  useEffect(() => {
    setMounted(true);
    // Check if consent has been given
    const savedConsents = localStorage.getItem('cookie-consents');
    if (!savedConsents) {
      setShowBanner(true);
    } else {
      try {
        const parsed = JSON.parse(savedConsents);
        setConsents(parsed);
        onConsentChange?.(parsed);
      } catch (error) {
        setShowBanner(true);
      }
    }
  }, [onConsentChange]);

  const saveConsents = (newConsents: { NECESSARY: boolean; ANALYTICS: boolean; MARKETING: boolean }) => {
    setConsents(newConsents);
    localStorage.setItem('cookie-consents', JSON.stringify(newConsents));
    onConsentChange?.(newConsents);
  };

  const handleAcceptAll = () => {
    const allConsents = {
      NECESSARY: true,
      ANALYTICS: true,
      MARKETING: true
    };
    saveConsents(allConsents);
    setShowBanner(false);
  };

  const handleAcceptNecessary = () => {
    const necessaryConsents = {
      NECESSARY: true,
      ANALYTICS: false,
      MARKETING: false
    };
    saveConsents(necessaryConsents);
    setShowBanner(false);
  };

  const handleSaveSettings = () => {
    saveConsents(consents);
    setShowBanner(false);
    setShowSettings(false);
  };

  const handleConsentChange = (key: string, value: boolean) => {
    setConsents(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  if (!showBanner) {
    return null;
  }

  if (showSettings) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto">
        <Card className="shadow-lg border-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Cookie Settings</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Necessary Cookies</Label>
                  <p className="text-sm text-muted-foreground">
                    Required for the website to function properly
                  </p>
                </div>
                <Switch checked={consents.NECESSARY} disabled />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Analytics Cookies</Label>
                  <p className="text-sm text-muted-foreground">
                    Help us understand how visitors interact with our website
                  </p>
                </div>
                <Switch
                  checked={consents.ANALYTICS}
                  onCheckedChange={(checked) => handleConsentChange('ANALYTICS', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Marketing Cookies</Label>
                  <p className="text-sm text-muted-foreground">
                    Used to deliver personalized advertisements
                  </p>
                </div>
                <Switch
                  checked={consents.MARKETING}
                  onCheckedChange={(checked) => handleConsentChange('MARKETING', checked)}
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleSaveSettings} className="flex-1">
                Save Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto">
      <Card className="shadow-lg border-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">We use cookies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
                     <p className="text-sm text-muted-foreground">
             We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. 
             By clicking &quot;Accept All&quot;, you consent to our use of cookies.
           </p>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleAcceptNecessary} className="flex-1">
              Necessary Only
            </Button>
            <Button onClick={handleAcceptAll} className="flex-1">
              Accept All
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(true)}
            className="w-full"
          >
            <Settings className="h-4 w-4 mr-2" />
            Customize Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
