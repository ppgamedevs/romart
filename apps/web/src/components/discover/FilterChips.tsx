"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

const MEDIUMS = [
  { key: "all", label: "All" },
  { key: "painting", label: "Painting" },
  { key: "drawing", label: "Drawing" },
  { key: "photography", label: "Photography" },
  { key: "digital", label: "Digital" },
];

const SORTS = [
  { key: "popular", label: "Popular" },
  { key: "price_asc", label: "Price ↑" },
  { key: "price_desc", label: "Price ↓" },
];

export default function FilterChips() {
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = usePathname();

  const medium = sp.get("medium") || "all";
  const sort = sp.get("sort") || "popular";

  function update(params: Record<string, string | undefined>) {
    const u = new URL(window.location.href);
    for (const [k, v] of Object.entries(params)) {
      if (!v || v === "all") u.searchParams.delete(k);
      else u.searchParams.set(k, v);
    }
    u.searchParams.delete("page"); // reset pagination on filter change
    router.push(u.pathname + "?" + u.searchParams.toString(), { scroll: false });
  }

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      {/* Medium chips */}
      <div className="flex gap-2 flex-wrap">
        {MEDIUMS.map((m) => {
          const active = medium === m.key;
          return (
            <button
              key={m.key}
              onClick={() => update({ medium: m.key })}
              className={
                "px-3 py-1.5 rounded-full border text-sm " +
                (active
                  ? "bg-black text-white border-black"
                  : "hover:bg-neutral-100")
              }
              aria-pressed={active}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Sort select */}
      <label className="text-sm flex items-center gap-2">
        <span className="opacity-70">Sort:</span>
        <select
          value={sort}
          onChange={(e) => update({ sort: e.target.value })}
          className="border rounded-md px-2 py-1 text-sm"
        >
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
