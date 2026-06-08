"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, User, Save } from "lucide-react";
import Link from "next/link";
import { swissCities, industries } from "@/lib/utils";

export default function EditProfilePage() {
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();
  const [name, setName] = useState(session?.user?.name || "");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [canton, setCanton] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [openToMessages, setOpenToMessages] = useState(true);
  const [preferredStage, setPreferredStage] = useState("");
  const [ticketSizeMin, setTicketSizeMin] = useState("");
  const [ticketSizeMax, setTicketSizeMax] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/users/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        bio,
        location,
        canton,
        portfolioUrl,
        githubUrl,
        linkedinUrl,
        openToMessages,
        preferredStage,
        ticketSizeMin: ticketSizeMin ? parseInt(ticketSizeMin) : null,
        ticketSizeMax: ticketSizeMax ? parseInt(ticketSizeMax) : null,
      }),
    });

    if (res.ok) {
      await updateSession();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
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
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-xl font-bold text-zinc-500">
              <User className="h-6 w-6" />
            </div>
            <button
              type="button"
              className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Change Photo
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">Full name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
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
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              placeholder="Tell the Swiss startup world about yourself..."
            />
            <p className="mt-1 text-xs text-zinc-400">{bio.length}/280</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700">City</label>
              <select
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  const found = swissCities().find((c) => c.city === e.target.value);
                  if (found) setCanton(found.canton);
                }}
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              >
                <option value="">Select a city</option>
                {swissCities().map((c) => (
                  <option key={c.city} value={c.city}>
                    {c.city}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">Canton</label>
              <input
                type="text"
                value={canton}
                readOnly
                className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900">Portfolio & Links</h2>

          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Portfolio / Personal website
            </label>
            <input
              type="url"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              placeholder="https://"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">GitHub</label>
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              placeholder="https://github.com/..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">LinkedIn</label>
            <input
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              placeholder="https://linkedin.com/in/..."
            />
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
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
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
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
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
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                placeholder="100000"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-red-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
        >
          {loading ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}
