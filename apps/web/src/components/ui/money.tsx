"use client";

import { useLocale } from "next-intl";
import { Currency, formatCurrency } from "@artfromromania/shared";

interface MoneyProps {
  amountMinor: number;
  currency: Currency;
  className?: string;
}

export function Money({ amountMinor, currency, className }: MoneyProps) {
  const locale = useLocale();
  
  return (
    <span className={className}>
      {formatCurrency(amountMinor, currency, locale)}
    </span>
  );
}
