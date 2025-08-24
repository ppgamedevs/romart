"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, Truck, CheckCircle } from "lucide-react"
import { toast } from "sonner"

interface ManualLabelFormProps {
  shipmentId: string
  destinationCountry: string
  onSuccess: () => void
}

export function ManualLabelForm({ shipmentId, destinationCountry, onSuccess }: ManualLabelFormProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadKey, setUploadKey] = useState<string>("")
  const [trackingCode, setTrackingCode] = useState("")
  const [uploadUrl, setUploadUrl] = useState("")

  const isDomestic = destinationCountry === "RO"
  const allowedCarrier = isDomestic ? "SAMEDAY" : "DHL"

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("Please select a PDF file")
        return
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast.error("File size must be less than 5MB")
        return
      }
      setUploadedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!uploadedFile) {
      toast.error("Please select a file first")
      return
    }

    setIsUploading(true)
    try {
      // Step 1: Get presigned URL
      const presignResponse = await fetch(`/api/shipping/${shipmentId}/manual-label/presign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!presignResponse.ok) {
        throw new Error("Failed to get upload URL")
      }

      const presignData = await presignResponse.json()
      setUploadUrl(presignData.uploadUrl)
      setUploadKey(presignData.key)

      // Step 2: Upload file to presigned URL
      const uploadResponse = await fetch(presignData.uploadUrl, {
        method: "PUT",
        body: uploadedFile,
        headers: {
          "Content-Type": "application/pdf",
        },
      })

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file")
      }

      toast.success("Label uploaded successfully")
    } catch (error) {
      console.error("Upload failed:", error)
      toast.error("Failed to upload label")
    } finally {
      setIsUploading(false)
    }
  }

  const handleFinalize = async () => {
    if (!uploadKey || !trackingCode.trim()) {
      toast.error("Please upload a label and enter tracking code")
      return
    }

    setIsFinalizing(true)
    try {
      const response = await fetch(`/api/shipping/${shipmentId}/manual-label/finalize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: uploadKey,
          trackingCode: trackingCode.trim(),
          carrier: allowedCarrier,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to finalize label")
      }

      toast.success("Label finalized successfully")
      onSuccess()
    } catch (error) {
      console.error("Finalize failed:", error)
      toast.error(error instanceof Error ? error.message : "Failed to finalize label")
    } finally {
      setIsFinalizing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Upload Shipping Label
        </CardTitle>
        <CardDescription>
          Upload the shipping label PDF and enter tracking information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Carrier Info */}
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4" />
          <span className="text-sm font-medium">Carrier:</span>
          <Badge variant={isDomestic ? "default" : "secondary"}>
            {allowedCarrier}
          </Badge>
          <span className="text-sm text-muted-foreground">
            ({isDomestic ? "Domestic" : "International"})
          </span>
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <Label htmlFor="label-file">Shipping Label (PDF)</Label>
          <div className="flex gap-2">
            <Input
              id="label-file"
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
            <Button
              onClick={handleUpload}
              disabled={!uploadedFile || isUploading}
              size="sm"
            >
              {isUploading ? (
                "Uploading..."
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </div>
          {uploadedFile && (
            <p className="text-sm text-muted-foreground">
              Selected: {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        {/* Tracking Code */}
        <div className="space-y-2">
          <Label htmlFor="tracking-code">Tracking Code</Label>
          <Input
            id="tracking-code"
            value={trackingCode}
            onChange={(e) => setTrackingCode(e.target.value)}
            placeholder="Enter tracking number"
            disabled={isFinalizing}
          />
        </div>

        {/* Finalize Button */}
        <Button
          onClick={handleFinalize}
          disabled={!uploadKey || !trackingCode.trim() || isFinalizing}
          className="w-full"
        >
          {isFinalizing ? (
            "Finalizing..."
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Finalize Label
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
