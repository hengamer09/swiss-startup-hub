import Link from "next/link";
import { Mountain } from "lucide-react";
import WaitlistButton from "@/components/waitlist/WaitlistButton";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50">
      <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-zinc-500">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2">
            <Mountain className="h-4 w-4 text-red-500" aria-hidden="true" />
            <span className="font-medium text-zinc-700">Swiss Startup Hub</span>
          </div>
          <p className="text-zinc-400 text-xs">Connecting the Swiss startup ecosystem</p>
          <nav aria-label="Footer navigation">
            <ul className="flex flex-wrap justify-center gap-4 list-none m-0 p-0">
              <li>
                <WaitlistButton variant="footer">Join Waitlist</WaitlistButton>
              </li>
              <li>
                <Link href="/impressum" className="hover:text-zinc-700 transition-colors">
                  Impressum
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-zinc-700 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-zinc-700 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-zinc-700 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </nav>
          <p className="text-xs text-zinc-400">
            &copy; 2025 Swiss Startup Hub. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
