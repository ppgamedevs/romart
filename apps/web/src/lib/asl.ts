export function getASL() {
  if (typeof window === "undefined") return undefined;
  const u = new URL(window.location.href);
  return u.searchParams.get("asl") || undefined;
}
