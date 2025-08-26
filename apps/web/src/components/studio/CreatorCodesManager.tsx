'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Copy, Edit, Trash2, Gift, TrendingUp } from 'lucide-react';

interface CreatorCode {
  id: string;
  code: string;
  discountBps: number;
  bonusBps: number;
  active: boolean;
  createdAt: string;
  _count?: {
    conversions: number;
  };
}

export function CreatorCodesManager() {
  const [codes, setCodes] = useState<CreatorCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    discountBps: 1000, // 10%
    bonusBps: 500, // 5%
  });

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    try {
      const response = await fetch('/api/aff/studio/creator-codes');
      if (!response.ok) throw new Error('Failed to fetch codes');
      
      const data = await response.json();
      setCodes(data.codes);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load creator codes',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCode = async () => {
    if (!formData.code.trim()) return;

    setIsCreating(true);
    try {
      const response = await fetch('/api/aff/studio/creator-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create code');
      }

      const { creatorCode } = await response.json();
      setCodes(prev => [creatorCode, ...prev]);
      setIsDialogOpen(false);
      setFormData({ code: '', discountBps: 1000, bonusBps: 500 });
      
      toast({
        title: 'Success',
        description: 'Creator code created successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create code',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleActive = async (codeId: string, active: boolean) => {
    try {
      const response = await fetch(`/api/aff/studio/creator-codes/${codeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      });

      if (!response.ok) throw new Error('Failed to update code');

      setCodes(prev => prev.map(code => 
        code.id === codeId ? { ...code, active } : code
      ));

      toast({
        title: 'Success',
        description: `Code ${active ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update code',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Copied!',
      description: 'Code copied to clipboard',
    });
  };

  const getReferralUrl = (code: string) => {
    return `${window.location.origin}/r/${code}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Creator Codes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Creator Codes
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Code
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Creator Code</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  placeholder="e.g., SUMMER10"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    code: e.target.value.toUpperCase() 
                  }))}
                  maxLength={10}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discount">Customer Discount (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="50"
                    value={formData.discountBps / 100}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      discountBps: parseInt(e.target.value) * 100 
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="bonus">Your Bonus (%)</Label>
                  <Input
                    id="bonus"
                    type="number"
                    min="0"
                    max="50"
                    value={formData.bonusBps / 100}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      bonusBps: parseInt(e.target.value) * 100 
                    }))}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCode} disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Code'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {codes.length === 0 ? (
          <div className="text-center py-8">
            <Gift className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No creator codes yet</h3>
            <p className="text-gray-500 mb-4">
              Create your first creator code to offer discounts to your customers and earn bonuses.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Code
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {codes.map((code) => (
              <div key={code.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Badge variant={code.active ? "default" : "secondary"}>
                      {code.active ? "Active" : "Inactive"}
                    </Badge>
                    <span className="font-mono font-bold text-lg">{code.code}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={code.active}
                      onCheckedChange={(checked) => handleToggleActive(code.id, checked)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(getReferralUrl(code.code))}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-sm text-gray-500">Customer Discount</p>
                    <p className="font-semibold">{code.discountBps / 100}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Your Bonus</p>
                    <p className="font-semibold">{code.bonusBps / 100}%</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Created {new Date(code.createdAt).toLocaleDateString()}</span>
                  {code._count && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      <span>{code._count.conversions} conversions</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
