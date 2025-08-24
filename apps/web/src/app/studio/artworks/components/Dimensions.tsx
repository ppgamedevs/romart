"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cmToInches } from "@artfromromania/shared"

interface DimensionsProps {
  width?: number
  height?: number
  depth?: number
  onWidthChange: (value: number | undefined) => void
  onHeightChange: (value: number | undefined) => void
  onDepthChange: (value: number | undefined) => void
  errors?: {
    width?: string
    height?: string
    depth?: string
  }
  disabled?: boolean
}

export function Dimensions({
  width,
  height,
  depth,
  onWidthChange,
  onHeightChange,
  onDepthChange,
  errors,
  disabled = false,
}: DimensionsProps) {
  const handleDimensionChange = (
    value: string,
    onChange: (value: number | undefined) => void
  ) => {
    if (value.trim() === "") {
      onChange(undefined)
      return
    }

    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue >= 0) {
      onChange(numValue)
    }
  }

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">Dimensions (cm)</Label>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="width" className="text-sm">
            Width
          </Label>
          <div className="relative">
            <Input
              id="width"
              type="number"
              step="0.1"
              min="0"
              value={width || ""}
              onChange={(e) => handleDimensionChange(e.target.value, onWidthChange)}
              placeholder="0.0"
              disabled={disabled}
              className={errors?.width ? "border-red-500" : ""}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              cm
            </span>
          </div>
          {width && (
            <p className="text-xs text-muted-foreground">
              ≈ {cmToInches(width)} inches
            </p>
          )}
          {errors?.width && (
            <p className="text-sm text-red-500">{errors.width}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="height" className="text-sm">
            Height
          </Label>
          <div className="relative">
            <Input
              id="height"
              type="number"
              step="0.1"
              min="0"
              value={height || ""}
              onChange={(e) => handleDimensionChange(e.target.value, onHeightChange)}
              placeholder="0.0"
              disabled={disabled}
              className={errors?.height ? "border-red-500" : ""}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              cm
            </span>
          </div>
          {height && (
            <p className="text-xs text-muted-foreground">
              ≈ {cmToInches(height)} inches
            </p>
          )}
          {errors?.height && (
            <p className="text-sm text-red-500">{errors.height}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="depth" className="text-sm">
            Depth
          </Label>
          <div className="relative">
            <Input
              id="depth"
              type="number"
              step="0.1"
              min="0"
              value={depth || ""}
              onChange={(e) => handleDimensionChange(e.target.value, onDepthChange)}
              placeholder="0.0"
              disabled={disabled}
              className={errors?.depth ? "border-red-500" : ""}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              cm
            </span>
          </div>
          {depth && (
            <p className="text-xs text-muted-foreground">
              ≈ {cmToInches(depth)} inches
            </p>
          )}
          {errors?.depth && (
            <p className="text-sm text-red-500">{errors.depth}</p>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Leave depth empty for 2D artworks (paintings, prints, etc.)
      </p>
    </div>
  )
}
