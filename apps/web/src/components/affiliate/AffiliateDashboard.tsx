'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  CreditCard
} from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  slug: string;
  kind: 'AFFILIATE' | 'CREATOR';
  status: 'ACTIVE' | 'PAUSED' | 'BANNED';
  defaultBps: number;
  connectId?: string;
  links: Array<{
    id: string;
    code: string;
    landing?: string;
    _count: {
      visits: number;
      conversions: number;
    };
  }>;
  codes: Array<{
    id: string;
    code: string;
    _count: {
      conversions: number;
    };
  }>;
  _count: {
    payouts: number;
  };
}

interface Stats {
  totalConversions: number;
  totalCommission: number;
  recentConversions: Array<{
    id: string;
    orderId: string;
    kind: 'AFFILIATE' | 'CREATOR';
    currency: string;
    subtotalMinor: number;
    commissionMinor: number;
    status: 'PENDING' | 'APPROVED' | 'PAYABLE' | 'PAID' | 'VOID';
    createdAt: string;
  }>;
}

export function AffiliateDashboard() {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newLinkData, setNewLinkData] = useState({
    landing: '',
  });

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await fetch('/api/aff/me/dashboard');
      if (!response.ok) throw new Error('Failed to fetch dashboard');
      
      const data = await response.json();
      setPartner(data.partner);
      setStats(data.stats);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load affiliate dashboard',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLink = async () => {
    try {
      const response = await fetch(`/api/aff/admin/partners/${partner?.id}/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLinkData),
      });

      if (!response.ok) throw new Error('Failed to create link');

      const { link } = await response.json();
      
      // Refresh dashboard to get updated links
      await fetchDashboard();
      
      setIsDialogOpen(false);
      setNewLinkData({ landing: '' });
      
      toast({
        title: 'Success',
        description: 'Referral link created successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create referral link',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'Link copied to clipboard',
    });
  };

  const getReferralUrl = (code: string) => {
    return `${window.location.origin}/r/${code}`;
  };

  const formatCurrency = (minor: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(minor / 100);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Partner not found</h3>
          <p className="text-gray-500">
            You need to be registered as an affiliate partner to access this dashboard.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{partner.name}</h1>
          <p className="text-gray-500">Affiliate Dashboard</p>
        </div>
        <Badge variant={partner.status === 'ACTIVE' ? 'default' : 'secondary'}>
          {partner.status}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalConversions || 0}</div>
            <p className="text-xs text-muted-foreground">
              Successful referrals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.totalCommission || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Lifetime earnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission Rate</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partner.defaultBps / 100}%</div>
            <p className="text-xs text-muted-foreground">
              Per conversion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Links */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Referral Links
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <span className="flex items-center">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Link
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Referral Link</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="landing">Landing Page (Optional)</Label>
                  <Input
                    id="landing"
                    placeholder="e.g., /artist/john-doe or /artwork/summer-vibes"
                    value={newLinkData.landing}
                    onChange={(e) => setNewLinkData(prev => ({ 
                      ...prev, 
                      landing: e.target.value 
                    }))}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateLink}>
                    Create Link
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {partner.links.length === 0 ? (
            <div className="text-center py-8">
              <Link className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No referral links yet</h3>
              <p className="text-gray-500 mb-4">
                Create your first referral link to start earning commissions.
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Link
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {partner.links.map((link) => (
                <div key={link.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-lg">{link.code}</span>
                      {link.landing && (
                        <Badge variant="outline">{link.landing}</Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(getReferralUrl(link.code))}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-gray-500">Visits</p>
                      <p className="font-semibold">{link._count.visits}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Conversions</p>
                      <p className="font-semibold">{link._count.conversions}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={getReferralUrl(link.code)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Test Link
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Conversions */}
      {stats?.recentConversions && stats.recentConversions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Conversions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentConversions.map((conversion) => (
                <div key={conversion.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Order #{conversion.orderId}</p>
                    <p className="text-sm text-gray-500">
                      {formatCurrency(conversion.subtotalMinor, conversion.currency)} • {conversion.kind}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      +{formatCurrency(conversion.commissionMinor, conversion.currency)}
                    </p>
                    <Badge variant={
                      conversion.status === 'PAID' ? 'default' : 
                      conversion.status === 'APPROVED' ? 'secondary' : 'outline'
                    }>
                      {conversion.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stripe Connect Status */}
      {partner.connectId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payout Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="default">Connected to Stripe</Badge>
              <span className="text-sm text-gray-500">
                Payouts will be processed automatically
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
