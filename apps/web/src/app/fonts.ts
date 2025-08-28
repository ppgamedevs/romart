import { Inter } from "next/font/google";

export const fontSans = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
  variable: "--font-sans",
});
