"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { ChevronDown, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Currency, getSupportedCurrencies } from "@artfromromania/shared";

const currencies: Record<Currency, { symbol: string; name: string }> = {
  EUR: { symbol: "€", name: "Euro" },
  USD: { symbol: "$", name: "US Dollar" },
  RON: { symbol: "RON", name: "Romanian Leu" },
};

export function CurrencySwitcher() {
  const t = useTranslations("currency");
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentCurrency, setCurrentCurrency] = useState<Currency>("EUR");
  
  useEffect(() => {
    setMounted(true);
    // Get current currency from cookie
    const getCurrentCurrency = (): Currency => {
      if (typeof document === "undefined") return "EUR";
      const cookies = document.cookie.split(";").reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split("=");
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
      
      const currency = cookies["romart_cur"] as Currency;
      return currency && getSupportedCurrencies().includes(currency) ? currency : "EUR";
    };
    
    setCurrentCurrency(getCurrentCurrency());
  }, []);

  const switchCurrency = (newCurrency: Currency) => {
    if (!mounted) return;
    
    // Set cookie
    document.cookie = `romart_cur=${newCurrency}; path=/; max-age=31536000`;
    setCurrentCurrency(newCurrency);
    setIsOpen(false);
    
    // Refresh page to update all prices
    window.location.reload();
  };

  const supportedCurrencies = getSupportedCurrencies();

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <Button variant="outline" size="sm" disabled>
        <DollarSign className="h-4 w-4 mr-2" />
        €
        <ChevronDown className="h-4 w-4 ml-2" />
      </Button>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <span className="flex items-center">
            <DollarSign className="h-4 w-4 mr-2" />
            {currencies[currentCurrency].symbol}
            <ChevronDown className="h-4 w-4 ml-2" />
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {supportedCurrencies.map((currency) => (
          <DropdownMenuItem
            key={currency}
            onClick={() => switchCurrency(currency)}
            className={currentCurrency === currency ? "bg-accent" : ""}
          >
            <span className="mr-2">{currencies[currency].symbol}</span>
            {currencies[currency].name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
