"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Step4SocialsSchema } from "@artfromromania/shared"
import { saveStep4Socials } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import { toast } from "sonner"

type FormData = {
  website: string
  instagram: string
  facebook: string
  x: string
  tiktok: string
  youtube: string
}

export default function SocialsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(Step4SocialsSchema),
    defaultValues: {
      website: "",
      instagram: "",
      facebook: "",
      x: "",
      tiktok: "",
      youtube: "",
    },
  })

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value)
      })
      
      await saveStep4Socials(formData)
      toast.success("Social media information saved successfully!")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save social media information")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Media & Website</CardTitle>
        <CardDescription>
          Connect your social media accounts and website
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              {...register("website")}
              placeholder="https://yourwebsite.com"
              className={errors.website ? "border-red-500" : ""}
            />
            {errors.website && (
              <p className="text-sm text-red-500">{errors.website.message}</p>
            )}
          </div>

          {/* Instagram */}
          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram</Label>
            <Input
              id="instagram"
              {...register("instagram")}
              placeholder="@yourusername"
              className={errors.instagram ? "border-red-500" : ""}
            />
            {errors.instagram && (
              <p className="text-sm text-red-500">{errors.instagram.message}</p>
            )}
          </div>

          {/* Facebook */}
          <div className="space-y-2">
            <Label htmlFor="facebook">Facebook</Label>
            <Input
              id="facebook"
              {...register("facebook")}
              placeholder="yourpage"
              className={errors.facebook ? "border-red-500" : ""}
            />
            {errors.facebook && (
              <p className="text-sm text-red-500">{errors.facebook.message}</p>
            )}
          </div>

          {/* X (Twitter) */}
          <div className="space-y-2">
            <Label htmlFor="x">X (Twitter)</Label>
            <Input
              id="x"
              {...register("x")}
              placeholder="@yourusername"
              className={errors.x ? "border-red-500" : ""}
            />
            {errors.x && (
              <p className="text-sm text-red-500">{errors.x.message}</p>
            )}
          </div>

          {/* TikTok */}
          <div className="space-y-2">
            <Label htmlFor="tiktok">TikTok</Label>
            <Input
              id="tiktok"
              {...register("tiktok")}
              placeholder="@yourusername"
              className={errors.tiktok ? "border-red-500" : ""}
            />
            {errors.tiktok && (
              <p className="text-sm text-red-500">{errors.tiktok.message}</p>
            )}
          </div>

          {/* YouTube */}
          <div className="space-y-2">
            <Label htmlFor="youtube">YouTube</Label>
            <Input
              id="youtube"
              {...register("youtube")}
              placeholder="@yourchannel"
              className={errors.youtube ? "border-red-500" : ""}
            />
            {errors.youtube && (
              <p className="text-sm text-red-500">{errors.youtube.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Continue to KYC Verification"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
