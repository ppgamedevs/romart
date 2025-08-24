"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { ArtworkBaseSchema, getCurrentYear } from "@artfromromania/shared"
import { PriceInput } from "../../../components/PriceInput"
import { Dimensions } from "../../../components/Dimensions"
import { saveDetails } from "../../../actions"

interface DetailsTabProps {
  artwork: any
}

export function DetailsTab({ artwork }: DetailsTabProps) {
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm({
    resolver: zodResolver(ArtworkBaseSchema),
    defaultValues: {
      title: artwork.title || "",
      description: artwork.description || "",
      year: artwork.year || undefined,
      medium: artwork.medium || "",
      category: artwork.category || "",
      widthCm: artwork.widthCm || undefined,
      heightCm: artwork.heightCm || undefined,
      depthCm: artwork.depthCm || undefined,
      framed: artwork.framed || false,
      priceAmount: artwork.priceAmount || 0,
      priceCurrency: artwork.priceCurrency || "EUR",
      kind: artwork.kind,
    },
  })

  const onSubmit = async (data: any) => {
    setIsSaving(true)
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value))
        }
      })

      await saveDetails(artwork.id, formData)
      toast.success("Details saved successfully")
    } catch (error) {
      toast.error("Failed to save details")
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const currentYear = getCurrentYear()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Artwork Details</CardTitle>
        <CardDescription>
          Provide information about your artwork. This will be visible to potential buyers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                {...form.register("title")}
                placeholder="Enter artwork title"
              />
              {form.formState.errors.title && (
                <p className="text-sm text-red-500">{form.formState.errors.title?.message?.toString()}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...form.register("description")}
                placeholder="Describe your artwork..."
                rows={4}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-red-500">{form.formState.errors.description?.message?.toString()}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Year Created</Label>
                <Input
                  id="year"
                  type="number"
                  min="1900"
                  max={currentYear + 1}
                  {...form.register("year", { valueAsNumber: true })}
                  placeholder={currentYear.toString()}
                />
                {form.formState.errors.year && (
                  <p className="text-sm text-red-500">{form.formState.errors.year?.message?.toString()}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="medium">Medium</Label>
                <Input
                  id="medium"
                  {...form.register("medium")}
                  placeholder="e.g., Oil on canvas, Acrylic, Digital"
                />
                {form.formState.errors.medium && (
                  <p className="text-sm text-red-500">{form.formState.errors.medium?.message?.toString()}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={form.watch("category")}
                onValueChange={(value) => form.setValue("category", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Painting">Painting</SelectItem>
                  <SelectItem value="Sculpture">Sculpture</SelectItem>
                  <SelectItem value="Photo">Photography</SelectItem>
                  <SelectItem value="Digital">Digital Art</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.category && (
                <p className="text-sm text-red-500">{form.formState.errors.category?.message?.toString()}</p>
              )}
            </div>
          </div>

          {/* Dimensions */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Dimensions</h3>
            <Dimensions
              width={form.watch("widthCm")}
              height={form.watch("heightCm")}
              depth={form.watch("depthCm")}
              onWidthChange={(value: number | undefined) => form.setValue("widthCm", value)}
              onHeightChange={(value: number | undefined) => form.setValue("heightCm", value)}
              onDepthChange={(value: number | undefined) => form.setValue("depthCm", value)}
              errors={{
                width: form.formState.errors.widthCm?.message?.toString(),
                height: form.formState.errors.heightCm?.message?.toString(),
                depth: form.formState.errors.depthCm?.message?.toString(),
              }}
            />

            <div className="flex items-center space-x-2">
              <Checkbox
                id="framed"
                checked={form.watch("framed")}
                onCheckedChange={(checked) => form.setValue("framed", checked as boolean)}
              />
              <Label htmlFor="framed" className="text-sm">
                Artwork is framed
              </Label>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Pricing</h3>
            <PriceInput
              value={form.watch("priceAmount")}
              onChange={(value: number) => form.setValue("priceAmount", value)}
              currency={form.watch("priceCurrency")}
              label="Price *"
              error={form.formState.errors.priceAmount?.message?.toString()}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Details"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
