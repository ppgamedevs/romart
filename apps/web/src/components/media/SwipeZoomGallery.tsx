"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

type Props = {
  images: string[];
  alt?: string;
  className?: string;
};

export default function SwipeZoomGallery({ images, alt = "image", className = "" }: Props) {
  const [idx, setIdx] = useState(0);
  const container = useRef<HTMLDivElement | null>(null);

  // pinch/zoom state
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const pts = useRef<Map<number, { x: number; y: number }>>(new Map());
  const last = useRef({ scale: 1, tx: 0, ty: 0 });

  // swipe state
  const startX = useRef<number | null>(null);
  const moved = useRef(false);

  function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
    const dx = a.x - b.x, dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture(e.pointerId);
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.current.size === 1) {
      startX.current = e.clientX; moved.current = false;
    }
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!pts.current.has(e.pointerId)) return;
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const p = Array.from(pts.current.values());
    if (p.length === 2) {
      // pinch
      const c0 = p[0], c1 = p[1];
      const midX = (c0.x + c1.x) / 2, midY = (c0.y + c1.y) / 2;
      const d0 = distance(c0, c1);

      // reference values on first two-finger contact
      // @ts-ignore
      if (!last.current.d0) { (last.current as any).d0 = d0; (last.current as any).m0 = { x: midX, y: midY }; }

      const s = Math.min(4, Math.max(1, (d0 / (last.current as any).d0) * last.current.scale));
      setScale(s);

      // simple pan locked while zoomed
      const dx = c0.x - (last.current as any).m0.x;
      const dy = c0.y - (last.current as any).m0.y;
      setTx(last.current.tx + dx / 2);
      setTy(last.current.ty + dy / 2);
    } else if (p.length === 1 && scale === 1) {
      // swipe only when not zoomed
      const x = p[0].x;
      if (startX.current != null && Math.abs(x - startX.current) > 8) moved.current = true;
    }
  }
  function onPointerUp(e: React.PointerEvent) {
    pts.current.delete(e.pointerId);
    if (pts.current.size < 2) {
      // commit zoom/pan
      last.current = { scale, tx, ty };
      // reset pinch refs
      // @ts-ignore
      delete (last.current as any).d0; delete (last.current as any).m0;
    }
    if (pts.current.size === 0 && scale === 1 && startX.current != null && moved.current) {
      // compute swipe
      const dx = e.clientX - startX.current;
      if (dx < -30 && idx < images.length - 1) setIdx((i) => i + 1);
      if (dx > 30 && idx > 0) setIdx((i) => i - 1);
    }
    startX.current = null; moved.current = false;
  }

  function onDoubleClick() {
    if (scale !== 1) { setScale(1); setTx(0); setTy(0); last.current = { scale: 1, tx: 0, ty: 0 }; }
    else { setScale(2); last.current.scale = 2; }
  }

  useEffect(() => {
    // reset zoom when image changes
    setScale(1); setTx(0); setTy(0); last.current = { scale: 1, tx: 0, ty: 0 };
  }, [idx]);

  if (!images?.length) return null;

  return (
    <div className={"select-none touch-pan-y " + className}>
      <div
        ref={container}
        className="relative aspect-[4/3] bg-neutral-100 rounded-lg overflow-hidden"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={onDoubleClick}
      >
        <div
          className="absolute inset-0 will-change-transform"
          style={{ transform: `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`, transition: "transform 80ms linear" }}
        >
          <Image
            src={images[idx]}
            alt={alt}
            fill
            sizes="(max-width:768px) 100vw, 50vw"
            className="object-cover"
            priority={false}
          />
        </div>

        {/* prev/next hints (desktop & large screens) */}
        <button
          className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full w-8 h-8 items-center justify-center"
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          aria-label="Previous image"
        >‹</button>
        <button
          className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full w-8 h-8 items-center justify-center"
          onClick={() => setIdx((i) => Math.min(images.length - 1, i + 1))}
          aria-label="Next image"
        >›</button>

        {/* dots */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
          {images.map((_, i) => (
            <span key={i} className={"w-1.5 h-1.5 rounded-full " + (i === idx ? "bg-white" : "bg-white/60")}/>
          ))}
        </div>
      </div>
      <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar">
        {images.map((src, i) => (
          <button key={i} onClick={() => setIdx(i)} aria-label={`Thumb ${i+1}`} className={"relative w-16 h-12 rounded-md overflow-hidden border " + (i===idx ? "border-black" : "border-transparent")}>
            <Image src={src} alt={`thumb ${i+1}`} fill sizes="64px" className="object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
