"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Compass, MapPin, Users, Star, RefreshCw, Search, SlidersHorizontal, X } from "lucide-react";
import ProfileCompletionNudge from "@/components/layout/ProfileCompletionNudge";
import BookmarkButton from "@/components/BookmarkButton";
import { formatStage, parseRolesNeeded } from "@/lib/utils";

const INDUSTRIES = [
  "FinTech", "DeepTech", "Health", "Climate", "EdTech",
  "Robotics", "Consumer", "B2B SaaS", "Logistics", "Legal", "Real Estate", "Other",
];

const STAGES = [
  { value: "IDEA", label: "Idea" },
  { value: "MVP", label: "MVP" },
  { value: "EARLY_REVENUE", label: "Early Revenue" },
  { value: "SCALING", label: "Scaling" },
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

export default function FeedContent({ userId }: { userId: string }) {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
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

  const fetchProjects = useCallback(async (pageNum: number, append: boolean) => {
    const res = await fetch(`/api/feed?page=${pageNum}`);
    if (res.ok) {
      const data = await res.json();
      const items = data.projects || [];
      if (append) {
        setProjects((prev) => [...prev, ...items]);
      } else {
        setProjects(items);
      }
      setHasMore(Boolean(data.hasMore) && pageNum < (data.totalPages || 1));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProjects(1, false);
  }, [fetchProjects]);

  useEffect(() => {
    if (page <= 1) return;
    fetchProjects(page, true);
  }, [page, fetchProjects]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage((p) => p + 1);
        }
      },
      { threshold: 0.1 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  const hasActiveFilters =
    Boolean(filters.industry) ||
    Boolean(filters.stage) ||
    Boolean(filters.location) ||
    filters.lookingFor.length > 0;

  const filteredProjects = projects.filter((p: any) => {
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Your Feed</h1>
        <p className="text-sm text-zinc-500">
          Discover projects and people in the Swiss startup ecosystem
        </p>
      </div>

      {/* Search bar + filter button */}
      <div className="mb-2 flex gap-2" ref={filterRowRef}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="w-full rounded-lg border border-zinc-200 py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
          />
        </div>

        {/* Filter button + panel */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setFilterOpen((v) => !v)}
            className={`flex h-full items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors ${
              filterOpen || hasActiveFilters
                ? "border-zinc-400 bg-zinc-100 text-zinc-900"
                : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-zinc-700 text-[10px] font-bold text-white">
                {activeChips.length}
              </span>
            )}
          </button>

          {filterOpen && (
            <div className="absolute right-0 top-full z-20 mt-1 w-72 rounded-md border border-zinc-200 bg-white p-4 shadow-md">
              {/* Category */}
              <div className="mb-3">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Category
                </label>
                <select
                  value={filters.industry}
                  onChange={(e) => setFilters((f) => ({ ...f, industry: e.target.value }))}
                  className="w-full rounded-md border border-zinc-200 px-2 py-1.5 text-sm text-zinc-800 focus:border-zinc-400 focus:outline-none"
                >
                  <option value="">All categories</option>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>

              {/* Stage */}
              <div className="mb-3">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Stage
                </label>
                <select
                  value={filters.stage}
                  onChange={(e) => setFilters((f) => ({ ...f, stage: e.target.value }))}
                  className="w-full rounded-md border border-zinc-200 px-2 py-1.5 text-sm text-zinc-800 focus:border-zinc-400 focus:outline-none"
                >
                  <option value="">All stages</option>
                  {STAGES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div className="mb-3">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Location
                </label>
                <select
                  value={filters.location}
                  onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}
                  className="w-full rounded-md border border-zinc-200 px-2 py-1.5 text-sm text-zinc-800 focus:border-zinc-400 focus:outline-none"
                >
                  <option value="">All locations</option>
                  {LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* Looking for */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
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
                            ? "bg-zinc-800 text-white"
                            : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
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
              className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700"
            >
              {chip.label}
              <button
                type="button"
                onClick={chip.onRemove}
                aria-label={`Remove ${chip.label} filter`}
                className="text-zinc-400 hover:text-zinc-700 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="ml-1 text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="mb-6">
        <ProfileCompletionNudge />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
        <p className="text-xs text-zinc-600">
          <strong>{filteredProjects.length}</strong> project{filteredProjects.length === 1 ? "" : "s"}
          {hasActiveFilters || searchQuery.trim() ? " matching filters" : " in your feed"}.
        </p>
        <button
          type="button"
          onClick={() => router.push("/projects/new")}
          className="rounded-md bg-red-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors"
        >
          Create a project
        </button>
      </div>

      {loading && projects.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-6 w-6 animate-spin text-zinc-300" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 py-16 text-center">
          <Compass className="mb-3 h-10 w-10 text-zinc-300" />
          <h2 className="text-lg font-medium text-zinc-700">
            {projects.length === 0 ? "Your feed is empty" : "No projects match your filters"}
          </h2>
          <p className="mt-1 max-w-sm text-sm text-zinc-500">
            {projects.length === 0
              ? "Start following projects and people to see their updates here."
              : "Try adjusting your search or removing some filters."}
          </p>
          {projects.length === 0 ? (
            <Link
              href="/search"
              className="mt-4 rounded-md bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
            >
              Discover Projects
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => { setFilters(EMPTY_FILTERS); setSearchQuery(""); }}
              className="mt-4 rounded-md border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProjects.map((project: any) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="block rounded-lg border border-zinc-200 bg-white p-5 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-base font-bold text-zinc-600 shrink-0">
                      {project.name?.charAt(0) || "P"}
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-900 truncate">
                        {project.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                          {project.industry}
                        </span>
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
                          {formatStage(project.stage)}
                        </span>
                        <span className="text-xs text-zinc-400 flex items-center gap-0.5">
                          <MapPin className="h-3 w-3" />
                          {project.location}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-zinc-600 line-clamp-1">
                    {project.problem}
                  </p>
                  {(() => {
                    const roles = parseRolesNeeded(project.rolesNeeded);
                    if (roles.length === 0) return null;
                    return (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {roles.slice(0, 4).map((r, i) => (
                          <span key={i} className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                            {r.title}
                          </span>
                        ))}
                      </div>
                    );
                  })()}
                  <div className="mt-2 flex items-center gap-4 text-xs text-zinc-400">
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
                  <span className="inline-flex rounded border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600">
                    Follow
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div ref={loaderRef} className="py-4 text-center">
        {loading && projects.length > 0 && (
          <RefreshCw className="mx-auto h-5 w-5 animate-spin text-zinc-400" />
        )}
      </div>
    </div>
  );
}
