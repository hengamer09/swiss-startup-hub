import { parseRoles } from "@/lib/utils";

// Renders 🎓 Student / 🎯 Mentor / ✓ Verified Investor badges for a user.
// Pure component — safe in both server and client components.
export default function UserBadges({
  user,
  className = "",
}: {
  user: {
    isStudent?: boolean | null;
    roles?: string | string[] | null;
    availableForMentoring?: boolean | null;
    identityVerified?: boolean | null;
  };
  className?: string;
}) {
  const roles = Array.isArray(user.roles) ? user.roles : parseRoles(user.roles || "[]");
  const isMentor = roles.includes("MENTOR") && Boolean(user.availableForMentoring);
  const isVerifiedInvestor = roles.includes("INVESTOR") && Boolean(user.identityVerified);

  const badges: { label: string; cls: string }[] = [];
  if (user.isStudent) badges.push({ label: "🎓 Student", cls: "bg-purple-50 text-purple-700" });
  if (isMentor) badges.push({ label: "🎯 Mentor", cls: "bg-purple-50 text-purple-700" });
  if (isVerifiedInvestor) badges.push({ label: "✓ Verified Investor", cls: "bg-blue-50 text-blue-700" });

  if (badges.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {badges.map((b) => (
        <span key={b.label} className={`rounded-full px-3 py-1 text-xs font-medium ${b.cls}`}>
          {b.label}
        </span>
      ))}
    </div>
  );
}
