export default function ExhibitionsTimeline({ items }: { items: any[] }) {
  if (!items?.length) return null;
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold">Exhibitions</h2>
      <ol className="mt-4 relative border-s pl-6 space-y-4">
        {items.map((e) => (
          <li key={e.id} className="relative">
            <span className="absolute -start-1.5 mt-1.5 w-3 h-3 rounded-full bg-black"></span>
            <div className="text-sm">
              <div className="font-medium">
                {e.type === "SOLO" ? "Solo" : "Group"} — {e.title}
              </div>
              <div className="opacity-70">
                {[e.venue, e.city, e.country].filter(Boolean).join(", ")}
                {e.startDate && (
                  <>
                    {" "}
                    · {new Date(e.startDate).getFullYear()}
                    {e.endDate && e.endDate !== e.startDate
                      ? `–${new Date(e.endDate).getFullYear()}`
                      : ""}
                  </>
                )}
              </div>
              {e.url && (
                <a href={e.url} target="_blank" className="underline text-xs opacity-80">
                  More
                </a>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
