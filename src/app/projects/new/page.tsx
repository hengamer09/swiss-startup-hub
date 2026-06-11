"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, X } from "lucide-react";
import Link from "next/link";
import { industries } from "@/lib/utils";

interface RoleEntry { title: string; description: string; }

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState("");
  const [industry, setIndustry] = useState("");
  const [stage, setStage] = useState("IDEA");
  const [location, setLocation] = useState("Zurich");
  const [isRemote, setIsRemote] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [targetCustomer, setTargetCustomer] = useState("");
  const [scope, setScope] = useState("");
  const [competitiveLandscape, setCompetitiveLandscape] = useState("");
  const [investorPitch, setInvestorPitch] = useState("");
  const [seriousness, setSeriousness] = useState("SERIOUS_STARTUP");
  const [teamCompensation, setTeamCompensation] = useState("PAID");
  const [logo, setLogo] = useState("");
  const [rolesNeeded, setRolesNeeded] = useState<RoleEntry[]>([{ title: "", description: "" }]);
  const [rolesNeededError, setRolesNeededError] = useState("");

  async function handleUpload(file: File) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Image upload failed");
      setLogo(data.url);
    } catch (err: any) {
      setError(err.message || "Image upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Validate rolesNeeded
    const validRoles = rolesNeeded.filter((r) => r.title.trim());
    if (validRoles.length === 0) {
      setRolesNeededError("Please add at least one role you're looking for");
      return;
    }
    setRolesNeededError("");
    if (!name.trim() || !problem.trim() || !solution.trim() || !industry) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          problem,
          solution,
          industry,
          stage,
          location,
          isRemote,
          targetCustomer,
          scope,
          competitiveLandscape,
          investorPitch,
          seriousness,
          teamCompensation,
          logo,
          rolesNeeded: JSON.stringify(validRoles),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create project");
        setLoading(false);
        return;
      }

      const data = await res.json();
      router.push(`/projects/${data.id}`);
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <h1 className="text-xl font-semibold text-zinc-900">Create a Project</h1>
      <p className="mt-1 text-sm text-zinc-500">
        List your startup or idea on the platform
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Project name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            placeholder="e.g. CarbonClear"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Industry <span className="text-red-500">*</span>
          </label>
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          >
            <option value="">Select an industry</option>
            {industries.map((ind) => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700">Stage</label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            >
              <option value="IDEA">Idea</option>
              <option value="MVP">MVP</option>
              <option value="EARLY_REVENUE">Early Revenue</option>
              <option value="SCALING">Scaling</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              placeholder="e.g. Zurich"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={isRemote}
            onChange={(e) => setIsRemote(e.target.checked)}
            className="rounded border-zinc-300"
          />
          Fully remote team
        </label>

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            The Problem <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            maxLength={500}
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            placeholder="What problem does your startup solve?"
          />
          <p className="mt-1 text-xs text-zinc-400">{problem.length}/500</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">Project image / logo</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          {uploading && <p className="mt-1 text-xs text-zinc-500">Uploading image…</p>}
          {logo && <img src={logo} alt="Project logo preview" className="mt-3 h-20 w-20 rounded-xl object-cover border" />}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">Project seriousness</label>
          <select value={seriousness} onChange={(e) => setSeriousness(e.target.value)} className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500">
            <option value="SCHOOL_PROJECT">School project</option>
            <option value="SIDE_PROJECT">Side project</option>
            <option value="SERIOUS_STARTUP">Serious startup</option>
            <option value="FULL_TIME_FUNDING">Full-time / looking for funding</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">Team compensation</label>
          <select value={teamCompensation} onChange={(e) => setTeamCompensation(e.target.value)} className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500">
            <option value="UNPAID">Unpaid / volunteer</option>
            <option value="PAID">Paid</option>
          </select>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900">Market & Competition</h2>
          <div>
            <label className="block text-sm font-medium text-zinc-700">Target customer</label>
            <input value={targetCustomer} onChange={(e) => setTargetCustomer(e.target.value)} className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">Scope</label>
            <select value={scope} onChange={(e) => setScope(e.target.value)} className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500">
              <option value="">Select</option>
              <option value="Swiss">Swiss</option>
              <option value="International">International</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">Competitive landscape</label>
            <textarea value={competitiveLandscape} onChange={(e) => setCompetitiveLandscape(e.target.value)} rows={3} className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500" />
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900">Investor Pitch</h2>
          <textarea value={investorPitch} onChange={(e) => setInvestorPitch(e.target.value)} rows={3} className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500" placeholder="Brief investor summary…" />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            The Solution <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            maxLength={500}
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            placeholder="How does your startup solve this problem?"
          />
          <p className="mt-1 text-xs text-zinc-400">{solution.length}/500</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-zinc-900">
              Who We&apos;re Looking For <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setRolesNeeded((prev) => [...prev, { title: "", description: "" }])}
              className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add role
            </button>
          </div>
          {rolesNeededError && <p className="text-xs text-red-500">{rolesNeededError}</p>}
          <div className="space-y-3">
            {rolesNeeded.map((role, idx) => (
              <div key={idx} className="rounded-lg border border-zinc-200 bg-white p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={role.title}
                    onChange={(e) => {
                      const v = e.target.value.slice(0, 100);
                      setRolesNeeded((prev) => prev.map((r, i) => i === idx ? { ...r, title: v } : r));
                      if (rolesNeededError) setRolesNeededError("");
                    }}
                    placeholder="Role title (e.g. Frontend Developer)"
                    className="flex-1 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                  {rolesNeeded.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setRolesNeeded((prev) => prev.filter((_, i) => i !== idx))}
                      className="rounded-full p-1 text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <textarea
                  value={role.description}
                  onChange={(e) => {
                    const v = e.target.value.slice(0, 300);
                    setRolesNeeded((prev) => prev.map((r, i) => i === idx ? { ...r, description: v } : r));
                  }}
                  rows={2}
                  placeholder="What do you need from this person? (optional)"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Creating..." : "Create Project"}
        </button>
      </form>
    </div>
  );
}
