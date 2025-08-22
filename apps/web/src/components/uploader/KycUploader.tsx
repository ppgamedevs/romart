"use client"

import React, { useState } from "react"
import { Shield, Upload, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UploaderBase } from "./UploaderBase"

interface KycDocument {
  type: "front" | "back" | "selfie"
  status: "pending" | "uploaded" | "error"
  url?: string
  error?: string
}

interface KycUploaderProps {
  artistId?: string
  onDocumentsUploaded?: (documents: KycDocument[]) => void
}

export function KycUploader({ artistId, onDocumentsUploaded }: KycUploaderProps) {
  const [documents, setDocuments] = useState<KycDocument[]>([
    { type: "front", status: "pending" },
    { type: "back", status: "pending" },
    { type: "selfie", status: "pending" },
  ])

  const handleUploadComplete = (files: any[], documentType: "front" | "back" | "selfie") => {
    if (files.length > 0 && files[0].result) {
      setDocuments(prev => 
        prev.map(doc => 
          doc.type === documentType 
            ? { ...doc, status: "uploaded" as const, url: files[0].result.url }
            : doc
        )
      )
      
      // Notify parent component
      const updatedDocs = documents.map(doc => 
        doc.type === documentType 
          ? { ...doc, status: "uploaded" as const, url: files[0].result.url }
          : doc
      )
      onDocumentsUploaded?.(updatedDocs)
    }
  }

  const handleUploadError = (error: string, documentType: "front" | "back" | "selfie") => {
    setDocuments(prev => 
      prev.map(doc => 
        doc.type === documentType 
          ? { ...doc, status: "error" as const, error }
          : doc
      )
    )
  }

  const getDocumentTitle = (type: string) => {
    switch (type) {
      case "front": return "Front of Document"
      case "back": return "Back of Document"
      case "selfie": return "Selfie with Document"
      default: return type
    }
  }

  const getDocumentDescription = (type: string) => {
    switch (type) {
      case "front": return "Upload the front side of your ID card, passport, or driver's license"
      case "back": return "Upload the back side of your document"
      case "selfie": return "Take a selfie while holding your document next to your face"
      default: return ""
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "uploaded":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Shield className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "uploaded":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Uploaded</Badge>
      case "error":
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="outline">Pending</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Shield className="h-5 w-5" />
        <h3 className="font-medium">KYC Document Verification</h3>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Please upload clear photos of your identity documents for verification. 
        These will be kept private and secure.
      </p>

      <div className="grid gap-6">
        {documents.map((doc) => (
          <div key={doc.type} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(doc.status)}
                <div>
                  <h4 className="font-medium">{getDocumentTitle(doc.type)}</h4>
                  <p className="text-sm text-muted-foreground">
                    {getDocumentDescription(doc.type)}
                  </p>
                </div>
              </div>
              {getStatusBadge(doc.status)}
            </div>

            {doc.status === "error" && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{doc.error}</p>
              </div>
            )}

            {doc.status !== "uploaded" && (
              <UploaderBase
                scope="KYC_DOC"
                entityId={artistId}
                maxFiles={1}
                maxSizeMB={10}
                acceptedTypes={["image/jpeg", "image/png"]}
                onUploadComplete={(files) => handleUploadComplete(files, doc.type)}
                onUploadError={(error) => handleUploadError(error, doc.type)}
              >
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    JPG or PNG • Max 10MB • Clear, well-lit photos only
                  </p>
                </div>
              </UploaderBase>
            )}

            {doc.status === "uploaded" && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700">
                    Document uploaded successfully
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Privacy & Security</p>
            <p>
              Your KYC documents are encrypted and stored securely. 
              They are only accessible to authorized verification personnel 
              and will never be displayed publicly.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
