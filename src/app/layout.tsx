import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "RigSense",
    template: "%s | RigSense",
  },
  description:
    "RigSense is a custom PC building platform for part discovery, saved builds, benchmarks, guides, and community Q&A.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-950 text-slate-100">
        <div className="relative flex min-h-full flex-col overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.22),_transparent_55%)]" />
          <SiteHeader />
          <main className="relative z-10 flex-1">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
