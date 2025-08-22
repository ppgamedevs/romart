"use client"

import React, { useState } from "react"
import { User, Upload } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { UploaderBase } from "./UploaderBase"

interface AvatarUploaderProps {
  artistId?: string
  currentAvatarUrl?: string
  onAvatarUploaded?: (url: string) => void
}

export function AvatarUploader({ 
  artistId, 
  currentAvatarUrl, 
  onAvatarUploaded 
}: AvatarUploaderProps) {
  const [uploadedUrl, setUploadedUrl] = useState<string | undefined>(currentAvatarUrl)

  const handleUploadComplete = (files: any[]) => {
    if (files.length > 0 && files[0].result?.url) {
      const newUrl = files[0].result.url
      setUploadedUrl(newUrl)
      onAvatarUploaded?.(newUrl)
    }
  }

  return (
    <div className="space-y-4">
      {/* Current avatar preview */}
      <div className="flex items-center space-x-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={uploadedUrl} alt="Artist avatar" />
          <AvatarFallback>
            <User className="h-8 w-8" />
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-medium">Profile Picture</h3>
          <p className="text-sm text-muted-foreground">
            Upload a square image (recommended: 400x400px)
          </p>
        </div>
      </div>

      {/* Uploader */}
      <UploaderBase
        scope="ARTIST_AVATAR"
        entityId={artistId}
        maxFiles={1}
        maxSizeMB={5}
        acceptedTypes={["image/jpeg", "image/png", "image/webp"]}
        onUploadComplete={handleUploadComplete}
      >
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            JPG, PNG, or WebP • Max 5MB • Square images work best
          </p>
        </div>
      </UploaderBase>
    </div>
  )
}
