// Verified school-project badge. An APPROVED affiliation is shown to everyone as
// "✓ [School] Project" (green = verified, not just claimed). PENDING / REJECTED
// states are only surfaced to the project owner.
export default function SchoolProjectBadge({
  affiliation,
  schoolName,
  isOwner = false,
  className = "",
}: {
  affiliation?: string | null;
  schoolName?: string | null;
  isOwner?: boolean;
  className?: string;
}) {
  if (!schoolName) return null;

  if (affiliation === "APPROVED") {
    return (
      <span className={`inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 ${className}`}>
        ✓ {schoolName} Project
      </span>
    );
  }

  if (!isOwner) return null;

  if (affiliation === "PENDING") {
    return (
      <span className={`inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ${className}`}>
        ⏳ Waiting for {schoolName} to approve
      </span>
    );
  }
  if (affiliation === "REJECTED") {
    return (
      <span className={`inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-500 ${className}`}>
        {schoolName} affiliation not approved
      </span>
    );
  }
  return null;
}
