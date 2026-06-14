"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { computeProfileCompleteness, type CompletenessInput } from "@/lib/profileCompleteness";

export default function ProfileCompletenessCard({
  user,
  compact = false,
}: {
  user: CompletenessInput;
  compact?: boolean;
}) {
  const { percent, nextMissing } = computeProfileCompleteness(user);
  const complete = percent >= 100;

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-700">
          {complete ? (
            <span className="flex items-center gap-1.5 font-medium text-green-600">
              <CheckCircle2 className="h-4 w-4" /> Your profile is complete!
            </span>
          ) : (
            <>
              Your profile is <span className="font-bold text-zinc-900">{percent}%</span> complete
            </>
          )}
        </p>
        {!compact && !complete && (
          <Link href="/profile/edit" className="text-xs font-medium text-[#1e40af] hover:text-[#1e40af]">
            Complete profile
          </Link>
        )}
      </div>

      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-200">
        <div
          className={`h-2 rounded-full transition-all ${complete ? "bg-green-500" : "bg-[#1e40af]"}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {!complete && nextMissing && (
        <p className="mt-2 text-xs text-zinc-500">
          <Link href="/profile/edit" className="font-medium text-zinc-700 hover:text-[#1e40af]">
            {nextMissing.suggestion}
          </Link>{" "}
          to reach {nextMissing.reachPercent}%.
        </p>
      )}
    </div>
  );
}
