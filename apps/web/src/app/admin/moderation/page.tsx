"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface ModerationItem {
  id: string
  entityType: string
  entityId: string
  status: string
  reason?: string
  autoSignals?: any
  createdAt: string
  entity?: {
    id: string
    title?: string
    displayName?: string
    slug?: string
    images?: Array<{
      id: string
      url: string
      alt?: string
    }>
  }
}

export default function ModerationPage() {
  const [items, setItems] = useState<ModerationItem[]>([])
  const [loading, setLoading] = useState(true)

  const loadItems = async () => {
    try {
      const response = await fetch("/api/admin/moderation?status=PENDING")
      if (!response.ok) throw new Error("Failed to load items")

      const data = await response.json()
      setItems(data.items)
    } catch (error) {
      console.error("Failed to load items:", error)
      toast.error("Failed to load moderation items")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Moderation Queue</CardTitle>
            <CardDescription>
              No items to moderate
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Moderation Queue</h1>
        <p className="text-muted-foreground">
          Review and moderate content
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Item List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Items ({items.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {item.entity?.title || item.entity?.displayName || "Unknown"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.entityType} • {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={item.status === "PENDING" ? "default" : "secondary"}>
                    {item.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Item Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Item Details</CardTitle>
            <CardDescription>
              Select an item from the list to view details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Click on an item in the list to view its details and take moderation actions.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
