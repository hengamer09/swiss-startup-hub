"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  X,
  MapPin,
  Users,
  Star,
  RefreshCw,
  Filter,
} from "lucide-react";
import { cn, formatStage, industries } from "@/lib/utils";

const LOOKING_FOR = [
  "Co-founder", "Developer", "Designer", "Marketer",
  "Sales", "Finance", "Legal", "Operations", "Investor",
];

const STAGES = ["IDEA", "MVP", "EARLY_REVENUE", "SCALING"];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "followers", label: "Most Followed" },
  { value: "rating", label: "Highest Rated" },
  { value: "active", label: "Recently Active" },
];

export default function SearchPage() {
  const [type, setType] = useState<"projects" | "people">("projects");
  const [query, setQuery] = useState("");
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [sort, setSort] = useState("newest");
  const [minRating, setMinRating] = useState(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);

  const buildParams = useCallback(
    (pageNum: number) => {
      const params = new URLSearchParams();
      params.set("type", type);
      params.set("sort", sort);
      params.set("page", pageNum.toString());
      if (query) params.set("q", query);
      if (location) params.set("location", location);
      if (minRating > 0) params.set("minRating", minRating.toString());
      if (verifiedOnly) params.set("verifiedOnly", "true");
      selectedIndustries.forEach((i) => params.append("industry", i));
      selectedStages.forEach((s) => params.append("stage", s));
      lookingFor.forEach((l) => params.append("lookingFor", l));
      return params;
    },
    [type, query, location, minRating, verifiedOnly, selectedIndustries, selectedStages, lookingFor, sort]
  );

  async function fetchResults(pageNum: number, append: boolean) {
    setLoading(true);
    const params = buildParams(pageNum);
    const res = await fetch(`/api/search?${params}`);
    if (res.ok) {
      const data = await res.json();
      if (append) {
        setResults((prev) => [...prev, ...data.results]);
      } else {
        setResults(data.results);
      }
      setTotal(data.total);
      setHasMore(pageNum < data.totalPages);
    }
    setLoading(false);
  }

  useEffect(() => {
    setPage(1);
    fetchResults(1, false);
  }, [type, query, location, minRating, verifiedOnly, selectedIndustries, selectedStages, lookingFor, sort]);

  useEffect(() => {
    if (page <= 1) return;
    fetchResults(page, true);
  }, [page]);

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

  function toggleIndustry(ind: string) {
    setSelectedIndustries((prev) =>
      prev.includes(ind) ? prev.filter((i) => i !== ind) : [...prev, ind]
    );
  }

  function toggleStage(stage: string) {
    setSelectedStages((prev) =>
      prev.includes(stage) ? prev.filter((s) => s !== stage) : [...prev, stage]
    );
  }

  function toggleLookingFor(item: string) {
    setLookingFor((prev) =>
      prev.includes(item) ? prev.filter((l) => l !== item) : [...prev, item]
    );
  }

  const hasActiveFilters =
    selectedIndustries.length > 0 ||
    selectedStages.length > 0 ||
    location ||
    minRating > 0 ||
    verifiedOnly ||
    lookingFor.length > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Discover</h1>
          <p className="text-sm text-zinc-500">
            Find projects and people in the Swiss startup ecosystem
          </p>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects, skills, people..."
              className="w-full rounded-lg border border-zinc-300 py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>
          <Link
            href="/projects/new"
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            Create project
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
            showFilters || hasActiveFilters
              ? "border-red-500 bg-red-50 text-red-600"
              : "border-zinc-300 text-zinc-600 hover:bg-zinc-50"
          )}
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {selectedIndustries.length + selectedStages.length + (location ? 1 : 0) + (minRating > 0 ? 1 : 0) + (verifiedOnly ? 1 : 0) + lookingFor.length}
            </span>
          )}
        </button>
      </div>

      <div className="flex gap-4">
        {showFilters && (
          <div className="w-64 shrink-0 space-y-4">
            <div className="rounded-xl border border-zinc-200 bg-white p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-900">Filters</h2>
                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      setSelectedIndustries([]);
                      setSelectedStages([]);
                      setLocation("");
                      setLookingFor([]);
                      setMinRating(0);
                      setVerifiedOnly(false);
                    }}
                    className="text-xs text-red-500 hover:text-red-600"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="flex gap-1 rounded-lg bg-zinc-100 p-1">
                {(["projects", "people"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={cn(
                      "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                      type === t ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                    )}
                  >
                    {t === "projects" ? "Projects" : "People"}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-2">Industry</label>
                <div className="flex flex-wrap gap-1">
                  {industries.map((ind) => (
                    <button
                      key={ind}
                      onClick={() => toggleIndustry(ind)}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                        selectedIndustries.includes(ind)
                          ? "bg-red-50 text-red-700 border border-red-300"
                          : "bg-zinc-50 text-zinc-600 border border-zinc-200 hover:border-zinc-300"
                      )}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </div>

              {type === "projects" && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-2">Stage</label>
                    <div className="flex flex-wrap gap-1">
                      {STAGES.map((s) => (
                        <button
                          key={s}
                          onClick={() => toggleStage(s)}
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                            selectedStages.includes(s)
                              ? "bg-amber-50 text-amber-700 border border-amber-300"
                              : "bg-zinc-50 text-zinc-600 border border-zinc-200 hover:border-zinc-300"
                          )}
                        >
                          {formatStage(s)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-2">Looking for</label>
                    <div className="flex flex-wrap gap-1">
                      {LOOKING_FOR.map((item) => (
                        <button
                          key={item}
                          onClick={() => toggleLookingFor(item)}
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                            lookingFor.includes(item)
                              ? "bg-blue-50 text-blue-700 border border-blue-300"
                              : "bg-zinc-50 text-zinc-600 border border-zinc-200 hover:border-zinc-300"
                          )}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-2">Min rating</label>
                    <div className="flex gap-1">
                      {[0, 3, 4, 4.5].map((r) => (
                        <button
                          key={r}
                          onClick={() => setMinRating(r)}
                          className={cn(
                            "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                            minRating === r
                              ? "bg-amber-50 text-amber-700 border border-amber-300"
                              : "bg-zinc-50 text-zinc-600 border border-zinc-200 hover:border-zinc-300"
                          )}
                        >
                          {r === 0 ? "Any" : `${r}★`}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-2">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City or canton"
                  className="w-full rounded-lg border border-zinc-300 px-2.5 py-1.5 text-xs focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-zinc-700">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="rounded border-zinc-300"
                />
                Verified only
              </label>
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-zinc-500">
              {loading ? "Searching..." : `${total} ${type} match your filters`}
            </p>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-xs text-zinc-600 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {results.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 py-16 text-center">
              <Search className="mb-3 h-10 w-10 text-zinc-300" />
              <h2 className="text-lg font-medium text-zinc-700">No {type} found</h2>
              <p className="mt-1 max-w-sm text-sm text-zinc-500">
                {type === "projects"
                  ? "Try widening your filters or be the first in this niche."
                  : "No people match your criteria. Try different filters."}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setSelectedIndustries([]);
                    setSelectedStages([]);
                    setLocation("");
                    setLookingFor([]);
                    setMinRating(0);
                    setVerifiedOnly(false);
                    setQuery("");
                  }}
                  className="mt-4 rounded-md bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {results.map((item: any) => (
                <Link
                  key={item.id}
                  href={type === "projects" ? `/projects/${item.id}` : `/profile/${item.id}`}
                  className="group rounded-xl border border-zinc-200 bg-white p-4 transition-all hover:shadow-md hover:border-zinc-300"
                >
                  {type === "projects" ? (
                    <ProjectCard project={item} />
                  ) : (
                    <PersonCard person={item} />
                  )}
                </Link>
              ))}
            </div>
          )}

          <div ref={loaderRef} className="py-4 text-center">
            {loading && (
              <RefreshCw className="mx-auto h-5 w-5 animate-spin text-zinc-400" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: any }) {
  return (
    <div>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-base font-bold text-zinc-600 shrink-0">
          {project.name?.charAt(0) || "P"}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-zinc-900 text-sm truncate group-hover:text-red-500 transition-colors">
            {project.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
              {project.industry}
            </span>
            <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
              {formatStage(project.stage)}
            </span>
            <span className="text-xs text-zinc-400 flex items-center gap-0.5">
              <MapPin className="h-3 w-3" />
              {project.location}
            </span>
          </div>
        </div>
      </div>
      <p className="mt-2 text-xs text-zinc-600 line-clamp-2">{project.problem}</p>
      <div className="mt-2 flex items-center gap-3 text-xs text-zinc-400">
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {project.teamSize}
        </span>
        <span className="flex items-center gap-1">
          <Star className="h-3 w-3" />
          {project._count?.followers || 0}
        </span>
        {project.owner?.averageRating > 0 && (
          <span className="flex items-center gap-1 text-amber-600">
            ★ {project.owner.averageRating.toFixed(1)}
          </span>
        )}
      </div>
      {project.members && project.members.length > 0 && (
        <div className="mt-2 flex items-center gap-1">
          {project.members.slice(0, 4).map((m: any) => (
            <div
              key={m.id}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-medium text-zinc-600 ring-2 ring-white"
            >
              {m.user.name?.charAt(0) || "U"}
            </div>
          ))}
          {project._count?.followers > 4 && (
            <span className="text-[10px] text-zinc-400">+{project.members.length - 4}</span>
          )}
        </div>
      )}
    </div>
  );
}

function PersonCard({ person }: { person: any }) {
  const skills = person.skills || [];

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-sm font-bold text-zinc-600">
          {person.name?.charAt(0) || "U"}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-zinc-900 text-sm truncate group-hover:text-red-500 transition-colors">
            {person.name}
          </h3>
          {person.location && (
            <p className="text-xs text-zinc-500 flex items-center gap-0.5">
              <MapPin className="h-3 w-3" />
              {person.location}
              {person.canton && ` (${person.canton})`}
            </p>
          )}
        </div>
      </div>
      {skills.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {skills.slice(0, 4).map((us: any) => (
            <span
              key={us.skill?.id || us.id}
              className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600"
            >
              {us.skill?.name || us.name}
            </span>
          ))}
        </div>
      )}
      <div className="mt-2 flex items-center gap-3 text-xs text-zinc-400">
        {person.averageRating > 0 && (
          <span className="flex items-center gap-1 text-amber-600">
            ★ {person.averageRating.toFixed(1)} ({person.ratingCount})
          </span>
        )}
        {person.identityVerified && (
          <span className="text-green-600">Verified</span>
        )}
      </div>
    </div>
  );
}
