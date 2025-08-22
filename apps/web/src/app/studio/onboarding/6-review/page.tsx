"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, AlertCircle, ExternalLink } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

type ArtistProfile = {
  displayName: string
  slug: string
  bio?: string | null
  statement?: string | null
  locationCity?: string | null
  locationCountry?: string | null
  avatarUrl?: string | null
  coverUrl?: string | null
  website?: string | null
  instagram?: string | null
  facebook?: string | null
  x?: string | null
  tiktok?: string | null
  youtube?: string | null
  education?: any
  exhibitions?: any
  awards?: any
  completionScore: number
  kycStatus: string
}

export default function Step6ReviewPage() {
  const [profile, setProfile] = useState<ArtistProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/me")
      if (response.ok) {
        const userData = await response.json()
        const artistResponse = await fetch(`/api/artist/${userData.id}/profile`)
        if (artistResponse.ok) {
          const artistData = await artistResponse.json()
          setProfile(artistData)
        }
      }
    } catch (error) {
      toast.error("Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Profile Not Found</h3>
            <p className="text-muted-foreground mb-4">
              Unable to load your artist profile. Please try again.
            </p>
            <Button onClick={fetchProfile}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getKycStatusIcon = () => {
    switch (profile.kycStatus) {
      case "APPROVED":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "PENDING":
        return <Clock className="h-5 w-5 text-yellow-500" />
      case "REJECTED":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getKycStatusText = () => {
    switch (profile.kycStatus) {
      case "APPROVED":
        return "Approved"
      case "PENDING":
        return "Under Review"
      case "REJECTED":
        return "Rejected"
      default:
        return "Not Submitted"
    }
  }

  const getKycStatusColor = () => {
    switch (profile.kycStatus) {
      case "APPROVED":
        return "bg-green-100 text-green-800"
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "REJECTED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const education = Array.isArray(profile.education) ? profile.education : []
  const exhibitions = Array.isArray(profile.exhibitions) ? profile.exhibitions : []
  const awards = Array.isArray(profile.awards) ? profile.awards : []

  return (
    <div className="space-y-6">
      {/* Profile Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Review</CardTitle>
          <CardDescription>
            Review your completed artist profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile.avatarUrl || ""} alt={profile.displayName} />
              <AvatarFallback>{profile.displayName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{profile.displayName}</h2>
              <p className="text-muted-foreground">
                @{profile.slug} • {profile.locationCity && `${profile.locationCity}, `}{profile.locationCountry}
              </p>
              <div className="flex items-center space-x-4 mt-2">
                <Badge variant="secondary">
                  {profile.completionScore}% Complete
                </Badge>
                <div className="flex items-center space-x-2">
                  {getKycStatusIcon()}
                  <Badge className={getKycStatusColor()}>
                    KYC {getKycStatusText()}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bio & Statement */}
      {(profile.bio || profile.statement) && (
        <Card>
          <CardHeader>
            <CardTitle>Bio & Statement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.bio && (
              <div>
                <h4 className="font-semibold mb-2">Bio</h4>
                <p className="text-muted-foreground">{profile.bio}</p>
              </div>
            )}
            {profile.statement && (
              <div>
                <h4 className="font-semibold mb-2">Artist Statement</h4>
                <p className="text-muted-foreground">{profile.statement}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Experience */}
      {(education.length > 0 || exhibitions.length > 0 || awards.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Experience & Achievements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {education.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Education</h4>
                <div className="space-y-2">
                  {education.map((edu: any, index: number) => (
                    <div key={index} className="p-3 bg-muted rounded-lg">
                      <div className="font-medium">{edu.school}</div>
                      {edu.program && <div className="text-sm text-muted-foreground">{edu.program}</div>}
                      {edu.year && <div className="text-sm text-muted-foreground">{edu.year}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {exhibitions.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Exhibitions</h4>
                <div className="space-y-2">
                  {exhibitions.map((exhibition: any, index: number) => (
                    <div key={index} className="p-3 bg-muted rounded-lg">
                      <div className="font-medium">{exhibition.title}</div>
                      {exhibition.venue && <div className="text-sm text-muted-foreground">{exhibition.venue}</div>}
                      {exhibition.year && <div className="text-sm text-muted-foreground">{exhibition.year}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {awards.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Awards</h4>
                <div className="space-y-2">
                  {awards.map((award: any, index: number) => (
                    <div key={index} className="p-3 bg-muted rounded-lg">
                      <div className="font-medium">{award.title}</div>
                      {award.org && <div className="text-sm text-muted-foreground">{award.org}</div>}
                      {award.year && <div className="text-sm text-muted-foreground">{award.year}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Social Media */}
      {(profile.website || profile.instagram || profile.facebook || profile.x || profile.tiktok || profile.youtube) && (
        <Card>
          <CardHeader>
            <CardTitle>Social Media & Website</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {profile.website && (
                <div className="flex items-center space-x-2">
                  <ExternalLink className="h-4 w-4" />
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Website
                  </a>
                </div>
              )}
              {profile.instagram && (
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Instagram:</span>
                  <span>@{profile.instagram}</span>
                </div>
              )}
              {profile.facebook && (
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Facebook:</span>
                  <span>@{profile.facebook}</span>
                </div>
              )}
              {profile.x && (
                <div className="flex items-center space-x-2">
                  <span className="font-medium">X:</span>
                  <span>@{profile.x}</span>
                </div>
              )}
              {profile.tiktok && (
                <div className="flex items-center space-x-2">
                  <span className="font-medium">TikTok:</span>
                  <span>@{profile.tiktok}</span>
                </div>
              )}
              {profile.youtube && (
                <div className="flex items-center space-x-2">
                  <span className="font-medium">YouTube:</span>
                  <span>@{profile.youtube}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            {profile.completionScore >= 80 && profile.kycStatus === "APPROVED" ? (
              <>
                <div className="flex items-center justify-center space-x-2 text-green-600">
                  <CheckCircle className="h-6 w-6" />
                  <span className="font-semibold">Profile Complete!</span>
                </div>
                <p className="text-muted-foreground">
                  Your profile is ready and you can start selling on RomArt.
                </p>
                <div className="flex justify-center space-x-4">
                  <Button asChild>
                    <Link href="/studio">
                      Go to Studio
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={`/artist/${profile.slug}`}>
                      View Public Profile
                    </Link>
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center space-x-2 text-yellow-600">
                  <Clock className="h-6 w-6" />
                  <span className="font-semibold">Profile Pending</span>
                </div>
                <p className="text-muted-foreground">
                  {profile.kycStatus === "PENDING" 
                    ? "Your KYC verification is under review. You'll be notified once it's approved."
                    : "Please complete your profile and KYC verification to start selling."
                  }
                </p>
                <Button variant="outline" asChild>
                  <Link href="/dashboard">
                    Back to Dashboard
                  </Link>
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

