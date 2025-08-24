"use client"

import React from "react"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { PublishValidation } from "@artfromromania/shared"

interface PublishChecklistProps {
  validation: PublishValidation
  onPublish: () => void
  onUnpublish: () => void
  isPublished: boolean
  isLoading?: boolean
}

export function PublishChecklist({
  validation,
  onPublish,
  onUnpublish,
  isPublished,
  isLoading = false,
}: PublishChecklistProps) {
  const canPublish = validation.ok && !isPublished

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Publication Status
          {isPublished ? (
            <Badge variant="default" className="bg-green-100 text-green-800">
              Published
            </Badge>
          ) : (
            <Badge variant="secondary">
              Draft
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Review the checklist below before publishing your artwork
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {validation.errors.length === 0 ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">All requirements met</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Requirements not met:</span>
              </div>
              <ul className="ml-6 space-y-1">
                {validation.errors.map((error, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-red-600">
                    <span className="mt-1 h-1 w-1 rounded-full bg-red-600" />
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {isPublished ? (
            <Button
              onClick={onUnpublish}
              disabled={isLoading}
              variant="outline"
              className="flex-1"
            >
              {isLoading ? "Unpublishing..." : "Unpublish"}
            </Button>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex-1">
                    <Button
                      onClick={onPublish}
                      disabled={!canPublish || isLoading}
                      className="w-full"
                    >
                      {isLoading ? "Publishing..." : "Publish Artwork"}
                    </Button>
                  </div>
                </TooltipTrigger>
                {!canPublish && (
                  <TooltipContent>
                    <p className="max-w-xs">
                      {validation.errors.length > 0 
                        ? "Please fix all issues before publishing"
                        : "Artwork is already published"
                      }
                    </p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <div className="rounded-lg bg-muted p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">Publishing Guidelines:</p>
              <ul className="space-y-1 ml-2">
                <li>• KYC verification must be approved</li>
                <li>• Artist profile must be 80% complete</li>
                <li>• At least one high-quality image required</li>
                <li>• Valid pricing information needed</li>
                <li>• Editions required for EDITIONED/DIGITAL artworks</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
