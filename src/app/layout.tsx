import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/layout/SessionProvider";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FloatingFeedbackButton from "@/components/FloatingFeedbackButton";
import CookieConsent from "@/components/CookieConsent";
import WaitlistProvider from "@/components/waitlist/WaitlistProvider";
import PrototypeBanner from "@/components/PrototypeBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Swiss Startup Hub",
  description:
    "Connect with founders, professionals, and investors in the Swiss startup ecosystem.",
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
      <body className="min-h-full flex flex-col bg-white text-zinc-900 font-sans">
        {/* Skip navigation — visible on focus for keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:rounded-md focus:border focus:border-[#3b82f6] focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[#1e40af]"
        >
          Skip to main content
        </a>
        {/* Prototype banner — dismissable, remembered via localStorage */}
        <PrototypeBanner />
        <SessionProvider>
          <WaitlistProvider>
            <Navbar />
            <FloatingFeedbackButton />
            <main id="main-content" className="flex-1 flex flex-col bg-[#f8fafc]">
              {children}
            </main>
            <Footer />
            <CookieConsent />
          </WaitlistProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
