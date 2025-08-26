'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Link, 
  Copy, 
  ExternalLink,
  Plus,
  Calendar,
  CreditCard,
  Eye,
  X,
  RefreshCw,
  Download,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  slug: string;
  kind: 'AFFILIATE' | 'CREATOR';
  status: 'ACTIVE' | 'PAUSED' | 'BANNED';
  defaultBps: number;
  connectId?: string;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
  links: Array<{
    id: string;
    code: string;
    landing: string;
  }>;
  codes: Array<{
    id: string;
    code: string;
    active: boolean;
  }>;
  conversions: Array<{
    id: string;
    status: string;
    commissionMinor: number;
    createdAt: string;
  }>;
  payouts: Array<{
    id: string;
    amountMinor: number;
    createdAt: string;
  }>;
}

interface Conversion {
  id: string;
  orderId: string;
  kind: 'AFFILIATE' | 'CREATOR';
  currency: string;
  subtotalMinor: number;
  commissionMinor: number;
  status: string;
  createdAt: string;
  partner?: {
    id: string;
    name: string;
    slug: string;
  };
  link?: {
    id: string;
    code: string;
  };
  code?: {
    id: string;
    code: string;
  };
}

interface Payout {
  id: string;
  amountMinor: number;
  currency: string;
  stripePayoutId?: string;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  partner: {
    id: string;
    name: string;
    slug: string;
  };
}

interface Stats {
  totalPartners: number;
  activePartners: number;
  totalConversions: number;
  totalCommission: number;
  pendingCommission: number;
  totalPayouts: number;
  totalPayoutAmount: number;
  recentVisits: number;
  period: {
    from: string;
    to: string;
  };
}

