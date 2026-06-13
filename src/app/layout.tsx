import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/layout/SessionProvider";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FloatingFeedbackButton from "@/components/FloatingFeedbackButton";
import CookieConsent from "@/components/CookieConsent";

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
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:rounded-md focus:border focus:border-red-600 focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-red-600"
        >
          Skip to main content
        </a>
        {/* Prototype banner — always visible, not dismissable */}
        <div
          role="alert"
          className="flex h-9 w-full items-center justify-center bg-red-600 px-4 text-center text-xs font-medium text-white sm:text-sm"
        >
          ⚠️ This is a prototype — some features are still being refined
        </div>
        <SessionProvider>
          <Navbar />
          <FloatingFeedbackButton />
          <main id="main-content" className="flex-1 flex flex-col">
            {children}
          </main>
          <Footer />
          <CookieConsent />
        </SessionProvider>
      </body>
    </html>
  );
}
