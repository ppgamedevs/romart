export const OG_SIZE = { width: 1200, height: 630 } as const;
export const contentType = "image/png";

export const colors = {
  bg: "#0b0b0b",
  fg: "#ffffff",
  dim: "rgba(255,255,255,0.65)",
  pill: "rgba(255,255,255,0.08)",
  border: "rgba(255,255,255,0.15)",
  brand: "#111111",
};

export function gradientOverlay() {
  return "linear-gradient(90deg, rgba(0,0,0,0.66) 0%, rgba(0,0,0,0.33) 40%, rgba(0,0,0,0.10) 100%)";
}

export function money(minor?: number, currency = "EUR") {
  if (typeof minor !== "number") return "";
  try { 
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(minor / 100); 
  } catch { 
    return (minor / 100).toFixed(2) + " " + currency; 
  }
}
