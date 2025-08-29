"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ToggleProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Toggle = React.forwardRef<HTMLInputElement, ToggleProps>(
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
            "w-11 h-6 bg-muted rounded-full transition-colors duration-200",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2",
            "peer-checked:bg-accent",
            "peer-disabled:opacity-50 peer-disabled:cursor-not-allowed",
            className
          )}>
            <div className={cn(
              "w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200",
              "translate-x-0.5 translate-y-0.5",
              "peer-checked:translate-x-5"
            )} />
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

Toggle.displayName = "Toggle";

export { Toggle };
