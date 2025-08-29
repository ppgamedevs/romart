"use client";

import * as React from "react";
import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}

export function Breadcrumbs({ items, className, showHome = true }: BreadcrumbsProps) {
  const allItems = showHome 
    ? [{ label: "Home", href: "/" }, ...items]
    : items;

  return (
    <nav className={cn("flex items-center space-x-1 text-sm", className)} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1">
        {allItems.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-muted mx-1" aria-hidden="true" />
            )}
            
            {item.href && index < allItems.length - 1 ? (
              <Link
                href={item.href}
                className={cn(
                  "flex items-center space-x-1 text-muted hover:text-fg transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded"
                )}
              >
                {index === 0 && showHome && <Home className="w-4 h-4" />}
                <span>{item.label}</span>
              </Link>
            ) : (
              <span 
                className={cn(
                  "flex items-center space-x-1",
                  index === allItems.length - 1 ? "text-fg font-medium" : "text-muted"
                )}
                aria-current={index === allItems.length - 1 ? "page" : undefined}
              >
                {index === 0 && showHome && <Home className="w-4 h-4" />}
                <span>{item.label}</span>
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
