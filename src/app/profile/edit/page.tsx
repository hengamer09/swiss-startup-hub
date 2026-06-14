"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ArrowLeft, User, Save, Plus, Trash2, X } from "lucide-react";
import Link from "next/link";
import { parseRoles } from "@/lib/utils";

export default function EditProfilePage() {
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();
  const [name, setName] = useState(session?.user?.name || "");
  const [bio, setBio] = useState("");
  const [image, setImage] = useState(session?.user?.image || "");
  const [country, setCountry] = useState("");
  const [location, setLocation] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [customRole, setCustomRole] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [portfolioProjects, setPortfolioProjects] = useState<any[]>([]);
  const [openToMessages, setOpenToMessages] = useState(true);
  const [preferredStage, setPreferredStage] = useState("");
  const [ticketSizeMin, setTicketSizeMin] = useState("");
  const [ticketSizeMax, setTicketSizeMax] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const deleteTriggerRef = useRef<HTMLButtonElement>(null);
  const deleteConfirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    async function loadProfile() {
      const res = await fetch("/api/users/me");
      if (!res.ok) return;
      const user = await res.json();
      setName(user.name || "");
      setBio(user.bio || "");
      setImage(user.image || "");
      setCountry(user.country || "");
      setLocation(user.location || "");
      setWebsiteUrl(user.websiteUrl || "");
      setPortfolioUrl(user.portfolioUrl || "");
      setGithubUrl(user.githubUrl || "");
      setLinkedinUrl(user.linkedinUrl || "");
      setRoles(parseRoles(user.roles || "[]"));
      setSkills(Array.isArray(user.skills) ? user.skills.map((s: any) => s.skill?.name || s.name || s).filter(Boolean) : []);
      setPortfolioProjects(Array.isArray(user.portfolioProjects) ? user.portfolioProjects : []);
    }
    loadProfile();
  }, []);

  async function handleUpload(file: File) {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Image upload failed");
      setImage(data.url);
    } catch (err: any) {
      alert(err.message || "Image upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDownloadData() {
    setDownloading(true);
    try {
      const res = await fetch("/api/users/me/export");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Could not export data. Please try again later.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "swiss-startup-hub-data-export.json";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch("/api/users/me", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setDeleteError(data.error || "Failed to delete account. Please try again.");
        setDeleting(false);
        return;
      }
      await signOut({ redirect: false });
      router.push("/");
    } catch {
      setDeleteError("Something went wrong. Please try again.");
      setDeleting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/users/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        bio,
        image,
        country,
        location,
        websiteUrl,
        portfolioUrl,
        githubUrl,
        linkedinUrl,
        roles,
        portfolioProjects,
        openToMessages,
        preferredStage,
        ticketSizeMin: ticketSizeMin ? parseInt(ticketSizeMin) : null,
        ticketSizeMax: ticketSizeMax ? parseInt(ticketSizeMax) : null,
        skills,
      }),
    });

    if (res.ok) {
      await updateSession();
      router.push(`/profile/${session?.user?.id}`);
      return;
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href={`/profile/${session?.user?.id}`}
        className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Profile
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Edit Profile</h1>
          <p className="text-sm text-zinc-500">
            Complete your profile to get more responses
          </p>
        </div>
        {saved && (
          <span className="text-sm text-green-600 font-medium flex items-center gap-1">
            <Save className="h-4 w-4" /> Saved
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900">Basic Info</h2>

          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-zinc-100 text-xl font-bold text-zinc-500">
              {image ? <img src={image} alt="Profile" className="h-full w-full object-cover" /> : <User className="h-6 w-6" />}
            </div>
            <label className="rounded-md border border-zinc-300 px-4 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer">
              {uploading ? "Uploading..." : "Change Photo"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">Full name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Bio <span className="text-zinc-400">(max 280 characters)</span>
            </label>
            <textarea
              maxLength={280}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
              placeholder="Tell the Swiss startup world about yourself..."
            />
            <p className="mt-1 text-xs text-zinc-400">{bio.length}/280</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">Roles</label>
            <p className="mt-1 text-xs text-zinc-500">Choose one or more roles and add custom ones if needed.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {['FOUNDER','PROFESSIONAL','INVESTOR'].map((role) => (
                <button
                  type="button"
                  key={role}
                  onClick={() => setRoles((prev) => prev.includes(role) ? prev.filter((item) => item !== role) : [...prev, role])}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium ${roles.includes(role) ? 'border-[#1e40af] bg-blue-50 text-[#1e40af]' : 'border-zinc-300 text-zinc-700 hover:bg-zinc-50'}`}
                >
                  {role}
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {roles.filter((item) => !['FOUNDER','PROFESSIONAL','INVESTOR'].includes(item)).map((item) => (
                <span key={item} className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">{item}<button type="button" onClick={() => setRoles((prev) => prev.filter((role) => role !== item))} className="text-zinc-400 hover:text-[#1e40af]">×</button></span>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input value={customRole} onChange={(e) => setCustomRole(e.target.value)} placeholder="Add a custom role" className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
              <button type="button" onClick={() => { const trimmed = customRole.trim(); if (!trimmed || roles.includes(trimmed.toUpperCase())) return; setRoles((prev) => [...prev, trimmed.toUpperCase()]); setCustomRole(''); }} className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50">Add</button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">Skills</label>
            <p className="mt-1 text-xs text-zinc-500">Add or remove skills visible on your public profile.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-[#1e40af]"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => setSkills((prev) => prev.filter((s) => s !== skill))}
                    className="text-blue-200 hover:text-[#1e40af] transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const trimmed = skillInput.trim().slice(0, 100);
                    if (trimmed && !skills.includes(trimmed) && skills.length < 20) {
                      setSkills((prev) => [...prev, trimmed]);
                      setSkillInput("");
                    }
                  }
                }}
                placeholder="Type a skill and press Enter"
                className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
              />
              <button
                type="button"
                onClick={() => {
                  const trimmed = skillInput.trim().slice(0, 100);
                  if (trimmed && !skills.includes(trimmed) && skills.length < 20) {
                    setSkills((prev) => [...prev, trimmed]);
                    setSkillInput("");
                  }
                }}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700">Country</label>
              <select value={country} onChange={(e) => setCountry(e.target.value)} className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]">
                <option value="">Select a country</option>
                <option value="Switzerland">Switzerland</option>
                <option value="Germany">Germany</option>
                <option value="France">France</option>
                <option value="Italy">Italy</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">City</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]" placeholder="e.g. Zurich" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900">Portfolio & Links</h2>

          <div>
            <label className="block text-sm font-medium text-zinc-700">Personal website</label>
            <input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]" placeholder="https://" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">Portfolio / CV</label>
            <input type="url" value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]" placeholder="https://" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">GitHub</label>
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
              placeholder="https://github.com/..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">LinkedIn</label>
            <input type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]" placeholder="https://linkedin.com/in/..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">GitHub / Code</label>
            <input type="url" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]" placeholder="https://github.com/..." />
          </div>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900">Portfolio projects</h3>
              <button type="button" onClick={() => setPortfolioProjects((prev) => [...prev, { title: '', description: '', link: '' }])} className="inline-flex items-center gap-1 rounded-md border border-zinc-300 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-100"><Plus className="h-3.5 w-3.5" />Add entry</button>
            </div>
            {portfolioProjects.map((entry, idx) => (
              <div key={idx} className="rounded-lg border border-zinc-200 bg-white p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-zinc-700">Entry {idx + 1}</p>
                  <button type="button" onClick={() => setPortfolioProjects((prev) => prev.filter((_, index) => index !== idx))} className="text-zinc-400 hover:text-[#1e40af]"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
                <input value={entry.title || ''} onChange={(e) => setPortfolioProjects((prev) => prev.map((item, index) => index === idx ? { ...item, title: e.target.value } : item))} placeholder="Project title" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
                <textarea value={entry.description || ''} onChange={(e) => setPortfolioProjects((prev) => prev.map((item, index) => index === idx ? { ...item, description: e.target.value } : item))} rows={2} placeholder="Describe the project or achievement" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
                <input value={entry.link || ''} onChange={(e) => setPortfolioProjects((prev) => prev.map((item, index) => index === idx ? { ...item, link: e.target.value } : item))} placeholder="https://example.com" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900">Investor Settings</h2>
          <p className="text-xs text-zinc-400">
            These fields are only shown if you have the Investor role.
          </p>

          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={openToMessages}
              onChange={(e) => setOpenToMessages(e.target.checked)}
              className="rounded border-zinc-300"
            />
            Open to receiving messages from founders
          </label>

          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Preferred startup stage
            </label>
            <select
              value={preferredStage}
              onChange={(e) => setPreferredStage(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
            >
              <option value="">Any stage</option>
              <option value="IDEA">Idea</option>
              <option value="MVP">MVP</option>
              <option value="EARLY_REVENUE">Early Revenue</option>
              <option value="SCALING">Scaling</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700">
                Min ticket (CHF)
              </label>
              <input
                type="number"
                value={ticketSizeMin}
                onChange={(e) => setTicketSizeMin(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
                placeholder="10000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">
                Max ticket (CHF)
              </label>
              <input
                type="number"
                value={ticketSizeMax}
                onChange={(e) => setTicketSizeMax(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
                placeholder="100000"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-[#1e40af] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50 transition-colors"
        >
          {loading ? "Saving..." : "Save Profile"}
        </button>
      </form>

      {/* Your data */}
      <div className="mt-12 rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-zinc-900">Your Data</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Download a copy of all personal data we hold about you (GDPR / nDSG right to data portability).
        </p>
        <button
          type="button"
          onClick={handleDownloadData}
          disabled={downloading}
          className="mt-4 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 transition-colors focus:outline-2 focus:outline-zinc-600"
        >
          {downloading ? "Preparing download…" : "Download my data"}
        </button>
      </div>

      {/* Account deletion */}
      <div className="mt-6 rounded-xl border border-red-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-zinc-900">Danger Zone</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Permanently delete your account and all associated data. This cannot be undone.
        </p>
        <button
          ref={deleteTriggerRef}
          type="button"
          onClick={() => setDeleteModalOpen(true)}
          className="mt-4 rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors focus:outline-2 focus:outline-red-600"
        >
          Delete my account
        </button>
      </div>

      {/* Delete confirmation modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
          >
            <h2 id="delete-modal-title" className="text-lg font-semibold text-zinc-900">
              Delete your account?
            </h2>
            <p className="mt-3 text-sm text-zinc-600 leading-relaxed">
              This will permanently delete all your data including your profile, projects, messages,
              and join requests. <strong>This cannot be undone.</strong>
            </p>
            {deleteError && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
                {deleteError}
              </p>
            )}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setDeleteError("");
                  deleteTriggerRef.current?.focus();
                }}
                className="flex-1 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors focus:outline-2 focus:outline-[#1e40af]"
              >
                Cancel
              </button>
              <button
                ref={deleteConfirmRef}
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors focus:outline-2 focus:outline-red-600"
              >
                {deleting ? "Deleting..." : "Yes, delete my account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
