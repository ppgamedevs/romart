"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Img = { id: string; url: string; alt?: string };

export default function ArtworkGalleryPro({ images }: { images: Img[] }) {
  const [idx, setIdx] = useState(0);
  const [zoom, setZoom] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") setIdx(i => Math.min(images.length - 1, i + 1));
      if (e.key === "ArrowLeft") setIdx(i => Math.max(0, i - 1));
      if (e.key === "Escape") setZoom(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [images.length]);

  const current = images[idx] || images[0];

  if (!current) {
    return (
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border bg-neutral-100 flex items-center justify-center">
        <div className="text-center text-muted">
          <div className="text-lg">No images available</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div ref={mainRef} className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border bg-neutral-100">
        <Image
          src={current.url}
          alt={current.alt || "Artwork image"}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className={`object-contain transition-transform ${zoom ? "scale-[1.8] cursor-zoom-out" : "cursor-zoom-in"}`}
          onClick={() => setZoom(z => !z)}
        />
        {/* Prev/Next buttons (desktop) */}
        <button 
          aria-label="Previous image" 
          className="hidden md:block absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 px-2 py-1"
          onClick={() => setIdx(i => Math.max(0, i - 1))}
        >
          ‹
        </button>
        <button 
          aria-label="Next image" 
          className="hidden md:block absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 px-2 py-1"
          onClick={() => setIdx(i => Math.min(images.length - 1, i + 1))}
        >
          ›
        </button>
      </div>

      {/* Thumbs */}
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((im, i) => (
            <button 
              key={im.id} 
              aria-label={`Image ${i + 1}`} 
              onClick={() => setIdx(i)}
              className={`relative h-16 w-12 shrink-0 rounded-lg overflow-hidden border ${i === idx ? "ring-2 ring-black" : ""}`}
            >
              <Image src={im.url} alt={im.alt || ""} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
