"use client";

import { Shield, CreditCard, Users } from "lucide-react";
import { useLocale } from "next-intl";

interface TrustStripProps {
  className?: string;
}

export function TrustStrip({ className = "" }: TrustStripProps) {
  const locale = useLocale();

  const trustItems = [
    {
      icon: Shield,
      title: locale === "ro" ? "Certificat de Autenticitate" : "Certificate of Authenticity",
      description: locale === "ro" ? "Fiecare lucrare vine cu certificat" : "Every artwork comes with certificate",
    },
    {
      icon: CreditCard,
      title: locale === "ro" ? "Plăți Securizate" : "Secure Payments",
      description: locale === "ro" ? "Protejate de Stripe" : "Protected by Stripe",
    },
    {
      icon: Users,
      title: locale === "ro" ? "Suport de Curatori" : "Curated Support",
      description: locale === "ro" ? "Asistență personalizată" : "Personalized assistance",
    },
  ];

  return (
    <div className={`flex flex-wrap gap-6 justify-center py-4 border-t ${className}`}>
      {trustItems.map((item, index) => (
        <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
          <item.icon className="h-4 w-4 text-gray-500" />
          <div>
            <div className="font-medium">{item.title}</div>
            <div className="text-xs text-gray-500">{item.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
