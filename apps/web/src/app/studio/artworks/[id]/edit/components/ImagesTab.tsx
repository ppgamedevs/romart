"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArtworkImagesUploader } from "@/components/uploader/ArtworkImagesUploader"

interface ImagesTabProps {
  artwork: any
}

export function ImagesTab({ artwork }: ImagesTabProps) {
  const [images, setImages] = useState(() => 
    artwork.images.map((img: any) => ({
      id: img.id,
      url: img.url,
      alt: img.alt || "",
      position: img.position,
      isPrimary: img.position === 0,
    }))
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Artwork Images</CardTitle>
        <CardDescription>
          Upload high-quality images of your artwork. The first image will be the primary display image.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ArtworkImagesUploader
          artworkId={artwork.id}
          images={images}
          onImagesChange={setImages}
          maxFiles={10}
        />
      </CardContent>
    </Card>
  )
}
