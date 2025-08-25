"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Package, Clock, AlertCircle } from "lucide-react";

interface DigitalEntitlement {
  id: string;
  token: string;
  maxDownloads: number;
  downloadsCount: number;
  expiresAt: string | null;
  lastDownloadedAt: string | null;
  createdAt: string;
  edition: {
    id: string;
    artwork: {
      id: string;
      title: string;
      slug: string;
      heroImageUrl: string | null;
      artist: {
        displayName: string;
        slug: string;
      };
    };
  };
  order: {
    id: string;
    createdAt: string;
  };
}

interface DownloadsListProps {
  userId: string;
}

export function DownloadsList({ userId }: DownloadsListProps) {
  const [entitlements, setEntitlements] = useState<DigitalEntitlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    const fetchEntitlements = async () => {
      try {
        const response = await fetch("/api/downloads/entitlements");
        
        if (response.ok) {
          const data = await response.json();
          setEntitlements(data.entitlements || []);
        } else {
          setError("Failed to load downloads");
        }
      } catch (err) {
        console.error("Error fetching entitlements:", err);
        setError("Failed to load downloads");
      } finally {
        setLoading(false);
      }
    };

    fetchEntitlements();
  }, [userId]);

  const handleDownload = async (entitlementId: string, filename: string) => {
    if (downloading) return;
    
    setDownloading(entitlementId);
    
    try {
      // Create download link
      const response = await fetch("/api/downloads/link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ entitlementId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create download link");
      }

      const { downloadUrl } = await response.json();
      
      // Open download in new tab
      window.open(downloadUrl, '_blank');
      
      // Update download count in UI
      setEntitlements(prev => 
        prev.map(ent => 
          ent.id === entitlementId 
            ? { ...ent, downloadsCount: ent.downloadsCount + 1, lastDownloadedAt: new Date().toISOString() }
            : ent
        )
      );

    } catch (error) {
      console.error("Download error:", error);
      alert(error instanceof Error ? error.message : "Download failed");
    } finally {
      setDownloading(null);
    }
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const isDownloadLimitReached = (downloadsCount: number, maxDownloads: number) => {
    return downloadsCount >= maxDownloads;
  };

  const canDownload = (entitlement: DigitalEntitlement) => {
    return !isExpired(entitlement.expiresAt) && !isDownloadLimitReached(entitlement.downloadsCount, entitlement.maxDownloads);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <p className="text-center text-muted-foreground">Loading your downloads...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (entitlements.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Digital Downloads</h3>
            <p className="text-muted-foreground mb-4">
              You haven&apos;t purchased any digital files yet.
            </p>
            <Button asChild>
              <Link href="/discover?kind=DIGITAL">Browse Digital Art</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {entitlements.map((entitlement) => (
        <Card key={entitlement.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                {entitlement.edition.artwork.heroImageUrl && (
                  <img
                    src={entitlement.edition.artwork.heroImageUrl}
                    alt={entitlement.edition.artwork.title}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                )}
                <div>
                  <CardTitle className="text-lg">
                    {entitlement.edition.artwork.title}
                  </CardTitle>
                  <CardDescription>
                    by {entitlement.edition.artwork.artist.displayName}
                  </CardDescription>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary">Digital Edition</Badge>
                    {isExpired(entitlement.expiresAt) && (
                      <Badge variant="destructive">Expired</Badge>
                    )}
                    {isDownloadLimitReached(entitlement.downloadsCount, entitlement.maxDownloads) && (
                      <Badge variant="destructive">Download Limit Reached</Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <Button
                onClick={() => handleDownload(entitlement.id, entitlement.edition.artwork.title)}
                disabled={!canDownload(entitlement) || downloading === entitlement.id}
                variant={canDownload(entitlement) ? "default" : "outline"}
              >
                {downloading === entitlement.id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Preparing...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Downloads Used</p>
                <p className="font-medium">
                  {entitlement.downloadsCount} / {entitlement.maxDownloads}
                </p>
              </div>
              
              <div>
                <p className="text-muted-foreground">Order Date</p>
                <p className="font-medium">
                  {new Date(entitlement.order.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              {entitlement.expiresAt && (
                <div>
                  <p className="text-muted-foreground">Expires</p>
                  <p className="font-medium">
                    {new Date(entitlement.expiresAt).toLocaleDateString()}
                  </p>
                </div>
              )}
              
              {entitlement.lastDownloadedAt && (
                <div>
                  <p className="text-muted-foreground">Last Downloaded</p>
                  <p className="font-medium">
                    {new Date(entitlement.lastDownloadedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            <div className="text-xs text-muted-foreground">
              Order #{entitlement.order.id}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
