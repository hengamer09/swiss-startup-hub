import { ShieldCheck, Star, Zap, Medal, Award } from "lucide-react";
import { cn } from "@/lib/utils";

const badgeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  VERIFIED: {
    label: "Identity Verified",
    icon: <ShieldCheck className="h-3.5 w-3.5" />,
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  EARLY_MEMBER: {
    label: "Early Member",
    icon: <Medal className="h-3.5 w-3.5" />,
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  TOP_RATED: {
    label: "Top Rated",
    icon: <Star className="h-3.5 w-3.5" />,
    color: "bg-purple-50 text-purple-700 border-purple-200",
  },
  ACTIVE_CONTRIBUTOR: {
    label: "Active Contributor",
    icon: <Zap className="h-3.5 w-3.5" />,
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
};

export function TrustBadges({
  badges,
  size = "sm",
}: {
  badges: string[];
  size?: "sm" | "md";
}) {
  if (!badges || badges.length === 0) return null;

  const filtered = badges.filter((b) => badgeConfig[b]);

  if (filtered.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1.5", size === "md" && "gap-2")}>
      {filtered.map((badge) => {
        const config = badgeConfig[badge];
        return (
          <span
            key={badge}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium",
              size === "md" && "px-2.5 py-0.5 text-xs",
              size === "sm" && "text-[10px]",
              config.color
            )}
            title={config.label}
          >
            {config.icon}
            {size === "md" && config.label}
          </span>
        );
      })}
    </div>
  );
}

export function TrustBadgesList({ badges }: { badges: string[] }) {
  const filtered = badges.filter((b) => badgeConfig[b]);

  if (filtered.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
        Badges
      </h3>
      <div className="space-y-1.5">
        {filtered.map((badge) => {
          const config = badgeConfig[badge];
          return (
            <div
              key={badge}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium",
                config.color
              )}
            >
              {config.icon}
              {config.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
