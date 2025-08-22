"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Step1BasicSchema, COUNTRIES, safeSlug } from "@artfromromania/shared"
import { saveStep1Basic } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AvatarUploader } from "@/components/uploader/AvatarUploader"
import { CoverUploader } from "@/components/uploader/CoverUploader"
import { useState } from "react"
import { toast } from "sonner"

type FormData = {
  displayName: string
  slug: string
  locationCity: string
  locationCountry: string
  avatarUrl: string
  coverUrl: string
}

export default function Step1BasicPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState("")
  const [coverUrl, setCoverUrl] = useState("")

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(Step1BasicSchema),
    defaultValues: {
      displayName: "",
      slug: "",
      locationCity: "",
      locationCountry: "",
      avatarUrl: "",
      coverUrl: "",
    },
  })

  const displayName = watch("displayName")

  // Auto-generate slug from display name
  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setValue("displayName", value)
    if (value && !watch("slug")) {
      setValue("slug", safeSlug(value))
    }
  }

  const handleAvatarUploaded = (url: string) => {
    setValue("avatarUrl", url)
    setAvatarUrl(url)
  }

  const handleCoverUploaded = (url: string) => {
    setValue("coverUrl", url)
    setCoverUrl(url)
  }

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value)
      })
      
      await saveStep1Basic(formData)
      toast.success("Basic information saved successfully!")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save basic information")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
        <CardDescription>
          Tell us about yourself and set up your artist profile
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name *</Label>
            <Input
              id="displayName"
              {...register("displayName")}
              onChange={handleDisplayNameChange}
              placeholder="Your artist name"
              className={errors.displayName ? "border-red-500" : ""}
            />
            {errors.displayName && (
              <p className="text-sm text-red-500">{errors.displayName.message}</p>
            )}
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug">Profile URL *</Label>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">romart.com/artist/</span>
              <Input
                id="slug"
                {...register("slug")}
                placeholder="your-artist-name"
                className={errors.slug ? "border-red-500" : ""}
              />
            </div>
            {errors.slug && (
              <p className="text-sm text-red-500">{errors.slug.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              This will be your public profile URL. Choose carefully as it cannot be changed later.
            </p>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="locationCity">City</Label>
              <Input
                id="locationCity"
                {...register("locationCity")}
                placeholder="București"
                className={errors.locationCity ? "border-red-500" : ""}
              />
              {errors.locationCity && (
                <p className="text-sm text-red-500">{errors.locationCity.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationCountry">Country *</Label>
              <Select onValueChange={(value) => setValue("locationCountry", value)}>
                <SelectTrigger className={errors.locationCountry ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.locationCountry && (
                <p className="text-sm text-red-500">{errors.locationCountry.message}</p>
              )}
            </div>
          </div>

          {/* Avatar Uploader */}
          <AvatarUploader
            currentAvatarUrl={avatarUrl}
            onAvatarUploaded={handleAvatarUploaded}
          />

          {/* Cover Uploader */}
          <CoverUploader
            currentCoverUrl={coverUrl}
            onCoverUploaded={handleCoverUploaded}
          />

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Continue to Bio & Statement"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
