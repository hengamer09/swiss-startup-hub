import Link from "next/link";
import { Mountain } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50">
      <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-zinc-500">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <Mountain className="h-4 w-4 text-red-500" aria-hidden="true" />
            <span className="font-medium text-zinc-700">Swiss Startup Hub</span>
          </div>
          <p className="text-zinc-400 text-xs">Connecting the Swiss startup ecosystem</p>
          <nav aria-label="Footer navigation">
            <ul className="flex gap-4 list-none m-0 p-0">
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
        </div>
        <p className="mt-4 text-center text-xs text-zinc-400">
          &copy; 2025 Swiss Startup Hub. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
