"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Step3ExperienceSchema, EducationSchema, ExhibitionSchema, AwardSchema } from "@artfromromania/shared"
import { saveStep3Experience } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, X } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

type Education = {
  school: string
  program?: string
  year?: number
}

type Exhibition = {
  title: string
  venue?: string
  year?: number
}

type Award = {
  title: string
  org?: string
  year?: number
}

type FormData = {
  education: Education[]
  exhibitions: Exhibition[]
  awards: Award[]
}

export default function Step3ExperiencePage() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(Step3ExperienceSchema),
    defaultValues: {
      education: [],
      exhibitions: [],
      awards: [],
    },
  })

  const education = watch("education") || []
  const exhibitions = watch("exhibitions") || []
  const awards = watch("awards") || []

  const addEducation = () => {
    setValue("education", [...education, { school: "", program: "", year: undefined }])
  }

  const removeEducation = (index: number) => {
    setValue("education", education.filter((_, i) => i !== index))
  }

  const updateEducation = (index: number, field: keyof Education, value: string | number) => {
    const updated = [...education]
    updated[index] = { ...updated[index], [field]: value }
    setValue("education", updated)
  }

  const addExhibition = () => {
    setValue("exhibitions", [...exhibitions, { title: "", venue: "", year: undefined }])
  }

  const removeExhibition = (index: number) => {
    setValue("exhibitions", exhibitions.filter((_, i) => i !== index))
  }

  const updateExhibition = (index: number, field: keyof Exhibition, value: string | number) => {
    const updated = [...exhibitions]
    updated[index] = { ...updated[index], [field]: value }
    setValue("exhibitions", updated)
  }

  const addAward = () => {
    setValue("awards", [...awards, { title: "", org: "", year: undefined }])
  }

  const removeAward = (index: number) => {
    setValue("awards", awards.filter((_, i) => i !== index))
  }

  const updateAward = (index: number, field: keyof Award, value: string | number) => {
    const updated = [...awards]
    updated[index] = { ...updated[index], [field]: value }
    setValue("awards", updated)
  }

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("education", JSON.stringify(data.education))
      formData.append("exhibitions", JSON.stringify(data.exhibitions))
      formData.append("awards", JSON.stringify(data.awards))
      
      await saveStep3Experience(formData)
      toast.success("Experience information saved successfully!")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save experience information")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Experience & Achievements</CardTitle>
        <CardDescription>
          Share your education, exhibitions, and awards
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Education */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Education</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addEducation}
                disabled={education.length >= 10}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Education
              </Button>
            </div>
            
            {education.map((edu, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <h4 className="font-medium">Education #{index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEducation(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>School/Institution *</Label>
                    <Input
                      value={edu.school}
                      onChange={(e) => updateEducation(index, "school", e.target.value)}
                      placeholder="University name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Program</Label>
                    <Input
                      value={edu.program || ""}
                      onChange={(e) => updateEducation(index, "program", e.target.value)}
                      placeholder="Degree/Program"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Input
                      type="number"
                      value={edu.year || ""}
                      onChange={(e) => updateEducation(index, "year", parseInt(e.target.value) || undefined)}
                      placeholder="2020"
                      min="1900"
                      max={new Date().getFullYear()}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Exhibitions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Exhibitions</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addExhibition}
                disabled={exhibitions.length >= 10}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Exhibition
              </Button>
            </div>
            
            {exhibitions.map((exhibition, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <h4 className="font-medium">Exhibition #{index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeExhibition(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input
                      value={exhibition.title}
                      onChange={(e) => updateExhibition(index, "title", e.target.value)}
                      placeholder="Exhibition title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Venue</Label>
                    <Input
                      value={exhibition.venue || ""}
                      onChange={(e) => updateExhibition(index, "venue", e.target.value)}
                      placeholder="Gallery/Museum"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Input
                      type="number"
                      value={exhibition.year || ""}
                      onChange={(e) => updateExhibition(index, "year", parseInt(e.target.value) || undefined)}
                      placeholder="2023"
                      min="1900"
                      max={new Date().getFullYear()}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Awards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Awards</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAward}
                disabled={awards.length >= 10}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Award
              </Button>
            </div>
            
            {awards.map((award, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <h4 className="font-medium">Award #{index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAward(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input
                      value={award.title}
                      onChange={(e) => updateAward(index, "title", e.target.value)}
                      placeholder="Award title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Organization</Label>
                    <Input
                      value={award.org || ""}
                      onChange={(e) => updateAward(index, "org", e.target.value)}
                      placeholder="Awarding organization"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Input
                      type="number"
                      value={award.year || ""}
                      onChange={(e) => updateAward(index, "year", parseInt(e.target.value) || undefined)}
                      placeholder="2023"
                      min="1900"
                      max={new Date().getFullYear()}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Continue to Social Media"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
