"use client"

import React, { useState, useCallback } from "react"
import { UploaderBase } from "./UploaderBase"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ImageScope } from "@artfromromania/storage"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { GripVertical, Star, StarOff, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"
import { setPrimaryImage, reorderImages } from "@/app/studio/artworks/actions"

interface ArtworkImage {
  id: string
  url: string
  alt?: string
  position: number
  isPrimary: boolean
}

interface ArtworkImagesUploaderProps {
  artworkId: string
  images: ArtworkImage[]
  onImagesChange: (images: ArtworkImage[]) => void
  maxFiles?: number
}

export function ArtworkImagesUploader({
  artworkId,
  images,
  onImagesChange,
  maxFiles = 10,
}: ArtworkImagesUploaderProps) {
  const [isReordering, setIsReordering] = useState(false)

  const handleUploadComplete = useCallback((files: any[]) => {
    // Convert uploaded files to artwork images
    const newImages = files.map((file, index) => ({
      id: file.result.id,
      url: file.result.url,
      alt: file.file.name,
      position: images.length + index,
      isPrimary: images.length === 0 && index === 0, // First image becomes primary
    }))

    onImagesChange([...images, ...newImages])
    toast.success(`${files.length} image(s) uploaded successfully`)
  }, [images, onImagesChange])

  const handleUploadError = useCallback((error: string) => {
    toast.error(`Upload failed: ${error}`)
  }, [])

  const handleSetPrimary = async (imageId: string) => {
    try {
      await setPrimaryImage(artworkId, imageId)
      
      // Update local state
      const updatedImages = images.map(img => ({
        ...img,
        isPrimary: img.id === imageId,
      }))
      onImagesChange(updatedImages)
      
      toast.success("Primary image updated")
    } catch (error) {
      toast.error("Failed to set primary image")
    }
  }

  const handleReorder = async (result: any) => {
    if (!result.destination) return

    const items = Array.from(images)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update positions
    const updatedImages = items.map((item, index) => ({
      ...item,
      position: index,
      isPrimary: index === 0, // First image is always primary
    }))

    onImagesChange(updatedImages)

    try {
      // Update in database
      await reorderImages(artworkId, updatedImages.map(img => img.id))
      toast.success("Image order updated")
    } catch (error) {
      toast.error("Failed to update image order")
    }
  }

  const handleDelete = async (imageId: string) => {
    // Remove from local state
    const updatedImages = images.filter(img => img.id !== imageId)
    onImagesChange(updatedImages)
    
    toast.success("Image removed")
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Artwork Images</h3>
          <p className="text-sm text-muted-foreground">
            Upload high-quality images of your artwork. The first image will be the primary display image.
          </p>
        </div>
        <Badge variant="secondary">
          {images.length}/{maxFiles} images
        </Badge>
      </div>

      {images.length > 0 && (
        <DragDropContext onDragEnd={handleReorder}>
          <Droppable droppableId="images" direction="horizontal">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              >
                {images.map((image, index) => (
                  <Draggable key={image.id} draggableId={image.id} index={index}>
                    {(provided, snapshot) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`relative group ${
                          snapshot.isDragging ? "ring-2 ring-primary" : ""
                        }`}
                      >
                        <CardContent className="p-0">
                          <div className="relative aspect-square">
                            <img
                              src={image.url}
                              alt={image.alt || "Artwork image"}
                              className="w-full h-full object-cover rounded-t-lg"
                            />
                            
                            {/* Primary indicator */}
                            {image.isPrimary && (
                              <div className="absolute top-2 left-2">
                                <Badge className="bg-yellow-500 text-white">
                                  <Star className="h-3 w-3 mr-1" />
                                  Primary
                                </Badge>
                              </div>
                            )}

                            {/* Drag handle */}
                            <div
                              {...provided.dragHandleProps}
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-8 w-8 p-0"
                              >
                                <GripVertical className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Actions overlay */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              {!image.isPrimary && (
                                <Button
                                  size="sm"
                                  onClick={() => handleSetPrimary(image.id)}
                                  className="h-8"
                                >
                                  <Star className="h-4 w-4 mr-1" />
                                  Set Primary
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(image.id)}
                                className="h-8"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {images.length < maxFiles && (
        <UploaderBase
          scope="ARTWORK_IMAGE"
          entityId={artworkId}
          maxFiles={maxFiles - images.length}
          maxSizeMB={25}
          acceptedTypes={["image/jpeg", "image/png", "image/webp", "image/avif"]}
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
        >
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Upload Artwork Images</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Drag and drop images here, or click to select files
            </p>
            <p className="text-xs text-muted-foreground">
              JPEG, PNG, WebP, AVIF up to 25MB each
            </p>
          </div>
        </UploaderBase>
      )}

      {images.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No images uploaded yet. Upload at least one image to publish your artwork.</p>
        </div>
      )}
    </div>
  )
}
