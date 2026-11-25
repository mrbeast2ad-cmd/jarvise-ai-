import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "JARVIS AI", description: "Your Personal Intelligent Assistant" };
export const viewport: Viewport = { themeColor: "#060d1f", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body>{children}</body></html>);
}
