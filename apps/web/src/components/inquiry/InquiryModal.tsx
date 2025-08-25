"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLocale } from "next-intl";

interface InquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  artistId: string;
  artworkId?: string;
  artistName: string;
  artworkTitle?: string;
}

export function InquiryModal({
  isOpen,
  onClose,
  artistId,
  artworkId,
  artistName,
  artworkTitle,
}: InquiryModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: "QUESTION" as "QUESTION" | "COMMISSION",
    email: "",
    budgetMin: "",
    budgetMax: "",
    dimensions: "",
    deadline: "",
    notes: "",
  });
  const { toast } = useToast();
  const locale = useLocale();

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: formData.type,
          artistId,
          artworkId,
          email: formData.email,
          budgetMin: formData.budgetMin ? parseInt(formData.budgetMin) * 100 : undefined,
          budgetMax: formData.budgetMax ? parseInt(formData.budgetMax) * 100 : undefined,
          dimensions: formData.dimensions || undefined,
          deadlineAt: formData.deadline || undefined,
          notes: formData.notes || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit inquiry");
      }

      toast({
        title: locale === "ro" ? "Inquiry submitted" : "Inquiry submitted",
        description: locale === "ro" 
          ? "A curator will contact you soon via email."
          : "A curator will contact you soon via email.",
      });

      onClose();
      setStep(1);
      setFormData({
        type: "QUESTION",
        email: "",
        budgetMin: "",
        budgetMax: "",
        dimensions: "",
        deadline: "",
        notes: "",
      });
    } catch (error) {
      toast({
        title: locale === "ro" ? "Error" : "Error",
        description: locale === "ro" 
          ? "Failed to submit inquiry. Please try again."
          : "Failed to submit inquiry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && !formData.email) {
      toast({
        title: locale === "ro" ? "Email required" : "Email required",
        description: locale === "ro" 
          ? "Please enter your email address."
          : "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 1 && (locale === "ro" ? "Choose inquiry type" : "Choose inquiry type")}
            {step === 2 && (locale === "ro" ? "Contact information" : "Contact information")}
            {step === 3 && (locale === "ro" ? "Project details" : "Project details")}
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">
                {locale === "ro" ? "Inquiry type" : "Inquiry type"}
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value: "QUESTION" | "COMMISSION") =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="QUESTION">
                    {locale === "ro" ? "Ask a question" : "Ask a question"}
                  </SelectItem>
                  <SelectItem value="COMMISSION">
                    {locale === "ro" ? "Commission artwork" : "Commission artwork"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-gray-600">
              {formData.type === "QUESTION" ? (
                <p>
                  {locale === "ro" 
                    ? "Ask a curator about this artwork or artist."
                    : "Ask a curator about this artwork or artist."
                  }
                </p>
              ) : (
                <p>
                  {locale === "ro"
                    ? "Request a custom artwork from this artist."
                    : "Request a custom artwork from this artist."
                  }
                </p>
              )}
            </div>

            <Button onClick={nextStep} className="w-full">
              {locale === "ro" ? "Next" : "Next"}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm font-medium">
                {locale === "ro" ? "Email address" : "Email address"}
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={locale === "ro" ? "your@email.com" : "your@email.com"}
                required
              />
            </div>

            <div className="text-sm text-gray-600">
              <p>
                {locale === "ro"
                  ? "A curator will contact you at this email address."
                  : "A curator will contact you at this email address."
                }
              </p>
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={prevStep} className="flex-1">
                {locale === "ro" ? "Back" : "Back"}
              </Button>
              <Button onClick={nextStep} className="flex-1">
                {locale === "ro" ? "Next" : "Next"}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            {formData.type === "COMMISSION" && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="budgetMin" className="text-sm font-medium">
                      {locale === "ro" ? "Min budget (€)" : "Min budget (€)"}
                    </Label>
                    <Input
                      id="budgetMin"
                      type="number"
                      value={formData.budgetMin}
                      onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                      placeholder="100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="budgetMax" className="text-sm font-medium">
                      {locale === "ro" ? "Max budget (€)" : "Max budget (€)"}
                    </Label>
                    <Input
                      id="budgetMax"
                      type="number"
                      value={formData.budgetMax}
                      onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                      placeholder="500"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="dimensions" className="text-sm font-medium">
                    {locale === "ro" ? "Dimensions" : "Dimensions"}
                  </Label>
                  <Input
                    id="dimensions"
                    value={formData.dimensions}
                    onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                    placeholder={locale === "ro" ? "80x120 cm" : "80x120 cm"}
                  />
                </div>

                <div>
                  <Label htmlFor="deadline" className="text-sm font-medium">
                    {locale === "ro" ? "Deadline" : "Deadline"}
                  </Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="notes" className="text-sm font-medium">
                {formData.type === "QUESTION" 
                  ? (locale === "ro" ? "Your question" : "Your question")
                  : (locale === "ro" ? "Project brief" : "Project brief")
                }
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={
                  formData.type === "QUESTION"
                    ? (locale === "ro" ? "Ask about the artwork, technique, or artist..." : "Ask about the artwork, technique, or artist...")
                    : (locale === "ro" ? "Describe your vision, style preferences, or any specific requirements..." : "Describe your vision, style preferences, or any specific requirements...")
                }
                rows={4}
              />
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={prevStep} className="flex-1">
                {locale === "ro" ? "Back" : "Back"}
              </Button>
              <Button onClick={handleSubmit} disabled={loading} className="flex-1">
                {loading 
                  ? (locale === "ro" ? "Submitting..." : "Submitting...")
                  : (locale === "ro" ? "Submit" : "Submit")
                }
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
