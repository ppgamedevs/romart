"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ChevronDown, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const locales = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "ro", name: "Română", flag: "🇷🇴" },
];

export function LocaleSwitcher() {
  const t = useTranslations("language");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentLocale = locales.find(l => l.code === locale) || locales[0];

  const switchLocale = (newLocale: string) => {
    if (!mounted) return;
    
    // Remove current locale from pathname
    const pathWithoutLocale = pathname.replace(`/${locale}`, "");
    
    // Set cookie
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    
    // Navigate to new locale
    router.push(`/${newLocale}${pathWithoutLocale}`);
    setIsOpen(false);
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Globe className="h-4 w-4 mr-2" />
        🇺🇸
        <ChevronDown className="h-4 w-4 ml-2" />
      </Button>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <span className="flex items-center">
            <Globe className="h-4 w-4 mr-2" />
            {currentLocale.flag}
            <ChevronDown className="h-4 w-4 ml-2" />
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc.code}
            onClick={() => switchLocale(loc.code)}
            className={currentLocale.code === loc.code ? "bg-accent" : ""}
          >
            <span className="mr-2">{loc.flag}</span>
            {loc.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
