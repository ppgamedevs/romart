"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExternalLink, RefreshCw, AlertCircle, CheckCircle, Clock, Euro } from "lucide-react";
import { format } from "date-fns";

interface StripeAccount {
  stripeAccountId: string | null;
  payoutsEnabled: boolean;
  connectStatus: string | null;
  connectRequirements: any;
}

interface PayoutSummary {
  pending: number;
  paid: number;
}

interface RecentPayout {
  id: string;
  amount: number;
  currency: string;
  status: string;
  providerTransferId: string | null;
  createdAt: string;
  orderItem: {
    id: string;
    order: {
      id: string;
    };
  };
}

interface PayoutsData {
  summary: PayoutSummary;
  recentPayouts: RecentPayout[];
  platformFee: number;
  account: StripeAccount;
}

export function PayoutsDashboard() {
  const [data, setData] = useState<PayoutsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPayoutsData();
  }, []);

  const fetchPayoutsData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/studio/payouts/summary");
      
      if (!response.ok) {
        throw new Error("Failed to fetch payouts data");
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error("Error fetching payouts data:", err);
      setError(err instanceof Error ? err.message : "Failed to load payouts data");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshStatus = async () => {
    try {
      setRefreshing(true);
      const response = await fetch("/api/studio/connect/refresh-status", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to refresh status");
      }

      const result = await response.json();
      setData(prev => prev ? { ...prev, account: result.account } : null);
    } catch (err) {
      console.error("Error refreshing status:", err);
      setError(err instanceof Error ? err.message : "Failed to refresh status");
    } finally {
      setRefreshing(false);
    }
  };

  const handleSetupPayouts = async () => {
    try {
      const response = await fetch("/api/studio/connect/onboarding", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to create onboarding link");
      }

      const result = await response.json();
      window.open(result.onboardingUrl, "_blank");
    } catch (err) {
      console.error("Error setting up payouts:", err);
      setError(err instanceof Error ? err.message : "Failed to setup payouts");
    }
  };

  const handleOpenStripeDashboard = async () => {
    try {
      const response = await fetch("/api/studio/connect/login-link");

      if (!response.ok) {
        throw new Error("Failed to get login link");
      }

      const result = await response.json();
      window.open(result.loginUrl, "_blank");
    } catch (err) {
      console.error("Error opening Stripe dashboard:", err);
      setError(err instanceof Error ? err.message : "Failed to open Stripe dashboard");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading payouts data...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center text-red-600">
              <AlertCircle className="h-8 w-8 mr-2" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <p className="text-muted-foreground">No payouts data available</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { summary, recentPayouts, platformFee, account } = data;
  const hasStripeAccount = !!account.stripeAccountId;
  const isPayoutsEnabled = account.payoutsEnabled;
  const hasRequirements = account.connectRequirements?.currently_due?.length > 0;

  return (
    <div className="space-y-6">
      {/* Status Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Payout Status</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshStatus}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasStripeAccount ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">
                Set up your Stripe Connect account to start receiving payouts
              </p>
              <Button onClick={handleSetupPayouts}>
                Set up Payouts (Stripe)
              </Button>
            </div>
          ) : !isPayoutsEnabled ? (
            <div className="text-center py-6">
              <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-muted-foreground mb-4">
                Your Stripe account is set up but payouts are not yet enabled
              </p>
              <Button onClick={handleSetupPayouts}>
                Complete Onboarding
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium">Payouts Active</span>
                <Badge variant="secondary">Active</Badge>
              </div>
              <Button variant="outline" onClick={handleOpenStripeDashboard}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Stripe Dashboard
              </Button>
            </div>
          )}

          {hasRequirements && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Requirements Remaining
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Please complete the remaining requirements in your Stripe dashboard to enable payouts.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Earnings Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Estimated Earnings
            </CardTitle>
            <CardDescription>Pending payouts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              €{(summary.pending / 100).toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Platform fee: {platformFee}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Euro className="h-5 w-5 mr-2" />
              Lifetime Earnings
            </CardTitle>
            <CardDescription>Total paid out</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              €{(summary.paid / 100).toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              All time earnings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transfers */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transfers</CardTitle>
          <CardDescription>
            Your latest payout transfers from Stripe
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentPayouts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No transfers yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Transfer ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPayouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell>
                      {format(new Date(payout.createdAt), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      €{(payout.amount / 100).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      #{payout.orderItem.order.id.substring(0, 8)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={payout.status === "PAID" ? "default" : "secondary"}>
                        {payout.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {payout.providerTransferId ? (
                        <a
                          href={`https://dashboard.stripe.com/connect/transfers/${payout.providerTransferId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          {payout.providerTransferId.substring(0, 8)}...
                          <ExternalLink className="h-3 w-3 inline ml-1" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
