"use client";

import {
  MapPin,
  Users,
  MessageSquare,
  Star,
  ChevronDown,
  ChevronRight,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn, formatStage, parseRolesNeeded } from "@/lib/utils";
import RateUserModal from "@/components/projects/RateUserModal";

export default function ProjectDetail({
  project,
  pendingRequests: initialPendingRequests,
  myRequest,
  userId,
  userName,
}: {
  project: any;
  pendingRequests: any[];
  myRequest: { id: string; status: string } | null;
  userId: string | null;
  userName?: string | null;
}) {
  const isOwner = userId === project.owner?.id;
  const isMember = project.members?.some((m: any) => m.user.id === userId);

  const [followed, setFollowed] = useState(false);
  const [followerCount, setFollowerCount] = useState(project._count?.followers || 0);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showAskModal, setShowAskModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState<{ id: string; name: string } | null>(null);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [postDraft, setPostDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    tone: "success" | "error";
  }>({ open: false, message: "", tone: "success" });

  // Join request state
  const [myRequestStatus, setMyRequestStatus] = useState<string | null>(myRequest?.status || null);
  const [pendingRequests, setPendingRequests] = useState<any[]>(initialPendingRequests || []);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!toast.open) return;
    const timer = window.setTimeout(() => {
      setToast((current) => ({ ...current, open: false }));
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [toast.open]);

  useEffect(() => {
    async function loadPosts() {
      const res = await fetch(`/api/projects/${project.id}/posts`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    }
    loadPosts();
  }, [project.id]);

  async function handlePostSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !postDraft.trim()) return;

    setPosting(true);
    const res = await fetch(`/api/projects/${project.id}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: postDraft.trim() }),
    });

    if (res.ok) {
      const post = await res.json();
      setPosts((prev) => [...prev, post]);
      setPostDraft("");
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
    setPosting(false);
  }

  async function handleFollow() {
    if (!userId) return;
    const res = await fetch(`/api/projects/${project.id}/follow`, {
      method: "POST",
    });
    if (res.ok) {
      setFollowed(!followed);
      setFollowerCount((c: number) => c + (followed ? -1 : 1));
    }
  }

  async function handleDecision(requestId: string, status: "APPROVED" | "REJECTED") {
    const reply = replies[requestId]?.trim();
    if (!reply) {
      setToast({
        open: true,
        message: status === "APPROVED"
          ? "Please enter the role title before accepting."
          : "Please enter a reason before declining.",
        tone: "error",
      });
      return;
    }

    setProcessingId(requestId);
    try {
      const res = await fetch(`/api/join-requests/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reply }),
      });

      if (res.ok) {
        setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
        setToast({
          open: true,
          message: status === "APPROVED"
            ? "Applicant accepted and added to the team!"
            : "Request declined.",
          tone: "success",
        });
      } else {
        const data = await res.json();
        setToast({
          open: true,
          message: data.error || "Something went wrong. Please try again.",
          tone: "error",
        });
      }
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="rounded-xl border border-zinc-200 bg-white">
        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-100 text-xl font-bold text-zinc-600 shrink-0">
                {project.name?.charAt(0) || "P"}
              </div>
              <div>
                <h1 className="text-xl font-semibold text-zinc-900">
                  {project.name}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                    {project.industry}
                  </span>
                  <span className="rounded bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                    {formatStage(project.stage)}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-zinc-400">
                    <MapPin className="h-3 w-3" />
                    {project.location}
                    {project.isRemote && " / Remote"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleFollow}
                disabled={!userId}
                className={cn(
                  "rounded-md border px-4 py-1.5 text-xs font-medium transition-colors",
                  followed
                    ? "border-red-500 bg-red-50 text-red-600"
                    : "border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                )}
              >
                {followed ? "Following" : "Follow"}
              </button>

              {isOwner && (
                <Link
                  href={`/projects/${project.id}/edit`}
                  className="inline-flex items-center justify-center gap-1 rounded-md border border-zinc-300 px-4 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  <Settings className="h-3 w-3" /> Edit
                </Link>
              )}

              {/* Join button — hidden for owner and existing members */}
              {userId && !isOwner && !isMember && (
                myRequestStatus === "APPROVED" ? (
                  <button
                    disabled
                    className="flex items-center gap-1.5 rounded-md border border-green-300 bg-green-50 px-4 py-1.5 text-xs font-medium text-green-600 cursor-not-allowed"
                  >
                    <CheckCircle className="h-3 w-3" />
                    Joined ✓
                  </button>
                ) : myRequestStatus === "PENDING" ? (
                  <button
                    disabled
                    className="flex items-center gap-1.5 rounded-md border border-zinc-300 bg-zinc-50 px-4 py-1.5 text-xs font-medium text-zinc-400 cursor-not-allowed"
                  >
                    <Clock className="h-3 w-3" />
                    Request pending
                  </button>
                ) : (
                  <button
                    onClick={() => setShowJoinModal(true)}
                    className="rounded-md bg-red-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors"
                  >
                    Request to Join
                  </button>
                )
              )}

              {userId && (
                <button
                  onClick={() => setShowAskModal(true)}
                  className="text-xs text-zinc-500 hover:text-zinc-700 transition-colors"
                >
                  Message Founder
                </button>
              )}

              {!userId && (
                <Link
                  href="/auth/signin"
                  className="text-xs text-red-500 hover:text-red-600 text-center"
                >
                  Sign in to interact
                </Link>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4 text-sm text-zinc-500">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {project.teamSize} members
            </span>
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4" />
              {followerCount} followers
            </span>
          </div>

          {/* Problem / Solution / Roles */}
          <div className="mt-6 border-t border-zinc-100 pt-6 space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 mb-1">The Problem</h2>
              <p className="text-sm text-zinc-600">{project.problem}</p>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 mb-1">The Solution</h2>
              <p className="text-sm text-zinc-600">{project.solution}</p>
            </div>
            {(() => {
              const roles = parseRolesNeeded(project.rolesNeeded);
              if (roles.length === 0) return null;
              return (
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                  <h2 className="text-sm font-semibold text-zinc-900 mb-3">
                    Who We&apos;re Looking For
                  </h2>
                  <div className="space-y-3">
                    {roles.map((r, i) => (
                      <div key={i} className="rounded-lg border border-zinc-200 bg-white p-3">
                        <p className="text-sm font-semibold text-zinc-900">{r.title}</p>
                        {r.description && (
                          <p className="mt-1 text-sm text-zinc-600">{r.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Pending Requests — founder only */}
          {isOwner && pendingRequests.length > 0 && (
            <div className="mt-6 border-t border-zinc-100 pt-6">
              <h2 className="mb-3 text-sm font-semibold text-zinc-900 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 text-xs font-bold text-zinc-700">
                  {pendingRequests.length}
                </span>
                Pending Join Requests
              </h2>
              <div className="space-y-4">
                {pendingRequests.map((req: any) => (
                  <div
                    key={req.id}
                    className="rounded-lg border border-zinc-200 bg-zinc-50 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-sm font-bold text-zinc-600">
                        {req.user?.name?.charAt(0) || "?"}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <Link
                          href={`/profile/${req.user?.id}`}
                          className="font-medium text-zinc-900 hover:text-red-500 transition-colors"
                        >
                          {req.user?.name}
                        </Link>
                        {req.applicantRole && (
                          <p className="text-xs font-medium text-zinc-500">
                            {req.applicantRole}
                          </p>
                        )}
                        <p className="text-sm text-zinc-600 whitespace-pre-wrap">
                          {req.motivation}
                        </p>
                        {req.links && (
                          <a
                            href={req.links}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-red-500 underline"
                          >
                            {req.links}
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="mt-3">
                      <input
                        type="text"
                        value={replies[req.id] || ""}
                        onChange={(e) =>
                          setReplies((prev) => ({ ...prev, [req.id]: e.target.value }))
                        }
                        placeholder="Role title (to accept) or reason for declining — required"
                        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                      />
                    </div>

                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => handleDecision(req.id, "APPROVED")}
                        disabled={processingId === req.id}
                        className="flex items-center gap-1.5 rounded-md bg-red-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleDecision(req.id, "REJECTED")}
                        disabled={processingId === req.id}
                        className="flex items-center gap-1.5 rounded-md border border-zinc-300 px-4 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 transition-colors"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Discussion Board */}
          <div className="mt-6 border-t border-zinc-100 pt-6 space-y-6">
            <section id="discussion" className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="mb-3">
                <h2 className="text-sm font-semibold text-zinc-900">Public Chat / Discussion Board</h2>
                <p className="text-xs text-zinc-500">Visible to everyone. Only signed-in users can post.</p>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto mb-3" id="chat-container">
                {posts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-200 bg-white p-4 text-sm text-zinc-500">
                    No discussion posts yet. Be the first to start the conversation.
                  </div>
                ) : (
                  posts.map((post: any) => {
                    const isOwner = post.author?.id === project.owner?.id;
                    const isMe = post.author?.id === userId && !isOwner;
                    const onRight = isOwner;
                    const redBubble = isMe;
                    return (
                      <div key={post.id} className={cn("flex gap-2", onRight ? "justify-end" : "justify-start")}>
                        {!onRight && (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-600 self-end">
                            {(post.author?.name || "U").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className={cn("max-w-[75%] flex flex-col", onRight ? "items-end" : "items-start")}>
                          <p className="mb-0.5 text-xs font-semibold text-zinc-600">{post.author?.name || "Anonymous"}</p>
                          <div className={cn("rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                            redBubble
                              ? "bg-red-600 text-white rounded-bl-md"
                              : onRight
                              ? "bg-zinc-100 text-zinc-800 rounded-br-md"
                              : "bg-zinc-100 text-zinc-800 rounded-bl-md"
                          )}>
                            <p className="whitespace-pre-wrap">{post.content}</p>
                            <p className={cn("mt-1 text-xs text-right", redBubble ? "text-red-200" : "text-zinc-400")}>
                              {new Date(post.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatBottomRef} />
              </div>

              {userId ? (
                <form onSubmit={handlePostSubmit} className="space-y-2 rounded-xl border border-zinc-200 bg-white p-3">
                  <textarea
                    value={postDraft}
                    onChange={(e) => setPostDraft(e.target.value)}
                    rows={2}
                    maxLength={500}
                    placeholder="Share an update, ask a question, or welcome the team..."
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-zinc-400">{postDraft.length}/500</p>
                    <button
                      type="submit"
                      disabled={posting || !postDraft.trim()}
                      className="rounded-md bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {posting ? "Sending..." : "Send"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-3 text-sm text-zinc-500">
                  Sign in to post on the project discussion board.
                </div>
              )}
            </section>

            <section className="rounded-xl border border-zinc-200 bg-white p-4">
              <div className="mb-2">
                <h2 className="text-sm font-semibold text-zinc-900">Private Chat</h2>
                <p className="text-xs text-zinc-500">
                  Use the founder message option to open a private conversation in your inbox.
                </p>
              </div>
              <button
                onClick={() => setShowAskModal(true)}
                className="rounded-md bg-zinc-900 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800 transition-colors"
              >
                Message Founder
              </button>
            </section>
          </div>

          {/* Team — only accepted members (ProjectMember records) */}
          {project.members?.length > 0 && (
            <div className="mt-6 border-t border-zinc-100 pt-6">
              <h2 className="text-sm font-semibold text-zinc-900 mb-3">Team</h2>
              <div className="space-y-2">
                {project.members.map((m: any) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 rounded-lg bg-zinc-50 px-3 py-2 text-sm"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-600">
                      {m.user.name?.charAt(0) || "U"}
                    </div>
                    <div className="flex-1">
                      <Link
                        href={`/profile/${m.user.id}`}
                        className="font-medium text-zinc-700 hover:text-red-500 transition-colors"
                      >
                        {m.user.name}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-zinc-500">{m.roleTitle}</span>
                        {m.user.identityVerified && (
                          <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                            Verified
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Open Roles */}
          {project.openRoles?.length > 0 && (
            <div className="mt-6 border-t border-zinc-100 pt-6">
              <h2 className="text-sm font-semibold text-zinc-900 mb-3">Open Roles</h2>
              <div className="space-y-2">
                {project.openRoles.map((role: any) => (
                  <div
                    key={role.id}
                    className="rounded-lg border border-zinc-200 p-3 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-zinc-900">{role.title}</span>
                      <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                        {role.commitment}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">{role.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQ */}
          {project.faqs?.length > 0 && (
            <div className="mt-6 border-t border-zinc-100 pt-6">
              <h2 className="text-sm font-semibold text-zinc-900 mb-3">FAQ</h2>
              <div className="space-y-1">
                {project.faqs.map((faq: any) => (
                  <div key={faq.id} className="border-b border-zinc-100 pb-1">
                    <button
                      onClick={() =>
                        setOpenFaq(openFaq === faq.id ? null : faq.id)
                      }
                      className="flex w-full items-center justify-between py-2 text-sm text-zinc-700 hover:text-zinc-900"
                    >
                      {faq.question}
                      {openFaq === faq.id ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    {openFaq === faq.id && (
                      <p className="pb-2 text-sm text-zinc-500">{faq.answer}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast.open && (
        <div
          className={cn(
            "fixed bottom-4 right-4 z-[60] rounded-xl border px-4 py-3 text-sm shadow-lg",
            toast.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          )}
        >
          {toast.message}
        </div>
      )}

      {/* Modals */}
      {showJoinModal && (
        <JoinModal
          projectId={project.id}
          projectName={project.name}
          userName={userName}
          onClose={() => setShowJoinModal(false)}
          onSuccess={() => {
            setShowJoinModal(false);
            setMyRequestStatus("PENDING");
            setToast({
              open: true,
              message: "Your request has been sent!",
              tone: "success",
            });
          }}
          onError={(msg) => {
            setShowJoinModal(false);
            setToast({
              open: true,
              message: msg || "Something went wrong. Please try again.",
              tone: "error",
            });
          }}
        />
      )}

      {showAskModal && (
        <AskModal
          projectId={project.id}
          founderId={project.owner.id}
          onClose={() => setShowAskModal(false)}
        />
      )}

      {showRateModal && (
        <RateUserModal
          toUserId={showRateModal.id}
          toUserName={showRateModal.name}
          projectId={project.id}
          projectName={project.name}
          onClose={() => setShowRateModal(null)}
          onDone={() => setShowRateModal(null)}
        />
      )}
    </div>
  );
}

function JoinModal({
  projectId,
  projectName,
  userName,
  onClose,
  onSuccess,
  onError,
}: {
  projectId: string;
  projectName: string;
  userName?: string | null;
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg?: string) => void;
}) {
  const [applicantRole, setApplicantRole] = useState("");
  const [message, setMessage] = useState("");
  const [links, setLinks] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!applicantRole.trim()) newErrors.applicantRole = "Your role is required";
    if (!message.trim()) newErrors.message = "A message is required";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/join-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          motivation: message.trim(),
          applicantRole: applicantRole.trim(),
          links: links.trim() || null,
          experience: "",
          availability: "FLEXIBLE",
        }),
      });
      if (res.ok) {
        onSuccess();
        return;
      }
      const data = await res.json().catch(() => ({}));
      onError(data.error);
    } catch {
      onError();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-zinc-900">
          Request to Join {projectName}
        </h3>

        {userName && (
          <p className="mt-1 text-sm text-zinc-500">
            Applying as <span className="font-medium text-zinc-700">{userName}</span>
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Your role / what you do <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={100}
              value={applicantRole}
              onChange={(e) => {
                setApplicantRole(e.target.value);
                if (errors.applicantRole) setErrors((prev) => ({ ...prev, applicantRole: "" }));
              }}
              className={cn(
                "mt-1 block w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1",
                errors.applicantRole
                  ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                  : "border-zinc-300 focus:border-red-500 focus:ring-red-500"
              )}
              placeholder="e.g. Frontend Developer, Marketing, Investor…"
            />
            {errors.applicantRole && (
              <p className="mt-1 text-xs text-red-600">{errors.applicantRole}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Why you want to join & what you bring <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              maxLength={1000}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (errors.message) setErrors((prev) => ({ ...prev, message: "" }));
              }}
              rows={5}
              className={cn(
                "mt-1 block w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1",
                errors.message
                  ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                  : "border-zinc-300 focus:border-red-500 focus:ring-red-500"
              )}
              placeholder="Tell the founder about yourself, your experience, and why you want to join this project…"
            />
            <div className="mt-1 flex items-center justify-between">
              {errors.message ? (
                <p className="text-xs text-red-600">{errors.message}</p>
              ) : (
                <span />
              )}
              <p className="text-xs text-zinc-400">{message.length}/1000</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Portfolio or LinkedIn URL{" "}
              <span className="text-zinc-400 font-normal">(optional)</span>
            </label>
            <input
              type="url"
              maxLength={300}
              value={links}
              onChange={(e) => setLinks(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              placeholder="https://linkedin.com/in/yourname"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Sending…" : "Send Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AskModal({
  projectId: _projectId,
  founderId: _founderId,
  onClose,
}: {
  projectId: string;
  founderId: string;
  onClose: () => void;
}) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        receiverId: _founderId,
        content: content.trim(),
        projectId: _projectId,
      }),
    });
    if (res.ok) setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-6 text-center">
          <MessageSquare className="mx-auto h-10 w-10 text-green-500" />
          <h3 className="mt-3 text-lg font-semibold text-zinc-900">Message sent!</h3>
          <p className="mt-1 text-sm text-zinc-500">The founder will get back to you.</p>
          <button
            onClick={onClose}
            className="mt-4 rounded-md bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6">
        <h3 className="text-lg font-semibold text-zinc-900">Ask the Founder</h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700">Your question</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={300}
              rows={3}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              placeholder="Ask anything about the project..."
            />
            <p className="mt-1 text-xs text-zinc-400">{content.length}/300</p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
