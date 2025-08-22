"use client"

import React, { useState } from "react"
import { Image, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UploaderBase } from "./UploaderBase"

interface CoverUploaderProps {
  artistId?: string
  currentCoverUrl?: string
  onCoverUploaded?: (url: string) => void
}

export function CoverUploader({ 
  artistId, 
  currentCoverUrl, 
  onCoverUploaded 
}: CoverUploaderProps) {
  const [uploadedUrl, setUploadedUrl] = useState<string | undefined>(currentCoverUrl)

  const handleUploadComplete = (files: any[]) => {
    if (files.length > 0 && files[0].result?.url) {
      const newUrl = files[0].result.url
      setUploadedUrl(newUrl)
      onCoverUploaded?.(newUrl)
    }
  }

  return (
    <div className="space-y-4">
      {/* Current cover preview */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Image className="h-5 w-5" />
          <h3 className="font-medium">Cover Image</h3>
        </div>
        
        {uploadedUrl && (
          <div className="relative aspect-[16/9] rounded-lg overflow-hidden border">
            <img
              src={uploadedUrl}
              alt="Artist cover"
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <p className="text-sm text-muted-foreground">
          Upload a wide image (recommended: 1600x900px, 16:9 ratio)
        </p>
      </div>

      {/* Uploader */}
      <UploaderBase
        scope="ARTIST_COVER"
        entityId={artistId}
        maxFiles={1}
        maxSizeMB={10}
        acceptedTypes={["image/jpeg", "image/png", "image/webp"]}
        onUploadComplete={handleUploadComplete}
      >
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            JPG, PNG, or WebP • Max 10MB • Wide images work best
          </p>
        </div>
      </UploaderBase>
    </div>
  )
}
