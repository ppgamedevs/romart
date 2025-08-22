"use client"

import React, { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, X, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { ImageScope } from "@artfromromania/storage"

interface UploadFile {
  id: string
  file: File
  status: "uploading" | "success" | "error"
  progress: number
  error?: string
  result?: {
    id: string
    url: string
    key: string
    size: number
  }
}

interface UploaderBaseProps {
  scope: ImageScope
  entityId?: string
  maxFiles?: number
  maxSizeMB?: number
  acceptedTypes?: string[]
  onUploadComplete?: (files: UploadFile[]) => void
  onUploadError?: (error: string) => void
  children?: React.ReactNode
}

export function UploaderBase({
  scope,
  entityId,
  maxFiles = 1,
  maxSizeMB = 25,
  acceptedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"],
  onUploadComplete,
  onUploadError,
  children
}: UploaderBaseProps) {
  const [files, setFiles] = useState<UploadFile[]>([])

  const uploadFile = useCallback(async (file: File): Promise<UploadFile> => {
    const uploadId = Math.random().toString(36).substring(7)
    
    // Create upload file entry
    const uploadFile: UploadFile = {
      id: uploadId,
      file,
      status: "uploading",
      progress: 0
    }

    try {
      // Step 1: Get presigned URL
      const presignResponse = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scope,
          entityId,
          contentType: file.type,
          size: file.size,
        }),
      })

      if (!presignResponse.ok) {
        const error = await presignResponse.json()
        throw new Error(error.error || "Failed to get upload URL")
      }

      const { presignedPost, key } = await presignResponse.json()

      // Step 2: Upload to storage
      const formData = new FormData()
      Object.entries(presignedPost.fields).forEach(([key, value]) => {
        formData.append(key, value as string)
      })
      formData.append("file", file)

      const uploadResponse = await fetch(presignedPost.url, {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file")
      }

      // Step 3: Finalize upload
      const finalizeResponse = await fetch("/api/media/finalize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scope,
          entityId: entityId || "temp",
          key,
          originalContentType: file.type,
          alt: file.name,
        }),
      })

      if (!finalizeResponse.ok) {
        const error = await finalizeResponse.json()
        throw new Error(error.error || "Failed to finalize upload")
      }

      const { image } = await finalizeResponse.json()

      return {
        ...uploadFile,
        status: "success" as const,
        progress: 100,
        result: image,
      }
    } catch (error) {
      return {
        ...uploadFile,
        status: "error" as const,
        progress: 0,
        error: error instanceof Error ? error.message : "Upload failed",
      }
    }
  }, [scope, entityId])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (files.length + acceptedFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} file(s) allowed`)
      return
    }

    const newFiles: UploadFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      status: "uploading" as const,
      progress: 0,
    }))

    setFiles(prev => [...prev, ...newFiles])

    // Upload files sequentially
    for (const file of acceptedFiles) {
      const result = await uploadFile(file)
      setFiles(prev => prev.map(f => f.file === file ? result : f))
    }

    // Check if all uploads completed
    const updatedFiles = files.concat(newFiles)
    const completedFiles = updatedFiles.filter(f => f.status === "success")
    const errorFiles = updatedFiles.filter(f => f.status === "error")

    if (completedFiles.length > 0) {
      onUploadComplete?.(completedFiles)
      toast.success(`Successfully uploaded ${completedFiles.length} file(s)`)
    }

    if (errorFiles.length > 0) {
      onUploadError?.(`Failed to upload ${errorFiles.length} file(s)`)
      toast.error(`Failed to upload ${errorFiles.length} file(s)`)
    }
  }, [files, maxFiles, uploadFile, onUploadComplete, onUploadError])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: maxSizeMB * 1024 * 1024,
    multiple: maxFiles > 1,
  })

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/25 hover:border-primary/50"
          }
        `}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        {isDragActive ? (
          <p className="text-lg font-medium">Drop files here...</p>
        ) : (
          <div>
            <p className="text-lg font-medium mb-2">
              Drag & drop files here, or click to select
            </p>
            <p className="text-sm text-muted-foreground">
              {acceptedTypes.join(", ")} • Max {maxSizeMB}MB per file
            </p>
          </div>
        )}
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  {file.status === "success" ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : file.status === "error" ? (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {file.status === "uploading" && (
                  <div className="w-20">
                    <Progress value={file.progress} className="h-2" />
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Custom children */}
      {children}
    </div>
  )
}
