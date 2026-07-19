import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/layout/NavBar";
import { PatchVersionBanner } from "@/components/layout/PatchVersionBanner";
import { PersistedStateProvider } from "@/hooks/usePersistedState";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PoE2 Endgame Companion",
  description:
    "Progression checklist, Atlas tree planner, and farming-strategy dashboard for Path of Exile 2's 0.5 endgame.",
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
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100">
        <PersistedStateProvider>
          <PatchVersionBanner />
          <NavBar />
          <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
        </PersistedStateProvider>
      </body>
    </html>
  );
}
