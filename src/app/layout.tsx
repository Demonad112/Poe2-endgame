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
      <body className="min-h-full flex flex-col">
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <PersistedStateProvider>
          <div className="relative z-10 flex min-h-full flex-1 flex-col">
            <PatchVersionBanner />
            <NavBar />
            <main className="flex-1 px-4 py-8 md:px-8">{children}</main>
          </div>
        </PersistedStateProvider>
      </body>
    </html>
  );
}
