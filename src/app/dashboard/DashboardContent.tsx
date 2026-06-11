"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { cn, parseRoles } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Activity,
  UserPlus,
  TrendingUp,
  FolderHeart,
  Calendar,
  Pencil,
} from "lucide-react";

// Convert ISO date string to datetime-local input value (local time)
function toDatetimeLocal(isoString: string): string {
  const d = new Date(isoString);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type Tab = "overview" | "applications" | "followers" | "analytics" | "watchlist";

export default function DashboardContent({ data }: { data: any }) {
  const { user, followedProjects, myJoinRequests, hostedEvents } = data;
  const projects = user?.ownedProjects || [];
  const roles = parseRoles(user?.roles || "[]");
  const isInvestor = roles.includes("INVESTOR");
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [applicationReplies, setApplicationReplies] = useState<Record<string, string>>({});
  const [applicationErrors, setApplicationErrors] = useState<Record<string, string>>({});

  // State for the hosted-event edit modal
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [editSaving, setEditSaving] = useState(false);

  function openEditEvent(event: any) {
    setEditingEvent(event);
    setEditForm({
      title: event.title,
      description: event.description,
      date: toDatetimeLocal(event.date),
      location: event.location,
      eventType: event.eventType,
      maxAttendees: event.maxAttendees ?? "",
      requireApproval: event.requireApproval ?? false,
      locationScope: event.locationScope ?? "",
    });
  }

  async function handleEditEvent() {
    if (!editingEvent || editSaving) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/events/${editingEvent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          date: new Date(editForm.date).toISOString(),
          maxAttendees: editForm.maxAttendees !== "" ? Number(editForm.maxAttendees) : null,
        }),
      });
      if (res.ok) {
        setEditingEvent(null);
        window.location.reload();
      }
    } finally {
      setEditSaving(false);
    }
  }

  const handleJoinRequest = useCallback(
    async (requestId: string, status: "APPROVED" | "REJECTED") => {
      const reply = applicationReplies[requestId]?.trim();
      if (!reply) {
        setApplicationErrors((prev) => ({
          ...prev,
          [requestId]:
            status === "APPROVED"
              ? "Enter the role title before accepting."
              : "Enter a reason before declining.",
        }));
        return;
      }
      setApplicationErrors((prev) => ({ ...prev, [requestId]: "" }));
      setUpdatingId(requestId);
      try {
        const res = await fetch(`/api/join-requests/${requestId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, reply }),
        });
        if (res.ok) {
          window.location.reload();
        }
      } finally {
        setUpdatingId(null);
      }
    },
    [applicationReplies]
  );

  const handleRemoveFollower = useCallback(
    async (projectId: string, followerId: string) => {
      const res = await fetch(
        `/api/projects/${projectId}/followers/${followerId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        window.location.reload();
      }
    },
    []
  );

  const tabs: { key: Tab; label: string; icon: React.ReactNode; show: boolean }[] = [
    { key: "overview", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" />, show: true },
    { key: "applications", label: "Applications", icon: <Mail className="h-4 w-4" />, show: projects.length > 0 },
    { key: "followers", label: "Followers", icon: <Users className="h-4 w-4" />, show: projects.length > 0 },
    { key: "analytics", label: "Analytics", icon: <TrendingUp className="h-4 w-4" />, show: projects.length > 0 },
    { key: "watchlist", label: "Watchlist", icon: <Eye className="h-4 w-4" />, show: isInvestor },
  ];

  const visibleTabs = tabs.filter((t) => t.show);

  const totalFollowers = projects.reduce(
    (sum: number, p: any) => sum + (p._count?.followers || 0),
    0
  );
  const totalApplications = projects.reduce(
    (sum: number, p: any) => sum + (p._count?.joinRequests || 0),
    0
  );
  const pendingApplications = projects.reduce(
    (sum: number, p: any) =>
      sum + (p.joinRequests?.filter((r: any) => r.status === "PENDING").length || 0),
    0
  );
  const totalMembers = projects.reduce(
    (sum: number, p: any) => sum + (p._count?.members || 0),
    0
  );

  const myPendingRequests = myJoinRequests?.filter((r: any) => r.status === "PENDING") || [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Dashboard</h1>
        <p className="text-sm text-zinc-500">
          Manage your projects, applications, and activity
        </p>
      </div>

      {myPendingRequests.length > 0 && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs text-amber-700 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            You have <strong>{myPendingRequests.length}</strong> pending application
            {myPendingRequests.length > 1 ? "s" : ""} &mdash;
            {myPendingRequests.map((r: any) => (
              <Link
                key={r.id}
                href={`/projects/${r.project.id}`}
                className="underline font-medium"
              >
                {r.project.name}
              </Link>
            ))}
          </p>
        </div>
      )}

      <div className="mb-6 flex gap-1 rounded-lg bg-zinc-100 p-1 text-sm">
        {visibleTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors",
              activeTab === tab.key
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stats cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                <FolderHeart className="h-3.5 w-3.5" />
                Projects
              </div>
              <p className="text-2xl font-bold text-zinc-900">{projects.length}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                <Users className="h-3.5 w-3.5" />
                Followers
              </div>
              <p className="text-2xl font-bold text-zinc-900">{totalFollowers}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                <Mail className="h-3.5 w-3.5" />
                Applications
              </div>
              <p className="text-2xl font-bold text-zinc-900">{totalApplications}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                <UserPlus className="h-3.5 w-3.5" />
                Members
              </div>
              <p className="text-2xl font-bold text-zinc-900">{totalMembers}</p>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 py-16 text-center">
              <LayoutDashboard className="mb-3 h-10 w-10 text-zinc-300" />
              <h2 className="text-lg font-medium text-zinc-700">No projects yet</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Create your first project to start receiving applications.
              </p>
              <Link
                href="/projects/new"
                className="mt-4 rounded-full bg-red-500 px-5 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
              >
                Create Project
              </Link>
            </div>
          ) : (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-zinc-700">
                Your Projects
              </h2>
              <div className="space-y-3">
                {projects.map((project: any) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="block rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:shadow-md"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-zinc-900">
                          {project.name}
                        </h3>
                        <p className="text-sm text-zinc-500">
                          {project.stage} &middot; {project.location}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {project._count?.followers || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          {project._count?.joinRequests || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <UserPlus className="h-3.5 w-3.5" />
                          {project._count?.members || 0}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Link
                        href={`/projects/${project.id}/edit`}
                        className="rounded-lg border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Edit
                      </Link>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Your Hosted Events section */}
          <div>
            <h2 className="mb-3 text-sm font-semibold text-zinc-700 flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-zinc-400" />
              Your Hosted Events
            </h2>
            {!hostedEvents || hostedEvents.length === 0 ? (
              <p className="text-sm text-zinc-500 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 py-6 text-center">
                You are not hosting any events yet.
              </p>
            ) : (
              <div className="space-y-3">
                {hostedEvents.map((event: any) => (
                  <div
                    key={event.id}
                    className="rounded-xl border border-zinc-200 bg-white p-4 flex items-start justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-900 truncate">{event.title}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {new Date(event.date).toLocaleDateString("en-CH", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        &middot; {event.location}
                      </p>
                      <p className="mt-1 text-xs text-zinc-400 line-clamp-2">{event.description}</p>
                    </div>
                    <button
                      onClick={() => openEditEvent(event)}
                      className="shrink-0 flex items-center gap-1 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {isInvestor && followedProjects?.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-zinc-700">
                Recently Watched
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {followedProjects.slice(0, 6).map((fp: any) => (
                  <Link
                    key={fp.id}
                    href={`/projects/${fp.project.id}`}
                    className="rounded-xl border border-zinc-200 bg-white p-3 transition-all hover:shadow-md"
                  >
                    <p className="text-sm font-semibold text-zinc-900 truncate">
                      {fp.project.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {fp.project.industry} &middot; {fp.project.stage}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "applications" && (
        <div className="space-y-4">
          {projects.map((project: any) => {
            const pending = project.joinRequests?.filter(
              (r: any) => r.status === "PENDING"
            );
            if (!pending || pending.length === 0) return null;

            return (
              <div key={project.id} className="rounded-xl border border-zinc-200 bg-white p-5">
                <h3 className="mb-3 font-semibold text-zinc-900">
                  {project.name}
                </h3>
                <div className="space-y-3">
                  {pending.map((req: any) => (
                    <div
                      key={req.id}
                      className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-sm font-bold text-zinc-600">
                          {req.user?.name?.charAt(0) || "?"}
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-zinc-900 truncate">
                              {req.user?.name}
                            </p>
                            <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                              Pending
                            </span>
                          </div>
                          {req.applicantRole && (
                            <p className="text-xs font-medium text-zinc-500">
                              {req.applicantRole}
                            </p>
                          )}
                          {req.motivation && (
                            <p className="text-xs text-zinc-600 italic line-clamp-3">
                              &ldquo;{req.motivation}&rdquo;
                            </p>
                          )}
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

                      <div>
                        <input
                          type="text"
                          value={applicationReplies[req.id] || ""}
                          onChange={(e) => {
                            setApplicationReplies((prev) => ({
                              ...prev,
                              [req.id]: e.target.value,
                            }));
                            if (applicationErrors[req.id]) {
                              setApplicationErrors((prev) => ({
                                ...prev,
                                [req.id]: "",
                              }));
                            }
                          }}
                          placeholder="Role title (to accept) or reason for declining — required"
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                        {applicationErrors[req.id] && (
                          <p className="mt-1 text-xs text-red-600">
                            {applicationErrors[req.id]}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleJoinRequest(req.id, "APPROVED")}
                          disabled={updatingId === req.id}
                          className="flex items-center gap-1 rounded-full bg-green-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-green-600 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Accept
                        </button>
                        <button
                          onClick={() => handleJoinRequest(req.id, "REJECTED")}
                          disabled={updatingId === req.id}
                          className="flex items-center gap-1 rounded-full border border-zinc-300 bg-white px-4 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {projects.every(
            (p: any) =>
              !p.joinRequests?.some((r: any) => r.status === "PENDING")
          ) && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 py-12 text-center">
              <Mail className="mb-2 h-8 w-8 text-zinc-300" />
              <p className="text-sm text-zinc-500">No pending applications</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "followers" && (
        <div className="space-y-4">
          {projects.map((project: any) => {
            const f = project.followers || [];
            if (f.length === 0) return null;

            return (
              <div key={project.id} className="rounded-xl border border-zinc-200 bg-white p-5">
                <h3 className="mb-3 font-semibold text-zinc-900">
                  {project.name}
                </h3>
                <div className="space-y-2">
                  {f.map((fol: any) => (
                    <div
                      key={fol.id}
                      className="flex items-center justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-2"
                    >
                      <Link
                        href={`/profile/${fol.user.id}`}
                        className="flex items-center gap-3 min-w-0"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-bold text-zinc-600">
                          {fol.user?.name?.charAt(0) || "?"}
                        </div>
                        <span className="text-sm text-zinc-700 truncate">
                          {fol.user?.name}
                        </span>
                      </Link>
                      <button
                        onClick={() => handleRemoveFollower(project.id, fol.userId)}
                        className="text-xs text-zinc-400 hover:text-red-500 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {projects.every((p: any) => (p.followers || []).length === 0) && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 py-12 text-center">
              <Users className="mb-2 h-8 w-8 text-zinc-300" />
              <p className="text-sm text-zinc-500">No followers yet</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <div className="flex items-center gap-1.5 text-zinc-400 text-xs mb-1">
                <Activity className="h-3.5 w-3.5" />
                Pending Apps
              </div>
              <p className="text-2xl font-bold text-zinc-900">
                {pendingApplications}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <div className="flex items-center gap-1.5 text-zinc-400 text-xs mb-1">
                <CheckCircle className="h-3.5 w-3.5" />
                Approved
              </div>
              <p className="text-2xl font-bold text-zinc-900">
                {totalApplications - pendingApplications}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <div className="flex items-center gap-1.5 text-zinc-400 text-xs mb-1">
                <Users className="h-3.5 w-3.5" />
                Total Followers
              </div>
              <p className="text-2xl font-bold text-zinc-900">{totalFollowers}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <div className="flex items-center gap-1.5 text-zinc-400 text-xs mb-1">
                <UserPlus className="h-3.5 w-3.5" />
                Team Size
              </div>
              <p className="text-2xl font-bold text-zinc-900">{totalMembers}</p>
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h3 className="mb-2 text-sm font-semibold text-zinc-700">
              Per Project
            </h3>
            <div className="space-y-2">
              {projects.map((project: any) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-zinc-700">
                    {project.name}
                  </span>
                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <span>{project._count?.followers || 0} followers</span>
                    <span>{project._count?.joinRequests || 0} apps</span>
                    <span>{project._count?.members || 0} members</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit event modal */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">Edit Event</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700">Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700">Date & Time</label>
                <input
                  type="datetime-local"
                  value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700">Location</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-700">Event Type</label>
                  <select
                    value={editForm.eventType}
                    onChange={(e) => setEditForm({ ...editForm, eventType: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  >
                    <option value="">Select type</option>
                    <option>Pitch Night</option>
                    <option>Workshop</option>
                    <option>Networking</option>
                    <option>Hackathon</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700">Scope</label>
                  <select
                    value={editForm.locationScope}
                    onChange={(e) => setEditForm({ ...editForm, locationScope: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  >
                    <option value="">Select scope</option>
                    <option>Local</option>
                    <option>National</option>
                    <option>International</option>
                    <option>Online</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-sm font-medium text-zinc-700">Max Attendees</label>
                  <input
                    type="number"
                    value={editForm.maxAttendees}
                    onChange={(e) => setEditForm({ ...editForm, maxAttendees: e.target.value })}
                    placeholder="No limit"
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-zinc-700 mt-5">
                  <input
                    type="checkbox"
                    checked={editForm.requireApproval}
                    onChange={(e) => setEditForm({ ...editForm, requireApproval: e.target.checked })}
                    className="rounded border-zinc-300"
                  />
                  Require approval
                </label>
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setEditingEvent(null)}
                className="flex-1 rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditEvent}
                disabled={editSaving}
                className="flex-1 rounded-full bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {editSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "watchlist" && isInvestor && (
        <div className="space-y-4">
          {followedProjects?.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {followedProjects.map((fp: any) => (
                <Link
                  key={fp.id}
                  href={`/projects/${fp.project.id}`}
                  className="rounded-xl border border-zinc-200 bg-white p-4 transition-all hover:shadow-md"
                >
                  <h3 className="font-semibold text-zinc-900 truncate">
                    {fp.project.name}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    {fp.project.industry} &middot; {fp.project.stage}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    {fp.project.location} &middot; {fp.project.followerCount} followers
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 py-12 text-center">
              <Eye className="mb-2 h-8 w-8 text-zinc-300" />
              <p className="text-sm text-zinc-500">No projects in your watchlist yet</p>
              <Link
                href="/search"
                className="mt-3 rounded-full bg-red-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-red-600 transition-colors"
              >
                Discover Projects
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
