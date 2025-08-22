"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Step2BioSchema } from "@artfromromania/shared"
import { saveStep2Bio } from "../actions"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { toast } from "sonner"

type FormData = {
  bio: string
  statement: string
}

export default function Step2BioPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(Step2BioSchema),
    defaultValues: {
      bio: "",
      statement: "",
    },
  })

  const bio = watch("bio") || ""
  const statement = watch("statement") || ""

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value)
      })
      
      await saveStep2Bio(formData)
      toast.success("Bio information saved successfully!")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save bio information")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bio & Artist Statement</CardTitle>
        <CardDescription>
          Tell your story and share your artistic vision
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              {...register("bio")}
              placeholder="Tell us about yourself, your background, and what inspires your art..."
              className={`min-h-[120px] ${errors.bio ? "border-red-500" : ""}`}
            />
            <div className="flex justify-between text-sm">
              {errors.bio && (
                <p className="text-red-500">{errors.bio.message}</p>
              )}
              <span className="text-muted-foreground">
                {bio.length}/800 characters
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              A brief introduction about yourself and your artistic journey
            </p>
          </div>

          {/* Artist Statement */}
          <div className="space-y-2">
            <Label htmlFor="statement">Artist Statement</Label>
            <Textarea
              id="statement"
              {...register("statement")}
              placeholder="Describe your artistic philosophy, techniques, and what you hope to communicate through your work..."
              className={`min-h-[160px] ${errors.statement ? "border-red-500" : ""}`}
            />
            <div className="flex justify-between text-sm">
              {errors.statement && (
                <p className="text-red-500">{errors.statement.message}</p>
              )}
              <span className="text-muted-foreground">
                {statement.length}/1200 characters
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Your artistic vision, philosophy, and what drives your creative process
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Continue to Experience"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
