"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, Eye, Archive } from "lucide-react"
import { toast } from "sonner"
import { PublishValidation } from "@artfromromania/shared"
import { PublishChecklist } from "../../../components/PublishChecklist"
import { publishArtwork, unpublishArtwork, deleteArtwork } from "../../../actions"

interface PublishTabProps {
  artwork: any
  artist: any
  validation: PublishValidation
}

export function PublishTab({ artwork, artist, validation }: PublishTabProps) {
  const [isPublishing, setIsPublishing] = useState(false)
  const [isUnpublishing, setIsUnpublishing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handlePublish = async () => {
    setIsPublishing(true)
    try {
      await publishArtwork(artwork.id)
      toast.success("Artwork published successfully!")
      // Refresh the page to update status
      window.location.reload()
    } catch (error) {
      toast.error("Failed to publish artwork")
      console.error(error)
    } finally {
      setIsPublishing(false)
    }
  }

  const handleUnpublish = async () => {
    setIsUnpublishing(true)
    try {
      await unpublishArtwork(artwork.id)
      toast.success("Artwork unpublished successfully!")
      // Refresh the page to update status
      window.location.reload()
    } catch (error) {
      toast.error("Failed to unpublish artwork")
      console.error(error)
    } finally {
      setIsUnpublishing(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this artwork? This action cannot be undone.")) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteArtwork(artwork.id)
      toast.success("Artwork deleted successfully!")
    } catch (error) {
      toast.error("Failed to delete artwork")
      console.error(error)
    } finally {
      setIsDeleting(false)
    }
  }

  const isPublished = artwork.status === "PUBLISHED"

  return (
    <div className="space-y-6">
      {/* Publish Checklist */}
      <PublishChecklist
        validation={validation}
        onPublish={handlePublish}
        onUnpublish={handleUnpublish}
        isPublished={isPublished}
        isLoading={isPublishing || isUnpublishing}
      />

      {/* Artwork Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Artwork Preview</CardTitle>
          <CardDescription>
            How your artwork will appear to potential buyers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image Preview */}
            <div className="space-y-4">
              <h4 className="font-medium">Primary Image</h4>
              {artwork.images[0] ? (
                <div className="aspect-square rounded-lg overflow-hidden border">
                  <img
                    src={artwork.images[0].url}
                    alt={artwork.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No image uploaded</p>
                  </div>
                </div>
              )}
            </div>

            {/* Details Preview */}
            <div className="space-y-4">
              <h4 className="font-medium">Artwork Details</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Title</p>
                  <p className="font-medium">{artwork.title || "Untitled"}</p>
                </div>

                {artwork.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="text-sm">{artwork.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <Badge variant="outline">{artwork.kind}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={isPublished ? "default" : "secondary"}>
                      {artwork.status}
                    </Badge>
                  </div>
                </div>

                {artwork.priceAmount > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Price</p>
                    <p className="font-medium">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: artwork.priceCurrency,
                      }).format(artwork.priceAmount / 100)}
                    </p>
                  </div>
                )}

                {artwork.editions.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Editions</p>
                    <p className="text-sm">{artwork.editions.length} edition(s) available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Artist Profile Status */}
      <Card>
        <CardHeader>
          <CardTitle>Artist Profile Status</CardTitle>
          <CardDescription>
            Your profile requirements for publishing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {artist.kycStatus === "APPROVED" ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                )}
                <span>KYC Verification</span>
              </div>
              <Badge variant={artist.kycStatus === "APPROVED" ? "default" : "secondary"}>
                {artist.kycStatus}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {artist.completionScore >= 80 ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                )}
                <span>Profile Completion</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${artist.completionScore}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground">
                  {artist.completionScore}%
                </span>
              </div>
            </div>
          </div>

          {artist.kycStatus !== "APPROVED" && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>KYC Required:</strong> Complete your identity verification to publish artworks.
              </p>
            </div>
          )}

          {artist.completionScore < 80 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Profile Incomplete:</strong> Complete at least 80% of your profile to publish artworks.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions for this artwork
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Delete Artwork</h4>
              <p className="text-sm text-muted-foreground">
                Permanently delete this artwork and all associated data
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Artwork"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
