"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Compass, MapPin, Users, Star, RefreshCw, Sparkles } from "lucide-react";
import ProfileCompletionNudge from "@/components/layout/ProfileCompletionNudge";
import { formatStage } from "@/lib/utils";

export default function FeedContent({ userId }: { userId: string }) {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);

  const fetchProjects = useCallback(async (pageNum: number, append: boolean) => {
    const res = await fetch(`/api/search?type=projects&sort=newest&page=${pageNum}`);
    if (res.ok) {
      const data = await res.json();
      if (append) {
        setProjects((prev) => [...prev, ...data.results]);
      } else {
        setProjects(data.results);
      }
      setHasMore(pageNum < data.totalPages);
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

      <div className="mb-6">
        <ProfileCompletionNudge />
      </div>

      <div className="mb-4">
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
          <p className="text-xs text-blue-700 flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            <strong>3 new projects</strong> match your skills &mdash;{" "}
            <Link href="/search" className="underline font-medium">
              View all
            </Link>
          </p>
        </div>
      </div>

      {loading && projects.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-6 w-6 animate-spin text-zinc-300" />
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 py-16 text-center">
          <Compass className="mb-3 h-10 w-10 text-zinc-300" />
          <h2 className="text-lg font-medium text-zinc-700">
            Your feed is empty
          </h2>
          <p className="mt-1 max-w-sm text-sm text-zinc-500">
            Start following projects and people to see their updates here.
          </p>
          <Link
            href="/search"
            className="mt-4 rounded-full bg-red-500 px-5 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
          >
            Discover Projects
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project: any) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="block rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:shadow-md hover:border-zinc-300 animate-fade-in-up"
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
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                          {project.industry}
                        </span>
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
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
                  <span className="inline-flex rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700">
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
