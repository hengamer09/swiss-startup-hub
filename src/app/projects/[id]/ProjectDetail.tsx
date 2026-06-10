"use client";

import {
  MapPin,
  Users,
  MessageSquare,
  Star,
  ChevronDown,
  ChevronRight,
  Settings,
} from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { cn, formatStage } from "@/lib/utils";
import RateUserModal from "@/components/projects/RateUserModal";

export default function ProjectDetail({
  project,
  userId,
}: {
  project: any;
  userId: string | null;
}) {
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

  useEffect(() => {
    if (!toast.open) return;

    const timer = window.setTimeout(() => {
      setToast((current) => ({ ...current, open: false }));
    }, 3000);

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
      setPosts((prev) => [post, ...prev]);
      setPostDraft("");
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="rounded-xl border border-zinc-200 bg-white">
        <div className="p-6 sm:p-8">
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
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
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
                  "rounded-full border px-4 py-1.5 text-xs font-medium transition-colors",
                  followed
                    ? "border-red-500 bg-red-50 text-red-600"
                    : "border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                )}
              >
                {followed ? "Following" : "Follow"}
              </button>
              {userId && project.owner.id === userId && (
                <Link
                  href={`/projects/${project.id}/edit`}
                  className="inline-flex items-center justify-center gap-1 rounded-full border border-zinc-300 px-4 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  <Settings className="h-3 w-3" /> Edit
                </Link>
              )}
              {userId && (
                <>
                  <button
                    onClick={() => setShowJoinModal(true)}
                    className="rounded-full bg-red-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-red-600 transition-colors"
                  >
                    Request to Join
                  </button>
                  <button
                    onClick={() => setShowAskModal(true)}
                    className="text-xs text-zinc-500 hover:text-zinc-700 transition-colors"
                  >
                    Message Founder
                  </button>
                </>
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

          <div className="mt-6 border-t border-zinc-100 pt-6 space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 mb-1">
                The Problem
              </h2>
              <p className="text-sm text-zinc-600">{project.problem}</p>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 mb-1">
                The Solution
              </h2>
              <p className="text-sm text-zinc-600">{project.solution}</p>
            </div>
          </div>

          <div className="mt-6 border-t border-zinc-100 pt-6 space-y-6">
            <section className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-900">Public Chat / Discussion Board</h2>
                  <p className="text-xs text-zinc-500">Visible to everyone. Only signed-in users can post.</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">Live discussion</span>
              </div>

              {userId ? (
                <form onSubmit={handlePostSubmit} className="mb-4 space-y-2 rounded-xl border border-zinc-200 bg-white p-3">
                  <textarea
                    value={postDraft}
                    onChange={(e) => setPostDraft(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="Share an update, ask a question, or welcome the team..."
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-zinc-400">{postDraft.length}/500</p>
                    <button
                      type="submit"
                      disabled={posting || !postDraft.trim()}
                      className="rounded-full bg-red-500 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {posting ? "Posting..." : "Post update"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mb-4 rounded-xl border border-dashed border-zinc-300 bg-white p-3 text-sm text-zinc-500">
                  Sign in to post on the project discussion board.
                </div>
              )}

              <div className="space-y-3">
                {posts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-200 bg-white p-4 text-sm text-zinc-500">No discussion posts yet. Be the first to start the conversation.</div>
                ) : (
                  posts.map((post: any) => (
                    <article key={post.id} className="rounded-xl border border-zinc-200 bg-white p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-700 overflow-hidden">
                          {post.author?.image ? (
                            <img src={post.author.image} alt={post.author.name || "User"} className="h-full w-full object-cover" />
                          ) : (
                            (post.author?.name || "U").charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-zinc-900">{post.author?.name || "Anonymous"}</span>
                            <span className="text-xs text-zinc-400">{new Date(post.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="mt-1 text-sm text-zinc-600 whitespace-pre-wrap">{post.content}</p>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-xl border border-zinc-200 bg-white p-4">
              <div className="mb-2">
                <h2 className="text-sm font-semibold text-zinc-900">Private Chat</h2>
                <p className="text-xs text-zinc-500">Use the founder message option to open a private conversation in your inbox.</p>
              </div>
              <button
                onClick={() => setShowAskModal(true)}
                className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors"
              >
                Message Founder
              </button>
            </section>
          </div>

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
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-400">
                          {m.roleTitle}
                        </span>
                        {m.isFounder && (
                          <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600">
                            Founder
                          </span>
                        )}
                        {m.user.identityVerified && (
                          <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-600">
                            Verified
                          </span>
                        )}
                      </div>
                    </div>
                    {userId && m.user.id !== userId && (
                      <button
                        onClick={() =>
                          setShowRateModal({ id: m.user.id, name: m.user.name })
                        }
                        className="rounded-full border border-amber-200 px-3 py-1 text-xs text-amber-600 hover:bg-amber-50 transition-colors"
                      >
                        Rate
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {project.openRoles?.length > 0 && (
            <div className="mt-6 border-t border-zinc-100 pt-6">
              <h2 className="text-sm font-semibold text-zinc-900 mb-3">
                Open Roles
              </h2>
              <div className="space-y-2">
                {project.openRoles.map((role: any) => (
                  <div
                    key={role.id}
                    className="rounded-lg border border-zinc-200 p-3 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-zinc-900">
                        {role.title}
                      </span>
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
                        {role.commitment}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      {role.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

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

      {showJoinModal && (
        <JoinModal
          projectId={project.id}
          onClose={() => setShowJoinModal(false)}
          onSuccess={() => {
            setShowJoinModal(false);
            setToast({
              open: true,
              message: "Request sent successfully!",
              tone: "success",
            });
          }}
          onError={() => {
            setToast({
              open: true,
              message: "Something went wrong. Please try again.",
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
  onClose,
  onSuccess,
  onError,
}: {
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
  onError: () => void;
}) {
  const [motivation, setMotivation] = useState("");
  const [experience, setExperience] = useState("");
  const [availability, setAvailability] = useState("FLEXIBLE");
  const [links, setLinks] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/join-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, motivation, experience, availability, links }),
      });
      if (res.ok) {
        onSuccess();
        return;
      }

      onError();
    } catch {
      onError();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6">
        <h3 className="text-lg font-semibold text-zinc-900">Request to Join</h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Why are you interested? <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              maxLength={500}
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              What skills do you bring? <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              maxLength={500}
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Availability <span className="text-red-500">*</span>
            </label>
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            >
              <option value="FULL_TIME">Full-time</option>
              <option value="PART_TIME">Part-time</option>
              <option value="ADVISORY">Advisory</option>
              <option value="FLEXIBLE">Flexible</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Links (portfolio, GitHub, LinkedIn)
            </label>
            <input
              type="text"
              value={links}
              onChange={(e) => setLinks(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              placeholder="Optional"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-full bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {loading ? "Sending..." : "Send Join Request"}
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
          <h3 className="mt-3 text-lg font-semibold text-zinc-900">
            Message sent!
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            The founder will get back to you.
          </p>
          <button
            onClick={onClose}
            className="mt-4 rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
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
        <h3 className="text-lg font-semibold text-zinc-900">
          Ask the Founder
        </h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Your question
            </label>
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
              className="flex-1 rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="flex-1 rounded-full bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {loading ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
