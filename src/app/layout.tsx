import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fitto — Gentle Fitness for Beginners",
  description:
    "A Duolingo-like beginner fitness app focused on consistency over intensity.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async></script>
      </head>
      <body className="min-h-screen bg-fitto-bg text-fitto-text antialiased">
        <main className="mx-auto max-w-md overflow-x-hidden px-4 pb-12">{children}</main>
      </body>
    </html>
  );
}
