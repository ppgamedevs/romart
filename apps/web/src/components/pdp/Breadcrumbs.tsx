import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { breadcrumbJsonLd, type BreadcrumbItem } from "@artfromromania/shared";

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-1 text-sm text-muted-foreground">
      {items.map((item, index) => (
        <div key={item.url} className="flex items-center">
          {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
          {index === items.length - 1 ? (
            <span className="text-foreground font-medium">{item.name}</span>
          ) : (
            <Link
              href={item.url}
              className="hover:text-foreground transition-colors"
            >
              {item.name}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}

export function BreadcrumbsJsonLd({ items }: BreadcrumbsProps) {
  const jsonLd = breadcrumbJsonLd(items);
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
