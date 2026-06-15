"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Plus, X } from "lucide-react";
import Link from "next/link";
import { industries, parseRolesNeeded } from "@/lib/utils";
import ProjectQualityCard from "@/components/projects/ProjectQualityCard";

interface RoleEntry { title: string; description: string; }

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState("");
  const [industry, setIndustry] = useState("");
  const [stage, setStage] = useState("IDEA");
  const [location, setLocation] = useState("");
  const [isRemote, setIsRemote] = useState(false);
  const [targetCustomer, setTargetCustomer] = useState("");
  const [scope, setScope] = useState("");
  const [competitiveLandscape, setCompetitiveLandscape] = useState("");
  const [investorPitch, setInvestorPitch] = useState("");
  const [fundingAmount, setFundingAmount] = useState("");
  const [seriousness, setSeriousness] = useState("SERIOUS_STARTUP");
  const [teamCompensation, setTeamCompensation] = useState("PAID");
  const [logo, setLogo] = useState("");
  const [rolesNeeded, setRolesNeeded] = useState<RoleEntry[]>([{ title: "", description: "" }]);
  const [useOfFunds, setUseOfFunds] = useState("");
  const [tractionMetrics, setTractionMetrics] = useState("");
  const [investorVisible, setInvestorVisible] = useState(false);

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

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/projects/${params.id}`);
      if (res.ok) {
        const p = await res.json();
        setName(p.name || "");
        setProblem(p.problem || "");
        setSolution(p.solution || "");
        setIndustry(p.industry || "");
        setStage(p.stage || "IDEA");
        setLocation(p.location || "");
        setIsRemote(p.isRemote || false);
        setTargetCustomer(p.targetCustomer || "");
        setScope(p.scope || "");
        setCompetitiveLandscape(p.competitiveLandscape || "");
        setInvestorPitch(p.investorPitch || "");
        setFundingAmount(p.fundingAmount?.toString() || "");
        setUseOfFunds(p.useOfFunds || "");
        setTractionMetrics(p.tractionMetrics || "");
        setInvestorVisible(p.investorVisible || false);
        setSeriousness(p.seriousness || "SERIOUS_STARTUP");
        setTeamCompensation(p.teamCompensation || "PAID");
        setLogo(p.logo || "");
        const parsed = parseRolesNeeded(p.rolesNeeded);
        setRolesNeeded(parsed.length > 0 ? parsed : [{ title: "", description: "" }]);
      }
      setFetching(false);
    }
    load();
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch(`/api/projects/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, problem, solution, industry, stage, location, isRemote,
        targetCustomer, scope, competitiveLandscape,
        investorPitch, fundingAmount: fundingAmount ? parseInt(fundingAmount) : null,
        useOfFunds, tractionMetrics, investorVisible, seriousness, teamCompensation, logo,
        rolesNeeded: JSON.stringify(rolesNeeded.filter((r) => r.title.trim())),
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to save");
      setLoading(false);
      return;
    }

    router.push(`/projects/${params.id}`);
    router.refresh();
  }

  if (fetching) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-sm text-zinc-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href={`/projects/${params.id}`}
        className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Project
      </Link>

      <h1 className="text-xl font-semibold text-zinc-900">Edit Project</h1>

      <div className="mt-4">
        <ProjectQualityCard
          project={{
            name,
            problem,
            solution,
            rolesCount: rolesNeeded.filter((r) => r.title.trim()).length,
            logo,
            stage,
          }}
        />
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
        )}

        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900">Basic Info</h2>

          <div>
            <label className="block text-sm font-medium text-zinc-700">Project name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700">Industry</label>
              <select value={industry} onChange={(e) => setIndustry(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]">
                <option value="">Select</option>
                {industries.map((i) => (<option key={i} value={i}>{i}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">Stage</label>
              <select value={stage} onChange={(e) => setStage(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]">
                <option value="IDEA">Idea</option>
                <option value="MVP">MVP</option>
                <option value="EARLY_REVENUE">Early Revenue</option>
                <option value="SCALING">Scaling</option>
                <option value="LAUNCHED">Launched</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700">Location</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]" />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input type="checkbox" checked={isRemote} onChange={(e) => setIsRemote(e.target.checked)}
                  className="rounded border-zinc-300" />
                Remote
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">Project image / logo</label>
            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
            {uploading && <p className="mt-1 text-xs text-zinc-500">Uploading image…</p>}
            {logo && <img src={logo} alt="Project logo preview" className="mt-3 h-20 w-20 rounded-xl object-cover border" />}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">Project seriousness</label>
            <select value={seriousness} onChange={(e) => setSeriousness(e.target.value)} className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]">
              <option value="SCHOOL_PROJECT">School project</option>
              <option value="SIDE_PROJECT">Side project</option>
              <option value="SERIOUS_STARTUP">Serious startup</option>
              <option value="FULL_TIME_FUNDING">Full-time / looking for funding</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">Team compensation</label>
            <select value={teamCompensation} onChange={(e) => setTeamCompensation(e.target.value)} className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]">
              <option value="UNPAID">Unpaid / volunteer</option>
              <option value="PAID">Paid</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">Problem</label>
            <textarea value={problem} onChange={(e) => setProblem(e.target.value)} maxLength={500} rows={3}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]" />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">Solution</label>
            <textarea value={solution} onChange={(e) => setSolution(e.target.value)} maxLength={500} rows={3}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]" />
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-zinc-900">Who We&apos;re Looking For</label>
              <button
                type="button"
                onClick={() => setRolesNeeded((prev) => [...prev, { title: "", description: "" }])}
                className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Add role
              </button>
            </div>
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
                      }}
                      placeholder="Role title (e.g. Frontend Developer)"
                      className="flex-1 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
                    />
                    {rolesNeeded.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setRolesNeeded((prev) => prev.filter((_, i) => i !== idx))}
                        className="rounded-full p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
                    className="w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900">Market & Competition</h2>

          <div>
            <label className="block text-sm font-medium text-zinc-700">Target customer</label>
            <input type="text" value={targetCustomer} onChange={(e) => setTargetCustomer(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]" />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">Scope</label>
            <select value={scope} onChange={(e) => setScope(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]">
              <option value="">Select</option>
              <option value="Swiss">Swiss</option>
              <option value="International">International</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">Competitive landscape</label>
            <textarea value={competitiveLandscape} onChange={(e) => setCompetitiveLandscape(e.target.value)} rows={3}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]" />
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900">Investor Section</h2>
          <p className="text-xs text-zinc-400">Visible to investors when enabled.</p>

          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" checked={investorVisible} onChange={(e) => setInvestorVisible(e.target.checked)}
              className="rounded border-zinc-300" />
            Show to investors
          </label>

          <div>
            <label className="block text-sm font-medium text-zinc-700">Investor pitch</label>
            <textarea value={investorPitch} onChange={(e) => setInvestorPitch(e.target.value)} rows={3}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700">Funding amount (CHF)</label>
              <input type="number" value={fundingAmount} onChange={(e) => setFundingAmount(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">Use of funds</label>
            <textarea value={useOfFunds} onChange={(e) => setUseOfFunds(e.target.value)} rows={2}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]" />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">Traction metrics</label>
            <textarea value={tractionMetrics} onChange={(e) => setTractionMetrics(e.target.value)} rows={2}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]" />
          </div>
        </div>

        <div className="flex gap-3">
          <Link href={`/projects/${params.id}`}
            className="flex-1 rounded-md border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 text-center transition-colors">
            Cancel
          </Link>
          <button type="submit" disabled={loading}
            className="flex-1 rounded-md bg-[#1e40af] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50 transition-colors">
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
