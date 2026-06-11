import Link from "next/link";
import { Mountain } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-zinc-500 sm:flex-row">
        <div className="flex items-center gap-2">
          <Mountain className="h-4 w-4 text-red-500" />
          <span className="font-medium text-zinc-700">Swiss Startup Hub</span>
        </div>
        <p>Connecting the Swiss startup ecosystem</p>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-zinc-700 transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-zinc-700 transition-colors">Terms</Link>
          <Link href="/contact" className="hover:text-zinc-700 transition-colors">Contact</Link>
        </div>
      </div>
    </footer>
  );
}
