"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Compass, MapPin, Users, Star, RefreshCw, Search, SlidersHorizontal, X } from "lucide-react";
import ProfileCompletenessCard from "@/components/ProfileCompletenessCard";
import BookmarkButton from "@/components/BookmarkButton";
import InterestButton from "@/components/projects/InterestButton";
import { formatStage, parseRolesNeeded, stageBadgeClass, cn } from "@/lib/utils";
import { computeProjectCompleteness } from "@/lib/projectCompleteness";
import type { CompletenessInput } from "@/lib/profileCompleteness";

/* eslint-disable @typescript-eslint/no-explicit-any */

const INDUSTRIES = [
  "FinTech", "DeepTech", "Health", "Climate", "EdTech",
  "Robotics", "Consumer", "B2B SaaS", "Logistics", "Legal", "Real Estate", "Other",
];

const STAGES = [
  { value: "IDEA", label: "Idea" },
  { value: "MVP", label: "MVP" },
  { value: "EARLY_REVENUE", label: "Early Revenue" },
  { value: "SCALING", label: "Scaling" },
  { value: "LAUNCHED", label: "Launched" },
];

const LOCATIONS = ["Zurich", "Geneva", "Basel", "Bern", "Lausanne", "Remote"];

const LOOKING_FOR = [
  "Developer", "Designer", "Marketer", "Investor",
  "Co-Founder", "Engineer", "Sales", "Operations",
];

interface Filters {
  industry: string;
  stage: string;
  location: string;
  lookingFor: string[];
}

const EMPTY_FILTERS: Filters = { industry: "", stage: "", location: "", lookingFor: [] };

type View = "all" | "following";

