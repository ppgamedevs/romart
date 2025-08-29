"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label className="flex items-center space-x-2 cursor-pointer">
        <div className="relative">
          <input
            type="checkbox"
            className="peer sr-only"
            ref={ref}
            {...props}
          />
          <div className={cn(
            "w-5 h-5 border-2 border-border rounded-lg bg-card transition-all",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2",
            "peer-checked:bg-accent peer-checked:border-accent",
            "peer-disabled:opacity-50 peer-disabled:cursor-not-allowed",
            className
          )}>
            <Check className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity absolute inset-0 m-auto" />
          </div>
        </div>
        {label && (
          <span className="text-sm text-fg peer-disabled:opacity-50">
            {label}
          </span>
        )}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
