"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Flag, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { REPORT_CATEGORIES } from "@artfromromania/shared"

interface ReportDialogProps {
  entityType: "ARTWORK" | "ARTIST"
  entityId: string
  entityTitle: string
  trigger?: React.ReactNode
}

export function ReportDialog({ 
  entityType, 
  entityId, 
  entityTitle,
  trigger 
}: ReportDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [category, setCategory] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!category) {
      toast.error("Please select a category")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entityType,
          entityId,
          category,
          message: message.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to submit report")
      }

      toast.success("Report submitted successfully")
      setIsOpen(false)
      setCategory("")
      setMessage("")
    } catch (error) {
      console.error("Failed to submit report:", error)
      toast.error(error instanceof Error ? error.message : "Failed to submit report")
    } finally {
      setIsSubmitting(false)
    }
  }

  const categoryOptions = [
    { value: REPORT_CATEGORIES.NUDITY, label: "Nudity or sexual content" },
    { value: REPORT_CATEGORIES.HATE, label: "Hate speech or discrimination" },
    { value: REPORT_CATEGORIES.VIOLENCE, label: "Violence or graphic content" },
    { value: REPORT_CATEGORIES.COPYRIGHT, label: "Copyright infringement" },
    { value: REPORT_CATEGORIES.SPAM, label: "Spam or misleading content" },
    { value: REPORT_CATEGORIES.OTHER, label: "Other" },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Flag className="w-4 h-4 mr-2" />
            Report
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Report {entityType.toLowerCase()}</DialogTitle>
          <DialogDescription>
            Help us keep the community safe by reporting inappropriate content.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>What are you reporting?</Label>
            <p className="text-sm text-muted-foreground">
              {entityTitle}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Additional details (optional)</Label>
            <Textarea
              id="message"
              placeholder="Please provide any additional context that will help us understand the issue..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Report"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
