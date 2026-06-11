"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Compass, MapPin, Users, Star, RefreshCw, Search } from "lucide-react";
import ProfileCompletionNudge from "@/components/layout/ProfileCompletionNudge";
import { formatStage, parseRolesNeeded } from "@/lib/utils";

export default function FeedContent({ userId }: { userId: string }) {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const loaderRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Your Feed</h1>
        <p className="text-sm text-zinc-500">
          Discover projects and people in the Swiss startup ecosystem
        </p>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search projects..."
          className="w-full rounded-lg border border-zinc-200 py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
        />
      </div>

      <div className="mb-6">
        <ProfileCompletionNudge />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
        <p className="text-xs text-zinc-600">
          <strong>{projects.length}</strong> project{projects.length === 1 ? "" : "s"} in your feed.
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
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 py-16 text-center">
          <Compass className="mb-3 h-10 w-10 text-zinc-300" />
          <h2 className="text-lg font-medium text-zinc-700">
            Your feed is empty
          </h2>
          <p className="mt-1 max-w-sm text-sm text-zinc-500">
            Start following projects and people to see their updates here.
          </p>
          <Link
            href="/search"
            className="mt-4 rounded-md bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
          >
            Discover Projects
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.filter((p: any) => {
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            return (
              p.name?.toLowerCase().includes(q) ||
              p.problem?.toLowerCase().includes(q)
            );
          }).map((project: any) => (
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
                <div className="shrink-0">
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
