"use client";

import { useWaitlist } from "./WaitlistProvider";
import { cn } from "@/lib/utils";

type Variant = "primary" | "nav" | "footer";

const STYLES: Record<Variant, string> = {
  primary:
    "inline-flex items-center gap-2 rounded-md bg-[#1e40af] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#1d4ed8] transition-colors",
  nav:
    "text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors focus:outline-2 focus:outline-[#1e40af] focus:rounded-sm",
  footer: "hover:text-zinc-700 transition-colors",
};

export default function WaitlistButton({
  variant = "primary",
  className,
  children = "Join the Waitlist",
}: {
  variant?: Variant;
  className?: string;
  children?: React.ReactNode;
}) {
  const { open } = useWaitlist();
  return (
    <button type="button" onClick={open} className={cn(STYLES[variant], className)}>
      {children}
    </button>
  );
}
