import { formatMinor } from "@artfromromania/shared";

interface PriceProps {
  amount: number;
  currency?: string;
  className?: string;
}

export function Price({ amount, currency = "EUR", className }: PriceProps) {
  return (
    <span className={className}>
      {formatMinor(amount, currency)}
    </span>
  );
}
