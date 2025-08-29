"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../../../../../components/ui/dialog"
import { toast } from "sonner"
import { Plus, Edit, Trash2, Package, Image } from "lucide-react"
import { EditionPrintSchema, EditionDigitalSchema, formatPrice } from "@artfromromania/shared"
import { PriceInput } from "../../../components/PriceInput"
import { addEditionPrint, addEditionDigital, deleteEdition, generateStandardPrints } from "../../../actions"

interface EditionsTabProps {
  artwork: any
}

export function EditionsTab({ artwork }: EditionsTabProps) {
  const [editions, setEditions] = useState(artwork.editions)
  const [isAddingPrint, setIsAddingPrint] = useState(false)
  const [isAddingDigital, setIsAddingDigital] = useState(false)
  const [isGeneratingPrints, setIsGeneratingPrints] = useState(false)

  const printForm = useForm({
    resolver: zodResolver(EditionPrintSchema),
    defaultValues: {
      sku: "",
      runSize: 1,
      available: 1,
      unitAmount: 0,
      currency: "EUR",
      type: "PRINT" as const,
      material: "CANVAS" as const,
      sizeName: "",
      widthCm: undefined,
      heightCm: undefined,
    },
  })

  const digitalForm = useForm({
    resolver: zodResolver(EditionDigitalSchema),
    defaultValues: {
      sku: "",
      unitAmount: 0,
      currency: "EUR",
      type: "DIGITAL" as const,
      downloadableUrl: "",
    },
  })

  const handleAddPrint = async (data: any) => {
    setIsAddingPrint(true)
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value))
        }
      })

      await addEditionPrint(artwork.id, formData)
      
      // Refresh editions
      const response = await fetch(`/api/artworks/${artwork.id}/editions`)
      const updatedEditions = await response.json()
      setEditions(updatedEditions)
      
      printForm.reset()
      toast.success("Print edition added successfully")
    } catch (error) {
      toast.error("Failed to add print edition")
      console.error(error)
    } finally {
      setIsAddingPrint(false)
    }
  }

  const handleAddDigital = async (data: any) => {
    setIsAddingDigital(true)
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value))
        }
      })

      await addEditionDigital(artwork.id, formData)
      
      // Refresh editions
      const response = await fetch(`/api/artworks/${artwork.id}/editions`)
      const updatedEditions = await response.json()
      setEditions(updatedEditions)
      
      digitalForm.reset()
      toast.success("Digital edition added successfully")
    } catch (error) {
      toast.error("Failed to add digital edition")
      console.error(error)
    } finally {
      setIsAddingDigital(false)
    }
  }

  const handleDeleteEdition = async (editionId: string) => {
    try {
      await deleteEdition(editionId)
      setEditions(editions.filter((ed: any) => ed.id !== editionId))
      toast.success("Edition deleted successfully")
    } catch (error) {
      toast.error("Failed to delete edition")
    }
  }

  const handleGenerateStandardPrints = async () => {
    setIsGeneratingPrints(true)
    try {
      const result = await generateStandardPrints(artwork.id)
      
      // Refresh editions
      const response = await fetch(`/api/artworks/${artwork.id}/editions`)
      const updatedEditions = await response.json()
      setEditions(updatedEditions)
      
      toast.success(`Generated ${result.count} standard print options`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate print options")
      console.error(error)
    } finally {
      setIsGeneratingPrints(false)
    }
  }

  const getEditionIcon = (type: string) => {
    return type === "PRINT" ? <Package className="h-4 w-4" /> : <Image className="h-4 w-4" />
  }

  const getEditionLabel = (type: string) => {
    return type === "PRINT" ? "Print Edition" : "Digital Edition"
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Editions</CardTitle>
              <CardDescription>
                Manage editions for your {artwork.kind.toLowerCase()} artwork
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {artwork.kind === "ORIGINAL" && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleGenerateStandardPrints}
                  disabled={isGeneratingPrints}
                >
                  {isGeneratingPrints ? "Generating..." : "Generate standard print options"}
                </Button>
              )}
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <span className="flex items-center">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Print Edition
                    </span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Print Edition</DialogTitle>
                    <DialogDescription>
                      Create a new print edition with limited quantity
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={printForm.handleSubmit(handleAddPrint)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="sku">SKU *</Label>
                      <Input
                        id="sku"
                        {...printForm.register("sku")}
                        placeholder="e.g., PRINT-001"
                      />
                      {printForm.formState.errors.sku && (
                        <p className="text-sm text-red-500">{printForm.formState.errors.sku.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="runSize">Run Size *</Label>
                        <Input
                          id="runSize"
                          type="number"
                          min="1"
                          {...printForm.register("runSize", { valueAsNumber: true })}
                        />
                        {printForm.formState.errors.runSize && (
                          <p className="text-sm text-red-500">{printForm.formState.errors.runSize.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="available">Available *</Label>
                        <Input
                          id="available"
                          type="number"
                          min="0"
                          {...printForm.register("available", { valueAsNumber: true })}
                        />
                        {printForm.formState.errors.available && (
                          <p className="text-sm text-red-500">{printForm.formState.errors.available.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="material">Material *</Label>
                        <select
                          id="material"
                          {...printForm.register("material")}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="CANVAS">Canvas</option>
                          <option value="METAL">Metal</option>
                        </select>
                        {printForm.formState.errors.material && (
                          <p className="text-sm text-red-500">{printForm.formState.errors.material.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sizeName">Size Name</Label>
                        <Input
                          id="sizeName"
                          {...printForm.register("sizeName")}
                          placeholder="e.g., 30x40 cm"
                        />
                        {printForm.formState.errors.sizeName && (
                          <p className="text-sm text-red-500">{printForm.formState.errors.sizeName.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="widthCm">Width (cm)</Label>
                        <Input
                          id="widthCm"
                          type="number"
                          min="0"
                          max="300"
                          step="0.1"
                          {...printForm.register("widthCm", { valueAsNumber: true })}
                        />
                        {printForm.formState.errors.widthCm && (
                          <p className="text-sm text-red-500">{printForm.formState.errors.widthCm.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="heightCm">Height (cm)</Label>
                        <Input
                          id="heightCm"
                          type="number"
                          min="0"
                          max="300"
                          step="0.1"
                          {...printForm.register("heightCm", { valueAsNumber: true })}
                        />
                        {printForm.formState.errors.heightCm && (
                          <p className="text-sm text-red-500">{printForm.formState.errors.heightCm.message}</p>
                        )}
                      </div>
                    </div>

                    <PriceInput
                      value={printForm.watch("unitAmount")}
                      onChange={(value: number) => printForm.setValue("unitAmount", value)}
                      currency={printForm.watch("currency")}
                      label="Price per unit *"
                      error={printForm.formState.errors.unitAmount?.message}
                    />

                    <Button type="submit" disabled={isAddingPrint} className="w-full">
                      {isAddingPrint ? "Adding..." : "Add Print Edition"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              {artwork.kind === "DIGITAL" && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <span className="flex items-center">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Digital Edition
                      </span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Digital Edition</DialogTitle>
                      <DialogDescription>
                        Create a new digital edition for download
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={digitalForm.handleSubmit(handleAddDigital)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="digitalSku">SKU *</Label>
                        <Input
                          id="digitalSku"
                          {...digitalForm.register("sku")}
                          placeholder="e.g., DIGITAL-001"
                        />
                        {digitalForm.formState.errors.sku && (
                          <p className="text-sm text-red-500">{digitalForm.formState.errors.sku.message}</p>
                        )}
                      </div>

                      <PriceInput
                        value={digitalForm.watch("unitAmount")}
                        onChange={(value: number) => digitalForm.setValue("unitAmount", value)}
                        currency={digitalForm.watch("currency")}
                        label="Price *"
                        error={digitalForm.formState.errors.unitAmount?.message}
                      />

                      <div className="space-y-2">
                        <Label htmlFor="downloadableUrl">Download URL (Optional)</Label>
                        <Input
                          id="downloadableUrl"
                          type="url"
                          {...digitalForm.register("downloadableUrl")}
                          placeholder="https://example.com/file.pdf"
                        />
                        {digitalForm.formState.errors.downloadableUrl && (
                          <p className="text-sm text-red-500">{digitalForm.formState.errors.downloadableUrl.message}</p>
                        )}
                      </div>

                      <Button type="submit" disabled={isAddingDigital} className="w-full">
                        {isAddingDigital ? "Adding..." : "Add Digital Edition"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {editions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No editions created yet</p>
              <p className="text-sm">Add your first edition to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {editions.map((edition: any) => (
                <div
                  key={edition.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      {getEditionIcon(edition.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{edition.sku}</h4>
                        <Badge variant="outline">{getEditionLabel(edition.type)}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {edition.type === "PRINT"
                          ? `${edition.material || "Print"}${edition.sizeName ? ` | ${edition.sizeName}` : ""}${edition.runSize ? ` | Run: ${edition.runSize}` : ""}${edition.available !== null ? ` | Available: ${edition.available}` : ""}`
                          : "Digital download"
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">
                        {formatPrice(edition.unitAmount, edition.currency)}
                      </p>
                      <p className="text-sm text-muted-foreground">per unit</p>
                    </div>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteEdition(edition.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