export function AffiliateAdminDashboard() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayouts, setProcessingPayouts] = useState(false);
  const [showCreatePartner, setShowCreatePartner] = useState(false);
  const [newPartner, setNewPartner] = useState<{
    name: string;
    kind: 'AFFILIATE' | 'CREATOR';
    slug: string;
    defaultBps: number;
  }>({
    name: '',
    kind: 'AFFILIATE',
    slug: '',
    defaultBps: 1000,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [partnersRes, conversionsRes, payoutsRes, statsRes] = await Promise.all([
        fetch('/api/aff/admin/partners', {
          headers: { 'x-admin-token': 'admin-secret' }
        }),
        fetch('/api/aff/admin/conversions', {
          headers: { 'x-admin-token': 'admin-secret' }
        }),
        fetch('/api/aff/admin/payouts', {
          headers: { 'x-admin-token': 'admin-secret' }
        }),
        fetch('/api/aff/admin/stats', {
          headers: { 'x-admin-token': 'admin-secret' }
        })
      ]);

      if (partnersRes.ok) {
        const data = await partnersRes.json();
        setPartners(data.partners);
      }

      if (conversionsRes.ok) {
        const data = await conversionsRes.json();
        setConversions(data.conversions);
      }

      if (payoutsRes.ok) {
        const data = await payoutsRes.json();
        setPayouts(data.payouts);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch affiliate data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePartner = async () => {
    try {
      const response = await fetch('/api/aff/admin/partners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': 'admin-secret'
        },
        body: JSON.stringify(newPartner)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Partner created successfully"
        });
        setShowCreatePartner(false);
        setNewPartner({ name: '', kind: 'AFFILIATE', slug: '', defaultBps: 1000 });
        fetchData();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to create partner",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create partner",
        variant: "destructive"
      });
    }
  };

  const handleCreateLink = async (partnerId: string, landing: string = '/') => {
    try {
      const response = await fetch(`/api/aff/admin/partners/${partnerId}/link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': 'admin-secret'
        },
        body: JSON.stringify({ landing })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Referral link created successfully"
        });
        fetchData();
      } else {
        toast({
          title: "Error",
          description: "Failed to create referral link",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create referral link",
        variant: "destructive"
      });
    }
  };

  const handleVoidConversion = async (conversionId: string, reason: string) => {
    try {
      const response = await fetch(`/api/aff/admin/conversions/${conversionId}/void`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': 'admin-secret'
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Conversion voided successfully"
        });
        fetchData();
      } else {
        toast({
          title: "Error",
          description: "Failed to void conversion",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to void conversion",
        variant: "destructive"
      });
    }
  };

  const handleRunPayouts = async () => {
    try {
      setProcessingPayouts(true);
      const response = await fetch('/api/aff/admin/payouts/run', {
        method: 'POST',
        headers: {
          'x-admin-token': 'admin-secret',
          'token': process.env.NEXT_PUBLIC_ADMIN_CRON_TOKEN || 'admin-secret'
        }
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Success",
          description: `Processed ${result.processed} payouts for €${(result.totalAmount / 100).toFixed(2)}`
        });
        fetchData();
      } else {
        toast({
          title: "Error",
          description: "Failed to process payouts",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process payouts",
        variant: "destructive"
      });
    } finally {
      setProcessingPayouts(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Link copied to clipboard"
    });
  };

  const formatCurrency = (amount: number) => {
    return `€${(amount / 100).toFixed(2)}`;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'ACTIVE': 'default',
      'PAUSED': 'secondary',
      'BANNED': 'destructive',
      'PENDING': 'secondary',
      'APPROVED': 'default',
      'PAID': 'default',
      'VOID': 'destructive'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading affiliate data...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Partners</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPartners}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activePartners} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Conversions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalConversions}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(stats.totalCommission)} earned
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Commission</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.pendingCommission)}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting payout
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPayouts}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(stats.totalPayoutAmount)} paid
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Dialog open={showCreatePartner} onOpenChange={setShowCreatePartner}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Partner
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Partner</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newPartner.name}
                  onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={newPartner.slug}
                  onChange={(e) => setNewPartner({ ...newPartner, slug: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="kind">Type</Label>
                <Select
                  value={newPartner.kind}
                  onValueChange={(value: 'AFFILIATE' | 'CREATOR') => 
                    setNewPartner({ ...newPartner, kind: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AFFILIATE">Affiliate</SelectItem>
                    <SelectItem value="CREATOR">Creator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="defaultBps">Default Commission (basis points)</Label>
                <Input
                  id="defaultBps"
                  type="number"
                  value={newPartner.defaultBps}
                  onChange={(e) => setNewPartner({ ...newPartner, defaultBps: parseInt(e.target.value) })}
                />
              </div>
              <Button onClick={handleCreatePartner} className="w-full">
                Create Partner
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button 
          onClick={handleRunPayouts} 
          disabled={processingPayouts}
          variant="outline"
        >
          {processingPayouts ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <CreditCard className="h-4 w-4 mr-2" />
          )}
          {processingPayouts ? 'Processing...' : 'Run Payouts'}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="partners" className="space-y-4">
        <TabsList>
          <TabsTrigger value="partners">Partners</TabsTrigger>
          <TabsTrigger value="conversions">Conversions</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="partners" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Partners</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {partners.map((partner) => (
                  <div key={partner.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{partner.name}</h3>
                        <p className="text-sm text-muted-foreground">@{partner.slug}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {getStatusBadge(partner.status)}
                          <Badge variant="outline">{partner.kind}</Badge>
                          <span className="text-sm">
                            {partner.defaultBps / 100}% commission
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleCreateLink(partner.id)}
                        >
                          <Link className="h-4 w-4 mr-1" />
                          Create Link
                        </Button>
                      </div>
                    </div>

                    {/* Links */}
                    {partner.links.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Referral Links</h4>
                        <div className="space-y-2">
                          {partner.links.map((link) => (
                            <div key={link.id} className="flex items-center gap-2 text-sm">
                              <code className="bg-muted px-2 py-1 rounded">
                                {link.code}
                              </code>
                              <span className="text-muted-foreground">→ {link.landing}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(`${window.location.origin}/r/${link.code}`)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Conversions:</span>
                        <div className="font-medium">{partner.conversions.length}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Commission:</span>
                        <div className="font-medium">
                          {formatCurrency(partner.conversions.reduce((sum, c) => sum + c.commissionMinor, 0))}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Payouts:</span>
                        <div className="font-medium">{partner.payouts.length}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conversions.map((conversion) => (
                  <div key={conversion.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">Order {conversion.orderId}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(conversion.createdAt).toLocaleDateString()}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {getStatusBadge(conversion.status)}
                          <Badge variant="outline">{conversion.kind}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(conversion.commissionMinor)}</div>
                        <div className="text-sm text-muted-foreground">
                          from {formatCurrency(conversion.subtotalMinor)}
                        </div>
                      </div>
                    </div>

                    {conversion.partner && (
                      <div className="mt-2 text-sm">
                        <span className="text-muted-foreground">Partner:</span> {conversion.partner.name}
                      </div>
                    )}

                    {conversion.status === 'APPROVED' && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleVoidConversion(conversion.id, 'Voided by admin')}
                        className="mt-2"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Void
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payouts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payouts.map((payout) => (
                  <div key={payout.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{payout.partner.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(payout.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(payout.periodStart).toLocaleDateString()} - {new Date(payout.periodEnd).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(payout.amountMinor)}</div>
                        <div className="text-sm text-muted-foreground">
                          {payout.currency}
                        </div>
                        {payout.stripePayoutId && (
                          <Badge variant="outline" className="mt-1">
                            Stripe: {payout.stripePayoutId.slice(-8)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
