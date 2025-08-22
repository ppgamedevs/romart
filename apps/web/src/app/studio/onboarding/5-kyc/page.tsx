"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { KycStepSchema, COUNTRIES, KYC_DOCUMENT_TYPES } from "@artfromromania/shared"
import { submitKyc } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { KycUploader } from "@/components/uploader/KycUploader"
import { useState } from "react"
import { toast } from "sonner"
import { Shield, AlertCircle } from "lucide-react"

type FormData = {
  country: string
  documentType: string
  docLast4: string
  frontImageUrl: string
  backImageUrl: string
  selfieImageUrl: string
}

export default function Step5KycPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [kycDocuments, setKycDocuments] = useState<{
    front?: string
    back?: string
    selfie?: string
  }>({})

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(KycStepSchema),
    defaultValues: {
      country: "",
      documentType: "",
      docLast4: "",
      frontImageUrl: "",
      backImageUrl: "",
      selfieImageUrl: "",
    },
  })

  const handleDocumentsUploaded = (documents: any[]) => {
    const newDocs = { ...kycDocuments }
    documents.forEach(doc => {
      if (doc.type === "front") newDocs.front = doc.url
      if (doc.type === "back") newDocs.back = doc.url
      if (doc.type === "selfie") newDocs.selfie = doc.url
    })
    setKycDocuments(newDocs)
    
    // Update form values
    if (newDocs.front) setValue("frontImageUrl", newDocs.front)
    if (newDocs.back) setValue("backImageUrl", newDocs.back)
    if (newDocs.selfie) setValue("selfieImageUrl", newDocs.selfie)
  }

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value)
      })
      
      await submitKyc(formData)
      toast.success("KYC information submitted successfully!")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit KYC information")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>KYC Verification</span>
        </CardTitle>
        <CardDescription>
          Verify your identity to start selling on RomArt
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Privacy & Security</p>
              <p>
                We only store the last 4 digits of your document for verification purposes. 
                All images are securely processed and stored. Your personal information is 
                protected according to GDPR regulations.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Country */}
          <div className="space-y-2">
            <Label htmlFor="country">Country of Residence *</Label>
            <Select onValueChange={(value) => setValue("country", value)}>
              <SelectTrigger className={errors.country ? "border-red-500" : ""}>
                <SelectValue placeholder="Select your country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.country && (
              <p className="text-sm text-red-500">{errors.country.message}</p>
            )}
          </div>

          {/* Document Type */}
          <div className="space-y-2">
            <Label htmlFor="documentType">Document Type *</Label>
            <Select onValueChange={(value) => setValue("documentType", value)}>
              <SelectTrigger className={errors.documentType ? "border-red-500" : ""}>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {KYC_DOCUMENT_TYPES.map((docType) => (
                  <SelectItem key={docType.value} value={docType.value}>
                    {docType.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.documentType && (
              <p className="text-sm text-red-500">{errors.documentType.message}</p>
            )}
          </div>

          {/* Document Last 4 Digits */}
          <div className="space-y-2">
            <Label htmlFor="docLast4">Document Last 4 Digits</Label>
            <Input
              id="docLast4"
              {...register("docLast4")}
              placeholder="1234"
              maxLength={4}
              className={errors.docLast4 ? "border-red-500" : ""}
            />
            {errors.docLast4 && (
              <p className="text-sm text-red-500">{errors.docLast4.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              For verification purposes only. We only store the last 4 digits.
            </p>
          </div>

          {/* KYC Document Uploader */}
          <KycUploader
            onDocumentsUploaded={handleDocumentsUploaded}
          />

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit KYC Verification"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
