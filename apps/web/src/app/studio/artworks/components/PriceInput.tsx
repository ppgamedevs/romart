"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatPrice, parsePrice } from "@artfromromania/shared"

interface PriceInputProps {
  value: number // Minor units (cents)
  onChange: (value: number) => void
  currency?: string
  label?: string
  placeholder?: string
  error?: string
  disabled?: boolean
}

export function PriceInput({
  value,
  onChange,
  currency = "EUR",
  label = "Price",
  placeholder = "0.00",
  error,
  disabled = false,
}: PriceInputProps) {
  const [displayValue, setDisplayValue] = React.useState(() => {
    return value > 0 ? formatPrice(value, currency).replace(currency, "").trim() : ""
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setDisplayValue(inputValue)
    
    if (inputValue.trim() === "") {
      onChange(0)
      return
    }

    try {
      const minorUnits = parsePrice(inputValue)
      onChange(minorUnits)
    } catch (error) {
      // Invalid input, don't update the value
    }
  }

  const handleBlur = () => {
    if (displayValue.trim() === "") {
      setDisplayValue("")
      return
    }

    try {
      const minorUnits = parsePrice(displayValue)
      const formatted = formatPrice(minorUnits, currency).replace(currency, "").trim()
      setDisplayValue(formatted)
    } catch (error) {
      // Reset to current value if invalid
      setDisplayValue(value > 0 ? formatPrice(value, currency).replace(currency, "").trim() : "")
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="price" className="text-sm font-medium">
        {label}
      </Label>
      <div className="relative">
        <Input
          id="price"
          type="text"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`pr-8 ${error ? "border-red-500" : ""}`}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          {currency}
        </span>
      </div>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      {value > 0 && (
        <p className="text-xs text-muted-foreground">
          {formatPrice(value, currency)} total
        </p>
      )}
    </div>
  )
}
