"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Download, Package, CheckCircle, Truck, User } from "lucide-react";

type FulfillmentItem = {
  id: string;
  orderItemId: string;
  editionId: string;
  quantity: number;
  material: string;
  sizeName: string;
  widthCm: number;
  heightCm: number;
  sourceImageKey: string;
  orderItem: {
    artwork: {
      title: string;
      artist: {
        displayName: string;
      };
    };
    edition: {
      type: string;
    };
  };
};

type FulfillmentOrder = {
  id: string;
  orderId: string;
  status: string;
  shippingMethod: string;
  assignedToUserId: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  qcPassedAt: string | null;
  trackingNumbers: any;
  createdAt: string;
  order: {
    buyer: {
      name: string;
      email: string;
    };
    shippingAddress: {
      country: string;
    };
  };
  items: FulfillmentItem[];
};

export function FulfillmentQueue() {
  const [fulfillments, setFulfillments] = useState<FulfillmentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [shipDialogOpen, setShipDialogOpen] = useState(false);
  const [selectedFulfillment, setSelectedFulfillment] = useState<FulfillmentOrder | null>(null);
  const [trackingData, setTrackingData] = useState({
    carrier: "",
    trackingCode: "",
    trackingUrl: "",
  });

  useEffect(() => {
    fetchFulfillments();
  }, [statusFilter]);

  const fetchFulfillments = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) {
        params.append("status", statusFilter);
      }

      const response = await fetch(`/api/studio/fulfillment/queue?${params}`);
      if (!response.ok) throw new Error("Failed to fetch fulfillments");

      const data = await response.json();
      setFulfillments(data.queue);
    } catch (error) {
      console.error("Error fetching fulfillments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (fulfillmentId: string) => {
    try {
      const response = await fetch(`/api/studio/fulfillment/${fulfillmentId}/claim`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to claim job");

      await fetchFulfillments();
    } catch (error) {
      console.error("Error claiming job:", error);
    }
  };

  const handleQcPass = async (fulfillmentId: string) => {
    try {
      const response = await fetch(`/api/studio/fulfillment/${fulfillmentId}/qc-pass`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to mark QC passed");

      await fetchFulfillments();
    } catch (error) {
      console.error("Error marking QC passed:", error);
    }
  };

  const handleShip = async () => {
    if (!selectedFulfillment) return;

    try {
      const response = await fetch(`/api/studio/fulfillment/${selectedFulfillment.id}/ship`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(trackingData),
      });
      if (!response.ok) throw new Error("Failed to ship");

      setShipDialogOpen(false);
      setSelectedFulfillment(null);
      setTrackingData({ carrier: "", trackingCode: "", trackingUrl: "" });
      await fetchFulfillments();
    } catch (error) {
      console.error("Error shipping:", error);
    }
  };

  const handleDeliver = async (fulfillmentId: string) => {
    try {
      const response = await fetch(`/api/studio/fulfillment/${fulfillmentId}/deliver`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to mark as delivered");

      await fetchFulfillments();
    } catch (error) {
      console.error("Error marking as delivered:", error);
    }
  };

  const downloadJobTicket = async (fulfillmentId: string) => {
    try {
      const response = await fetch(`/api/studio/fulfillment/${fulfillmentId}/job-ticket`);
      if (!response.ok) throw new Error("Failed to get job ticket");

      const data = await response.json();
      window.open(data.url, "_blank");
    } catch (error) {
      console.error("Error downloading job ticket:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { color: "bg-gray-100 text-gray-800", label: "Draft" },
      SUBMITTED: { color: "bg-blue-100 text-blue-800", label: "Submitted" },
      IN_PRODUCTION: { color: "bg-yellow-100 text-yellow-800", label: "In Production" },
      SHIPPED: { color: "bg-purple-100 text-purple-800", label: "Shipped" },
      DELIVERED: { color: "bg-green-100 text-green-800", label: "Delivered" },
      CANCELLED: { color: "bg-red-100 text-red-800", label: "Cancelled" },
      FAILED: { color: "bg-red-100 text-red-800", label: "Failed" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const canClaim = (fulfillment: FulfillmentOrder) => {
    return fulfillment.status === "SUBMITTED" && !fulfillment.assignedToUserId;
  };

  const canQcPass = (fulfillment: FulfillmentOrder) => {
    return fulfillment.status === "IN_PRODUCTION" && !fulfillment.qcPassedAt;
  };

  const canShip = (fulfillment: FulfillmentOrder) => {
    return fulfillment.status === "IN_PRODUCTION" && fulfillment.qcPassedAt;
  };

  const canDeliver = (fulfillment: FulfillmentOrder) => {
    return fulfillment.status === "SHIPPED";
  };

  if (loading) {
    return <div className="text-center py-8">Loading fulfillments...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-4 items-center">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="SUBMITTED">Submitted</SelectItem>
            <SelectItem value="IN_PRODUCTION">In Production</SelectItem>
            <SelectItem value="SHIPPED">Shipped</SelectItem>
            <SelectItem value="DELIVERED">Delivered</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Fulfillment List */}
      <div className="grid gap-4">
        {fulfillments.map((fulfillment) => (
          <Card key={fulfillment.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    Order #{fulfillment.orderId.slice(-8)}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {fulfillment.order.buyer.name} • {fulfillment.order.shippingAddress.country}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(fulfillment.status)}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadJobTicket(fulfillment.id)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Items */}
                <div>
                  <h4 className="font-medium mb-2">Items:</h4>
                  <div className="space-y-2">
                    {fulfillment.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-sm">
                        <span>
                          {item.quantity}x {item.orderItem.artwork.title} by{" "}
                          {item.orderItem.artwork.artist.displayName}
                        </span>
                        <span className="text-muted-foreground">
                          {item.material} • {item.widthCm}×{item.heightCm}cm
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                  {canClaim(fulfillment) && (
                    <Button
                      size="sm"
                      onClick={() => handleClaim(fulfillment.id)}
                    >
                      <User className="h-4 w-4 mr-1" />
                      Claim
                    </Button>
                  )}

                  {canQcPass(fulfillment) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQcPass(fulfillment.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      QC Pass
                    </Button>
                  )}

                  {canShip(fulfillment) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedFulfillment(fulfillment);
                        setShipDialogOpen(true);
                      }}
                    >
                      <Truck className="h-4 w-4 mr-1" />
                      Ship
                    </Button>
                  )}

                  {canDeliver(fulfillment) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeliver(fulfillment.id)}
                    >
                      <Package className="h-4 w-4 mr-1" />
                      Mark Delivered
                    </Button>
                  )}
                </div>

                {/* Tracking Info */}
                {fulfillment.trackingNumbers && (
                  <div className="text-sm text-muted-foreground">
                    <strong>Tracking:</strong> {fulfillment.trackingNumbers.carrier} -{" "}
                    {fulfillment.trackingNumbers.trackingCode}
                    {fulfillment.trackingNumbers.trackingUrl && (
                      <a
                        href={fulfillment.trackingNumbers.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-600 hover:underline"
                      >
                        Track
                      </a>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Ship Dialog */}
      <Dialog open={shipDialogOpen} onOpenChange={setShipDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ship Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="carrier">Carrier</Label>
              <Input
                id="carrier"
                value={trackingData.carrier}
                onChange={(e) =>
                  setTrackingData({ ...trackingData, carrier: e.target.value })
                }
                placeholder="e.g., DHL, FedEx, UPS"
              />
            </div>
            <div>
              <Label htmlFor="trackingCode">Tracking Code</Label>
              <Input
                id="trackingCode"
                value={trackingData.trackingCode}
                onChange={(e) =>
                  setTrackingData({ ...trackingData, trackingCode: e.target.value })
                }
                placeholder="Tracking number"
              />
            </div>
            <div>
              <Label htmlFor="trackingUrl">Tracking URL (Optional)</Label>
              <Input
                id="trackingUrl"
                value={trackingData.trackingUrl}
                onChange={(e) =>
                  setTrackingData({ ...trackingData, trackingUrl: e.target.value })
                }
                placeholder="https://..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShipDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleShip}>Ship Order</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
