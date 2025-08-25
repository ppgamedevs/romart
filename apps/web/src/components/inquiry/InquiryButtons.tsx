"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { InquiryModal } from "./InquiryModal";
import { useLocale } from "next-intl";

interface InquiryButtonsProps {
  artistId: string;
  artworkId?: string;
  artistName: string;
  artworkTitle?: string;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg";
}

export function InquiryButtons({
  artistId,
  artworkId,
  artistName,
  artworkTitle,
  variant = "default",
  size = "default",
}: InquiryButtonsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const locale = useLocale();

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          variant={variant}
          size={size}
          onClick={() => setIsModalOpen(true)}
          className="flex-1"
        >
          {locale === "ro" ? "Întreabă un curator" : "Ask a curator"}
        </Button>
        {artworkId && (
          <Button
            variant="outline"
            size={size}
            onClick={() => setIsModalOpen(true)}
            className="flex-1"
          >
            {locale === "ro" ? "Comandă o lucrare" : "Commission artwork"}
          </Button>
        )}
      </div>

      <InquiryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        artistId={artistId}
        artworkId={artworkId}
        artistName={artistName}
        artworkTitle={artworkTitle}
      />
    </>
  );
}