export default function FeedContent({
  userId,
  completeness,
}: {
  userId: string;
  completeness: CompletenessInput;
}) {
  const router = useRouter();
  const [view, setView] = useState<View>("all");
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [followPage, setFollowPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [studentOnly, setStudentOnly] = useState(false);
  const filterRowRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/bookmarks");
      if (res.ok) {
        const data = await res.json();
        setBookmarkedIds(new Set((data.bookmarks || []).map((b: any) => b.project.id)));
      }
    })();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRowRef.current && !filterRowRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load the first page whenever the view (All / Following) changes.
  const loadInitial = useCallback(async (v: View) => {
    setLoading(true);
    if (v === "all") {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const d = await res.json();
        setProjects(d.projects || []);
        setNextCursor(d.nextCursor ?? null);
        setHasMore(Boolean(d.nextCursor));
      }
    } else {
      const res = await fetch("/api/feed?page=1");
      if (res.ok) {
        const d = await res.json();
        setProjects(d.projects || []);
        setFollowPage(1);
        setHasMore(Boolean(d.hasMore) && 1 < (d.totalPages || 1));
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadInitial(view);
  }, [view, loadInitial]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    if (view === "all") {
      const res = await fetch(`/api/projects?cursor=${nextCursor}`);
      if (res.ok) {
        const d = await res.json();
        setProjects((prev) => [...prev, ...(d.projects || [])]);
        setNextCursor(d.nextCursor ?? null);
        setHasMore(Boolean(d.nextCursor));
      }
    } else {
      const np = followPage + 1;
      const res = await fetch(`/api/feed?page=${np}`);
      if (res.ok) {
        const d = await res.json();
        setProjects((prev) => [...prev, ...(d.projects || [])]);
        setFollowPage(np);
        setHasMore(Boolean(d.hasMore) && np < (d.totalPages || 1));
      }
    }
    setLoadingMore(false);
  }, [view, nextCursor, followPage, hasMore, loadingMore, loading]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loadMore]);

  const hasActiveFilters =
    Boolean(filters.industry) ||
    Boolean(filters.stage) ||
    Boolean(filters.location) ||
    filters.lookingFor.length > 0;

  const filteredProjects = projects.filter((p: any) => {
    if (studentOnly && !p.isStudentProject) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!p.name?.toLowerCase().includes(q) && !p.problem?.toLowerCase().includes(q)) return false;
    }
    if (filters.industry && p.industry !== filters.industry) return false;
    if (filters.stage && p.stage !== filters.stage) return false;
    if (filters.location) {
      if (filters.location === "Remote") {
        if (!p.isRemote && !p.location?.toLowerCase().includes("remote")) return false;
      } else {
        if (!p.location?.toLowerCase().includes(filters.location.toLowerCase())) return false;
      }
    }
    if (filters.lookingFor.length > 0) {
      const roles = parseRolesNeeded(p.rolesNeeded);
      const titles = roles.map((r: any) => r.title.toLowerCase());
      const matched = filters.lookingFor.some((lf) =>
        titles.some((t: string) => t.includes(lf.toLowerCase()))
      );
      if (!matched) return false;
    }
    return true;
  });

  // Featured projects float to the top of the loaded list.
  const displayProjects = [...filteredProjects].sort(
    (a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)
  );

  // Build active chips for display
  const activeChips: { label: string; onRemove: () => void }[] = [];
  if (filters.industry) {
    activeChips.push({ label: filters.industry, onRemove: () => setFilters((f) => ({ ...f, industry: "" })) });
  }
  if (filters.stage) {
    const label = STAGES.find((s) => s.value === filters.stage)?.label ?? filters.stage;
    activeChips.push({ label, onRemove: () => setFilters((f) => ({ ...f, stage: "" })) });
  }
  if (filters.location) {
    activeChips.push({ label: filters.location, onRemove: () => setFilters((f) => ({ ...f, location: "" })) });
  }
  filters.lookingFor.forEach((lf) => {
    activeChips.push({
      label: lf,
      onRemove: () => setFilters((f) => ({ ...f, lookingFor: f.lookingFor.filter((v) => v !== lf) })),
    });
  });

  const countLabel = hasActiveFilters || searchQuery.trim()
    ? "matching filters"
    : view === "following"
    ? "you follow"
    : "on the platform";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#0f172a]">Discover Projects</h1>
        <p className="text-sm text-[#475569]">
          Explore projects and people in the Swiss startup ecosystem
        </p>
      </div>

      {/* View toggle: All / Following */}
      <div className="mb-4 inline-flex rounded-lg border border-[#e2e8f0] bg-white p-1 text-sm">
        <button
          type="button"
          onClick={() => setView("all")}
          className={`rounded-md px-4 py-1.5 font-medium transition-colors ${
            view === "all" ? "bg-[#1e40af] text-white" : "text-[#475569] hover:text-[#0f172a]"
          }`}
        >
          All Projects
        </button>
        <button
          type="button"
          onClick={() => setView("following")}
          className={`rounded-md px-4 py-1.5 font-medium transition-colors ${
            view === "following" ? "bg-[#1e40af] text-white" : "text-[#475569] hover:text-[#0f172a]"
          }`}
        >
          Following
        </button>
      </div>

      {/* Student projects toggle */}
      <button
        type="button"
        onClick={() => setStudentOnly((v) => !v)}
        className={`mb-3 ml-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors sm:ml-3 ${
          studentOnly
            ? "border-purple-300 bg-purple-50 text-purple-700"
            : "border-[#e2e8f0] bg-white text-[#475569] hover:bg-[#f8fafc]"
        }`}
      >
        🎓 Student projects only
      </button>

      {/* Search bar + filter button */}
      <div className="mb-2 flex flex-col gap-2 sm:flex-row" ref={filterRowRef}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="w-full rounded-xl border border-[#e2e8f0] py-2 pl-9 pr-3 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#3b82f6] focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Filter button + panel */}
        <div className="relative w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilterOpen((v) => !v)}
            className={`flex h-full w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors sm:w-auto sm:justify-start sm:py-0 ${
              filterOpen || hasActiveFilters
                ? "border-[#1e40af] bg-blue-50 text-[#1e40af]"
                : "border-[#e2e8f0] bg-white text-[#475569] hover:bg-[#f8fafc]"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#1e40af] text-[10px] font-bold text-white">
                {activeChips.length}
              </span>
            )}
          </button>

          {filterOpen && (
            <div className="absolute right-0 top-full z-20 mt-1 w-72 rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-md">
              {/* Category */}
              <div className="mb-3">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#94a3b8]">
                  Category
                </label>
                <select
                  value={filters.industry}
                  onChange={(e) => setFilters((f) => ({ ...f, industry: e.target.value }))}
                  className="w-full rounded-md border border-[#e2e8f0] px-2 py-1.5 text-sm text-[#0f172a] focus:border-[#3b82f6] focus:outline-none"
                >
                  <option value="">All categories</option>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>

              {/* Stage */}
              <div className="mb-3">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#94a3b8]">
                  Stage
                </label>
                <select
                  value={filters.stage}
                  onChange={(e) => setFilters((f) => ({ ...f, stage: e.target.value }))}
                  className="w-full rounded-md border border-[#e2e8f0] px-2 py-1.5 text-sm text-[#0f172a] focus:border-[#3b82f6] focus:outline-none"
                >
                  <option value="">All stages</option>
                  {STAGES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div className="mb-3">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#94a3b8]">
                  Location
                </label>
                <select
                  value={filters.location}
                  onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}
                  className="w-full rounded-md border border-[#e2e8f0] px-2 py-1.5 text-sm text-[#0f172a] focus:border-[#3b82f6] focus:outline-none"
                >
                  <option value="">All locations</option>
                  {LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* Looking for */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#94a3b8]">
                  Looking for
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {LOOKING_FOR.map((role) => {
                    const active = filters.lookingFor.includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() =>
                          setFilters((f) => ({
                            ...f,
                            lookingFor: active
                              ? f.lookingFor.filter((r) => r !== role)
                              : [...f.lookingFor, role],
                          }))
                        }
                        className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                          active
                            ? "bg-[#1e40af] text-white"
                            : "bg-[#f1f5f9] text-[#475569] hover:bg-zinc-200"
                        }`}
                      >
                        {role}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active filter chips */}
      {activeChips.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          {activeChips.map((chip) => (
            <span
              key={chip.label}
              className="inline-flex items-center gap-1 rounded-full bg-[#1e40af] px-3 py-1 text-xs font-medium text-white"
            >
              {chip.label}
              <button
                type="button"
                onClick={chip.onRemove}
                aria-label={`Remove ${chip.label} filter`}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="ml-1 text-xs text-[#94a3b8] hover:text-[#475569] transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="mb-6">
        <ProfileCompletenessCard user={completeness} />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e2e8f0] bg-white p-3">
        <p className="text-xs text-[#475569]">
          <strong>{filteredProjects.length}</strong> project{filteredProjects.length === 1 ? "" : "s"} {countLabel}.
        </p>
        <button
          type="button"
          onClick={() => router.push("/projects/new")}
          className="w-full rounded-lg bg-[#1e40af] px-4 py-2 text-xs font-medium text-white hover:bg-[#1d4ed8] transition-colors sm:w-auto sm:py-1.5"
        >
          Create a project
        </button>
      </div>

      {loading && projects.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-6 w-6 animate-spin text-zinc-300" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#e2e8f0] bg-white py-16 text-center">
          <Compass className="mb-3 h-10 w-10 text-zinc-300" />
          <h2 className="text-lg font-medium text-[#0f172a]">
            {hasActiveFilters || searchQuery.trim()
              ? "No projects match your filters"
              : view === "following"
              ? "You're not following any projects yet"
              : "No projects yet"}
          </h2>
          <p className="mt-1 max-w-sm text-sm text-[#475569]">
            {hasActiveFilters || searchQuery.trim()
              ? "Try adjusting your search or removing some filters."
              : view === "following"
              ? "Follow projects to see them here, or browse all projects."
              : "Be the first to create a project for the community."}
          </p>
          {hasActiveFilters || searchQuery.trim() ? (
            <button
              type="button"
              onClick={() => { setFilters(EMPTY_FILTERS); setSearchQuery(""); }}
              className="mt-4 rounded-lg border border-[#e2e8f0] px-5 py-2 text-sm font-medium text-[#0f172a] hover:bg-[#f8fafc] transition-colors"
            >
              Clear filters
            </button>
          ) : view === "following" ? (
            <button
              type="button"
              onClick={() => setView("all")}
              className="mt-4 rounded-lg bg-[#1e40af] px-5 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] transition-colors"
            >
              Browse all projects
            </button>
          ) : (
            <Link
              href="/projects/new"
              className="mt-4 rounded-lg bg-[#1e40af] px-5 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] transition-colors"
            >
              Create a project
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayProjects.map((project: any) => {
            const q = computeProjectCompleteness({
              name: project.name, problem: project.problem, solution: project.solution,
              rolesCount: parseRolesNeeded(project.rolesNeeded).length, logo: project.logo,
              stage: project.stage, memberCount: project._count?.members ?? project.teamSize,
              updateCount: project._count?.updates ?? 0, postCount: project._count?.posts ?? 0,
            });
            return (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className={cn(
                "block rounded-xl border border-[#e2e8f0] bg-white p-5 transition-shadow hover:shadow-sm",
                project.featured && "border-l-4 border-l-[#1e40af]"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-zinc-100 text-base font-bold text-zinc-600 shrink-0">
                      {project.logo ? (
                        <img src={project.logo} alt={project.name} className="h-full w-full object-cover" />
                      ) : (
                        project.name?.charAt(0) || "P"
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#0f172a] truncate">
                        {project.name}
                      </h3>
                      {project.isStudentProject && project.school?.name && (
                        <p className="text-xs text-purple-700">from {project.school.name}</p>
                      )}
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        {project.isStudentProject && (
                          <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700">
                            🎓 Student Project
                          </span>
                        )}
                        {project.featured && (
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-[#1e40af]">
                            ⭐ Featured
                          </span>
                        )}
                        <span className="rounded bg-[#f1f5f9] px-2 py-0.5 text-xs font-medium text-[#475569]">
                          {project.industry}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${stageBadgeClass(project.stage)}`}>
                          {formatStage(project.stage)}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${q.badge.className}`}>
                          {q.badge.label}
                        </span>
                        <span className="text-xs text-[#94a3b8] flex items-center gap-0.5">
                          <MapPin className="h-3 w-3" />
                          {project.location}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-[#475569] line-clamp-1">
                    {project.problem}
                  </p>
                  {(() => {
                    const roles = parseRolesNeeded(project.rolesNeeded);
                    if (roles.length === 0) return null;
                    return (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {roles.slice(0, 4).map((r, i) => (
                          <span key={i} className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-xs font-medium text-[#475569]">
                            {r.title}
                          </span>
                        ))}
                      </div>
                    );
                  })()}
                  <div className="mt-2 flex items-center gap-4 text-xs text-[#94a3b8]">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {project.teamSize} members
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      {project._count?.followers || 0} followers
                    </span>
                    {project.owner?.averageRating > 0 && (
                      <span className="text-amber-600">
                        ★ {project.owner.averageRating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <BookmarkButton projectId={project.id} initialSaved={bookmarkedIds.has(project.id)} />
                  {project.owner?.id !== userId && <InterestButton projectId={project.id} />}
                  <span className="inline-flex rounded-lg border border-[#e2e8f0] px-3 py-1 text-xs font-medium text-[#475569]">
                    Follow
                  </span>
                </div>
              </div>
            </Link>
            );
          })}
        </div>
      )}

      <div ref={loaderRef} className="py-4 text-center">
        {loadingMore && (
          <RefreshCw className="mx-auto h-5 w-5 animate-spin text-zinc-400" />
        )}
      </div>
    </div>
  );
}
