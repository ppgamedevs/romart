"use client";

import Image from "next/image";
import Link from "next/link";
import { VerifiedBadge } from "./ArtistBadge";

export default function ArtistHeader({ artist, locale }: { artist: any; locale: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card">
      {/* Subtle cover */}
      {artist.coverUrl && (
        <div className="absolute inset-0 opacity-15">
          <Image src={artist.coverUrl} alt="" fill className="object-cover" />
        </div>
      )}
      <div className="relative p-6 md:p-8 flex gap-4">
        <div className="relative w-28 h-28 rounded-full overflow-hidden border bg-neutral-100 shrink-0">
          {artist.avatarUrl && <Image src={artist.avatarUrl} alt={artist.displayName} fill className="object-cover" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-semibold">{artist.displayName}</h1>
            {artist.verifiedAt && <VerifiedBadge />}
          </div>
          {artist.bio && <p className="mt-2 max-w-2xl opacity-80">{artist.bio}</p>}
          <div className="mt-3 flex items-center gap-4 text-sm opacity-80">
            {artist.kpi?.worksCount != null && <span>{artist.kpi.worksCount} works</span>}
            {artist.kpi?.soldCount != null && <span>{artist.kpi.soldCount} sold</span>}
          </div>
          <div className="mt-4 flex gap-3">
            <Link href={`/${locale}/curator/request?artistId=${artist.id}`} className="px-4 py-2 rounded-xl bg-black text-white">
              Ask a Curator about this artist
            </Link>
            <a href={`/${locale}/discover?artist=${encodeURIComponent(artist.slug)}`} className="px-4 py-2 rounded-xl border">
              View all works
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
