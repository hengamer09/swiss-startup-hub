"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Briefcase,
  Star,
  Shield,
  Flame,
  Trophy,
  Medal,
  User,
  Flag,
  Ban,
} from "lucide-react";
import { cn, parseRoles, formatActivityStatus } from "@/lib/utils";
import ReportModal from "@/components/ui/ReportModal";
import ProfileCompletenessCard from "@/components/ProfileCompletenessCard";
import UserBadges from "@/components/UserBadges";

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  FOUNDER: { label: "Founder", color: "red", icon: "🚀" },
  PROFESSIONAL: { label: "Professional", color: "blue", icon: "🛠" },
  INVESTOR: { label: "Investor", color: "amber", icon: "💼" },
};

export default function ProfileContent({
  user,
  isOwnProfile,
  currentUserId,
  createdEvents = [],
  attendingEvents = [],
}: {
  user: any;
  isOwnProfile: boolean;
  currentUserId: string | null;
  createdEvents?: any[];
  attendingEvents?: any[];
}) {
  const roles = parseRoles(user.roles);
  const skillList = user.skills || [];
  const memberships = user.memberships || [];
  const membershipCount = user._count?.memberships || memberships.length;
  const activityLabel = formatActivityStatus(user.activityStatus);
  const [showReport, setShowReport] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const activityColor =
    user.activityStatus === "ACTIVE_THIS_WEEK"
      ? "text-green-600"
      : user.activityStatus === "OCCASIONALLY_ACTIVE"
        ? "text-amber-600"
        : "text-zinc-400";

  const handleBlock = async () => {
    const res = await fetch("/api/block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blockedId: user.id, action: isBlocked ? "unblock" : "block" }),
    });
    if (res.ok) {
      setIsBlocked(!isBlocked);
      setShowBlockConfirm(false);
    }
  };

  const handleMessage = () => {
    if (!currentUserId) return;
    fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: user.id, content: "Hi! I'd like to connect." }),
    });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {isOwnProfile && (
        <div className="mb-4">
          <ProfileCompletenessCard
            compact
            user={{
              name: user.name,
              emailVerified: user.emailVerified,
              image: user.image,
              bio: user.bio,
              skillsCount: skillList.length,
              rolesCount: roles.length,
              portfolioUrl: user.portfolioUrl,
              websiteUrl: user.websiteUrl,
              githubUrl: user.githubUrl,
              linkedinUrl: user.linkedinUrl,
              portfolio: user.portfolio,
            }}
          />
        </div>
      )}
      <div className="rounded-xl border border-zinc-200 bg-white">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100 text-2xl font-bold text-zinc-500 shrink-0">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <User className="h-8 w-8" />
              )}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center">
                <h1 className="text-xl font-semibold text-zinc-900">
                  {user.name}
                </h1>
                <div className="flex items-center gap-1.5">
                  {roles.map((role) => {
                    const cfg = ROLE_CONFIG[role];
                    if (!cfg) return null;
                    return (
                      <span
                        key={role}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                          role === "FOUNDER" && "bg-blue-50 text-blue-700",
                          role === "PROFESSIONAL" && "bg-blue-50 text-blue-700",
                          role === "INVESTOR" && "bg-amber-50 text-amber-700"
                        )}
                      >
                        {cfg.icon} {cfg.label}
                      </span>
                    );
                  })}
                </div>
              </div>

              <UserBadges user={user} className="mt-2 justify-center sm:justify-start" />

              <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-sm text-zinc-500 sm:justify-start">
                {(user.country || user.location) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {user.country ? `${user.country}` : ""}
                    {user.location ? ` · ${user.location}` : ""}
                  </span>
                )}
                <span className={cn("flex items-center gap-1 text-xs", activityColor)}>
                  ● {activityLabel}
                </span>
              </div>

              {user.bio && (
                <p className="mt-3 text-sm text-zinc-600">{user.bio}</p>
              )}

              <div className="mt-4 flex items-center justify-center gap-4 sm:justify-start">
                {user.averageRating > 0 && (
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="font-medium text-zinc-900">
                      {user.averageRating.toFixed(1)}
                    </span>
                    <span className="text-zinc-400">
                      ({user.ratingCount})
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                {user.identityVerified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                    <Shield className="h-3 w-3" /> Identity Verified
                  </span>
                )}
                {user.isEarlyMember && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700">
                    <Flame className="h-3 w-3" /> Early Member
                  </span>
                )}
                {user.ratingCount >= 3 && user.averageRating >= 4.5 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                    <Medal className="h-3 w-3" /> Top Rated
                  </span>
                )}
                {membershipCount >= 3 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                    <Trophy className="h-3 w-3" /> Active Contributor
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 sm:items-end">
              {isOwnProfile && (
                <Link
                  href="/profile/edit"
                  className="rounded-md border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  Edit Profile
                </Link>
              )}
              {!isOwnProfile && currentUserId && (
                <div className="flex items-center gap-2">
                  <Link
                    href="/messages"
                    className="rounded-md bg-[#1e40af] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#1d4ed8] transition-colors"
                  >
                    Message
                  </Link>
                  <button
                    onClick={() => setShowReport(true)}
                    className="rounded-full p-2 text-zinc-400 hover:text-[#1e40af] hover:bg-zinc-100 transition-colors"
                    title="Report"
                  >
                    <Flag className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setShowBlockConfirm(true)}
                    className={cn(
                      "rounded-full p-2 transition-colors",
                      isBlocked
                        ? "text-green-500 hover:bg-green-50"
                        : "text-zinc-400 hover:text-[#1e40af] hover:bg-zinc-100"
                    )}
                    title={isBlocked ? "Unblock" : "Block"}
                  >
                    <Ban className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 border-t border-zinc-100 pt-6">
            <h2 className="text-sm font-medium text-zinc-900 mb-2">Skills</h2>
            {skillList.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {skillList.map((us: any) => (
                  <span
                    key={us.skill.id}
                    className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700"
                  >
                    {us.skill.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-400">No skills added yet</p>
            )}
          </div>

          {roles.includes("INVESTOR") && (
            <div className="mt-6 border-t border-zinc-100 pt-6">
              <h2 className="text-sm font-medium text-zinc-900 mb-3">
                Investor Details
              </h2>
              <div className="space-y-2 text-sm text-zinc-600">
                {user.investmentFocus && (
                  <p>Focus: {user.investmentFocus}</p>
                )}
                {user.preferredStage && <p>Stage: {user.preferredStage}</p>}
                {user.ticketSizeMin != null && (
                  <p>
                    Ticket: CHF {user.ticketSizeMin.toLocaleString()}
                    {user.ticketSizeMax != null &&
                      ` – ${user.ticketSizeMax.toLocaleString()}`}
                  </p>
                )}
                <p>
                  Messages:{" "}
                  {user.openToMessages ? (
                    <span className="text-green-600">Open to receiving messages</span>
                  ) : (
                    <span className="text-zinc-400">Not accepting cold messages</span>
                  )}
                </p>
              </div>
            </div>
          )}

          {memberships.length > 0 && (
            <div className="mt-6 border-t border-zinc-100 pt-6">
              <h2 className="text-sm font-medium text-zinc-900 mb-3">
                Projects
              </h2>
              <div className="space-y-2">
                {memberships.map((m: any) => (
                  <div
                    key={`${m.projectId}-${m.roleTitle}`}
                    className="flex items-center gap-3 rounded-lg bg-zinc-50 px-3 py-2 text-sm"
                  >
                    <Briefcase className="h-4 w-4 text-zinc-400" />
                    <span className="font-medium text-zinc-700">
                      {m.project.name}
                    </span>
                    <span className="text-zinc-400">{m.roleTitle}</span>
                    {m.isFounder && (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-[#1e40af]">
                        Founder
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isOwnProfile && (
            <div className="mt-6 border-t border-zinc-100 pt-6">
              <h2 className="text-sm font-medium text-zinc-900 mb-3">My Events</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-semibold text-zinc-700">Events I Created</h3>
                  <div className="mt-2 space-y-2">
                    {createdEvents.length === 0 && <div className="text-sm text-zinc-400">No events created yet</div>}
                    {createdEvents.map((e:any) => (
                      <div key={e.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                        <div>
                          <div className="font-medium">{e.title}</div>
                          <div className="text-xs text-zinc-500">{new Date(e.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a href={`/events/${e.id}/edit`} className="text-sm text-zinc-600">Edit</a>
                          <button onClick={async ()=>{ if(!confirm('Delete event?')) return; const res=await fetch(`/api/events/${e.id}`,{method:'DELETE'}); if(res.ok) location.reload(); }} className="text-sm text-[#1e40af]">Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-zinc-700">Events I'm Attending</h3>
                  <div className="mt-2 space-y-2">
                    {attendingEvents.length === 0 && <div className="text-sm text-zinc-400">No upcoming registrations</div>}
                    {attendingEvents.map((a:any) => {
                      const intent = JSON.parse(a.intention || "{}");
                      return (
                        <div key={a.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                          <div>
                            <div className="font-medium">{a.event?.title}</div>
                            <div className="text-xs text-zinc-500">{new Date(a.event?.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} • {intent.regType}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm text-zinc-600">{intent.status || 'Pending'}</div>
                            <button onClick={async ()=>{ if(!confirm('Cancel registration?')) return; await fetch(`/api/events/${a.eventId}/registrations`,{method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ attendeeId: a.id, action: 'remove' })}); location.reload(); }} className="text-sm text-[#1e40af]">Cancel</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showReport && (
        <ReportModal
          targetId={user.id}
          targetType="USER"
          onClose={() => setShowReport(false)}
        />
      )}

      {showBlockConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-xl">
            <Ban className="mx-auto h-10 w-10 text-blue-200" />
            <h3 className="mt-3 text-lg font-semibold text-zinc-900">
              {isBlocked ? "Unblock user?" : "Block user?"}
            </h3>
            <p className="mt-1 text-sm text-zinc-500">
              {isBlocked
                ? "They will be able to see your profile and send messages again."
                : "They won't be able to message you or interact with your content."}
            </p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setShowBlockConfirm(false)}
                className="flex-1 rounded-md border border-zinc-300 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBlock}
                className="flex-1 rounded-md bg-[#1e40af] py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] transition-colors"
              >
                {isBlocked ? "Unblock" : "Block"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
