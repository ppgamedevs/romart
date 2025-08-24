"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Package, 
  Truck, 
  Download, 
  ExternalLink, 
  CheckCircle, 
  Clock,
  FileText
} from "lucide-react"
import { toast } from "sonner"
import { ManualLabelForm } from "./ManualLabelForm"
import { trackingUrl, getCarrierDisplayName, getStatusDisplayName } from "@/lib/tracking"

interface ShipmentPackage {
  id: string
  kind: string
  refId?: string
  lengthCm: number
  widthCm?: number
  heightCm?: number
  diameterCm?: number
  weightKg: number
  dimWeightKg: number
}

interface Shipment {
  id: string
  method: string
  provider: string
  serviceName?: string
  zone?: string
  insuredAmount: number
  currency: string
  status: string
  labelStorageKey?: string
  trackingNumbers?: Array<{ carrier: string; code: string }>
  handedOverAt?: string
  deliveredAt?: string
  createdAt: string
  packages: ShipmentPackage[]
}

interface ShippingManagementProps {
  shipment: Shipment
  destinationCountry: string
  onRefresh: () => void
}

export function ShippingManagement({ shipment, destinationCountry, onRefresh }: ShippingManagementProps) {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  const handleStatusUpdate = async (action: "mark-in-transit" | "mark-delivered") => {
    setIsUpdatingStatus(true)
    try {
      const response = await fetch(`/api/shipping/${shipment.id}/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to update status")
      }

      toast.success(`Shipment ${action === "mark-in-transit" ? "marked as in transit" : "marked as delivered"}`)
      onRefresh()
    } catch (error) {
      console.error("Status update failed:", error)
      toast.error("Failed to update shipment status")
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleDownloadLabel = async () => {
    try {
      const response = await fetch(`/api/shipping/${shipment.id}/label`)
      if (!response.ok) {
        throw new Error("Failed to get label URL")
      }
      
      const data = await response.json()
      window.open(data.downloadUrl, "_blank")
    } catch (error) {
      console.error("Label download failed:", error)
      toast.error("Failed to download label")
    }
  }

  const trackingNumber = shipment.trackingNumbers?.[0]
  const hasLabel = !!shipment.labelStorageKey

  return (
    <div className="space-y-6">
      {/* Shipment Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Shipment Details
          </CardTitle>
          <CardDescription>
            Shipping method: {shipment.method} • Provider: {shipment.provider}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Status</p>
              <Badge variant={
                shipment.status === "DELIVERED" ? "default" :
                shipment.status === "IN_TRANSIT" ? "secondary" :
                shipment.status === "LABEL_PURCHASED" ? "outline" : "destructive"
              }>
                {getStatusDisplayName(shipment.status)}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium">Service</p>
              <p className="text-sm">{shipment.serviceName || "Standard"}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Zone</p>
              <p className="text-sm">{shipment.zone || "Unknown"}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Insured Amount</p>
              <p className="text-sm">
                {(shipment.insuredAmount / 100).toFixed(2)} {shipment.currency}
              </p>
            </div>
          </div>

          {/* Tracking Information */}
          {trackingNumber && (
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Tracking</p>
                  <p className="text-sm text-muted-foreground">
                    {getCarrierDisplayName(trackingNumber.carrier)} • {trackingNumber.code}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(trackingUrl(trackingNumber.carrier, trackingNumber.code), "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Track
                </Button>
              </div>
            </div>
          )}

          {/* Status Timeline */}
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-2">Timeline</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Created</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(shipment.createdAt).toLocaleDateString()}
                </span>
              </div>
              {shipment.handedOverAt && (
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Handed over to carrier</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(shipment.handedOverAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              {shipment.deliveredAt && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Delivered</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(shipment.deliveredAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Packages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Packages ({shipment.packages.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {shipment.packages.map((pkg, index) => (
              <div key={pkg.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{pkg.kind}</Badge>
                  <div>
                    <p className="text-sm font-medium">
                      {pkg.refId || `Package ${index + 1}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {pkg.lengthCm}×{pkg.widthCm || pkg.diameterCm}×{pkg.heightCm || pkg.diameterCm} cm
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{pkg.weightKg} kg</p>
                  <p className="text-sm text-muted-foreground">
                    Dim: {pkg.dimWeightKg} kg
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Label Management */}
      {!hasLabel && shipment.status === "READY_TO_SHIP" && (
        <ManualLabelForm
          shipmentId={shipment.id}
          destinationCountry={destinationCountry}
          onSuccess={onRefresh}
        />
      )}

      {/* Label Actions */}
      {hasLabel && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Label Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleDownloadLabel}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Label
              </Button>
            </div>

            <Separator />

            <div className="flex gap-2">
              {shipment.status === "LABEL_PURCHASED" && (
                <Button
                  onClick={() => handleStatusUpdate("mark-in-transit")}
                  disabled={isUpdatingStatus}
                  className="flex-1"
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Mark In Transit
                </Button>
              )}
              
              {shipment.status === "IN_TRANSIT" && (
                <Button
                  onClick={() => handleStatusUpdate("mark-delivered")}
                  disabled={isUpdatingStatus}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Delivered
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
