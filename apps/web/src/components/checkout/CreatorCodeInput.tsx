'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Gift } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CreatorCodeInputProps {
  onCodeApplied: (codeData: {
    code: string;
    discountBps: number;
    discountPercent: number;
    partnerName: string;
    codeId: string;
  }) => void;
  onCodeRemoved: () => void;
  appliedCode?: {
    code: string;
    discountBps: number;
    discountPercent: number;
    partnerName: string;
    codeId: string;
  } | null;
}

export function CreatorCodeInput({ 
  onCodeApplied, 
  onCodeRemoved, 
  appliedCode 
}: CreatorCodeInputProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleApplyCode = async () => {
    if (!code.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/aff/checkout/apply-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: code.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to apply code');
      }

      const codeData = await response.json();
      onCodeApplied(codeData);
      setCode('');
      
      toast({
        title: 'Code applied successfully!',
        description: `${codeData.discountPercent}% discount applied from ${codeData.partnerName}`,
      });
    } catch (error) {
      toast({
        title: 'Error applying code',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCode = () => {
    onCodeRemoved();
    toast({
      title: 'Code removed',
      description: 'Creator code has been removed from your order',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Have a creator code?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {appliedCode ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">
                    {appliedCode.code} - {appliedCode.discountPercent}% off
                  </p>
                  <p className="text-sm text-green-600">
                    Powered by {appliedCode.partnerName}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveCode}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="creator-code">Creator Code</Label>
              <div className="flex gap-2">
                <Input
                  id="creator-code"
                  placeholder="Enter your code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && handleApplyCode()}
                  disabled={isLoading}
                />
                <Button 
                  onClick={handleApplyCode} 
                  disabled={!code.trim() || isLoading}
                  size="default"
                >
                  {isLoading ? 'Applying...' : 'Apply'}
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Enter a creator code to get a special discount and support your favorite artists.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
