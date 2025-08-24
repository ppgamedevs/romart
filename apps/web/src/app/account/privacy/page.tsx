"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, Trash2, Shield, FileText, Cookie } from "lucide-react"

interface ConsentPreferences {
  ANALYTICS: boolean
  MARKETING: boolean
  NECESSARY: boolean
}

interface DataExportTask {
  id: string
  status: string
  requestedAt: string
  completedAt?: string
  expiresAt?: string
  storageKey?: string
}

interface DeletionRequest {
  id: string
  status: string
  requestedAt: string
  confirmedAt?: string
  scheduledAt?: string
  reason?: string
}

interface LegalAcceptance {
  id: string
  kind: string
  version: string
  acceptedAt: string
}

export default function PrivacyPage() {
  const [consents, setConsents] = useState<ConsentPreferences>({
    ANALYTICS: false,
    MARKETING: false,
    NECESSARY: true
  })
  const [exportTasks, setExportTasks] = useState<DataExportTask[]>([])
  const [deletionRequest, setDeletionRequest] = useState<DeletionRequest | null>(null)
  const [legalAcceptances, setLegalAcceptances] = useState<LegalAcceptance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPrivacyData()
  }, [])

  const fetchPrivacyData = async () => {
    try {
      // Fetch consents
      const consentsResponse = await fetch('/api/consent/me')
      if (consentsResponse.ok) {
        const consentsData = await consentsResponse.json()
        setConsents(consentsData.consents)
      }

      // Fetch legal acceptances
      const legalResponse = await fetch('/api/legal/acceptances')
      if (legalResponse.ok) {
        const legalData = await legalResponse.json()
        setLegalAcceptances(legalData.acceptances)
      }

      // Fetch export tasks (this would need a new endpoint)
      // For now, we'll simulate this

      // Fetch deletion request (this would need a new endpoint)
      // For now, we'll simulate this
    } catch (error) {
      console.error('Failed to fetch privacy data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConsentChange = async (kind: string, granted: boolean) => {
    try {
      const response = await fetch('/api/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          kind,
          granted
        })
      })

      if (response.ok) {
        setConsents(prev => ({
          ...prev,
          [kind]: granted
        }))
      }
    } catch (error) {
      console.error('Failed to update consent:', error)
    }
  }

  const requestDataExport = async () => {
    try {
      const response = await fetch('/api/privacy/export', {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        alert('Export request submitted. You will receive an email when ready.')
        // Refresh export tasks
        fetchPrivacyData()
      }
    } catch (error) {
      console.error('Failed to request export:', error)
    }
  }

  const requestAccountDeletion = async () => {
    if (!confirm('Are you sure you want to request account deletion? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch('/api/privacy/delete/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: 'User requested deletion'
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert('Deletion request submitted. Check your email for confirmation.')
        // Refresh deletion request
        fetchPrivacyData()
      }
    } catch (error) {
      console.error('Failed to request deletion:', error)
    }
  }

  const cancelDeletionRequest = async () => {
    try {
      const response = await fetch('/api/privacy/delete/cancel', {
        method: 'POST'
      })

      if (response.ok) {
        alert('Deletion request cancelled.')
        setDeletionRequest(null)
      }
    } catch (error) {
      console.error('Failed to cancel deletion:', error)
    }
  }

  const downloadExport = async (taskId: string) => {
    try {
      const response = await fetch(`/api/privacy/export/${taskId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.task.status === 'DONE' && data.task.storageKey) {
          // In a real implementation, you would get a signed download URL
          alert('Download link generated. Check your email.')
        }
      }
    } catch (error) {
      console.error('Failed to download export:', error)
    }
  }

  if (loading) {
    return <div className="container mx-auto p-6">Loading...</div>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Privacy Center</h1>
        <p className="text-muted-foreground">
          Manage your data, privacy settings, and account preferences
        </p>
      </div>

      {/* Deletion Request Banner */}
      {deletionRequest && deletionRequest.status === 'CONFIRMED' && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertDescription>
            Your account deletion is scheduled for {new Date(deletionRequest.scheduledAt!).toLocaleDateString()}. 
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-4"
              onClick={cancelDeletionRequest}
            >
              Cancel Deletion
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Data Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Download Your Data
            </CardTitle>
            <CardDescription>
              Request a copy of all your personal data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={requestDataExport} className="w-full">
              Request Data Export
            </Button>
            
            {exportTasks.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Recent Exports</h4>
                {exportTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <div className="text-sm font-medium">
                        {new Date(task.requestedAt).toLocaleDateString()}
                      </div>
                      <Badge variant={task.status === 'DONE' ? 'default' : 'secondary'}>
                        {task.status}
                      </Badge>
                    </div>
                    {task.status === 'DONE' && (
                      <Button size="sm" onClick={() => downloadExport(task.id)}>
                        Download
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Deletion */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete Account
            </CardTitle>
            <CardDescription>
              Permanently delete your account and all associated data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>• Your account will be scheduled for deletion after a 7-day grace period</p>
              <p>• Fiscal documents (invoices, receipts) will be preserved for legal compliance</p>
              <p>• All other personal data will be permanently removed</p>
            </div>
            
            {!deletionRequest ? (
              <Button 
                variant="destructive" 
                onClick={requestAccountDeletion}
                className="w-full"
              >
                Request Account Deletion
              </Button>
            ) : (
              <div className="text-center">
                <Badge variant="secondary" className="mb-2">
                  {deletionRequest.status}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Request submitted on {new Date(deletionRequest.requestedAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Consent Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cookie className="h-5 w-5" />
              Consent Preferences
            </CardTitle>
            <CardDescription>
              Manage your privacy and marketing preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Necessary Cookies</div>
                  <div className="text-sm text-muted-foreground">
                    Required for basic site functionality
                  </div>
                </div>
                <Switch 
                  checked={consents.NECESSARY} 
                  disabled 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Analytics</div>
                  <div className="text-sm text-muted-foreground">
                    Help us improve our services
                  </div>
                </div>
                <Switch 
                  checked={consents.ANALYTICS} 
                  onCheckedChange={(checked) => handleConsentChange('ANALYTICS', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Marketing</div>
                  <div className="text-sm text-muted-foreground">
                    Personalized content and offers
                  </div>
                </div>
                <Switch 
                  checked={consents.MARKETING} 
                  onCheckedChange={(checked) => handleConsentChange('MARKETING', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legal Acceptances */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Legal Documents
            </CardTitle>
            <CardDescription>
              Your accepted terms and policies
            </CardDescription>
          </CardHeader>
          <CardContent>
            {legalAcceptances.length > 0 ? (
              <div className="space-y-2">
                {legalAcceptances.map((acceptance) => (
                  <div key={acceptance.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium capitalize">{acceptance.kind}</div>
                      <div className="text-sm text-muted-foreground">
                        Version {acceptance.version}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(acceptance.acceptedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No legal documents accepted yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
