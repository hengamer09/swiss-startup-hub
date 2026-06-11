"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Mountain, Sparkles, Rocket, Briefcase, Banknote } from "lucide-react";

const SKILL_OPTIONS = [
  "React", "TypeScript", "Python", "Go", "Rust", "Solidity",
  "UI/UX Design", "Graphic Design", "Product Management",
  "Marketing", "Growth", "Sales", "Business Development",
  "Financial Modeling", "Accounting", "Legal",
  "Hardware Engineering", "Mechanical Engineering", "Electrical Engineering",
  "Machine Learning", "Data Science", "DevOps", "Mobile Development",
  "Operations", "HR", "Community Building",
];

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>("PROFESSIONAL");
  const [skills, setSkills] = useState<string[]>([]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function toggleSkill(skill: string) {
    setSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : prev.length < 3
          ? [...prev, skill]
          : prev
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (skills.length === 0) {
      setError("Please select at least one skill/interest");
      setLoading(false);
      return;
    }

    if (!acceptedTerms) {
      setError("Please accept the Terms of Service and Privacy Policy to continue");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, skills, acceptedTerms }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      router.push("/feed");
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="mx-auto mb-4 flex w-fit items-center gap-2 text-lg font-semibold"
          >
            <Mountain className="h-6 w-6 text-red-500" />
            Swiss Startup Hub
          </Link>
          <h1 className="text-xl font-semibold text-zinc-900">
            Join the ecosystem
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Create your profile in under a minute
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
              Full name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              placeholder="Maria Meier"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              placeholder="maria@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              placeholder="At least 8 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              I am a...
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { value: "FOUNDER", label: "Founder", icon: Rocket, activeClass: "border-red-500 bg-red-50 text-red-700" },
                  { value: "PROFESSIONAL", label: "Professional", icon: Briefcase, activeClass: "border-blue-500 bg-blue-50 text-blue-700" },
                  { value: "INVESTOR", label: "Investor", icon: Banknote, activeClass: "border-amber-500 bg-amber-50 text-amber-700" },
                ] as const
              ).map(({ value, label, icon: Icon, activeClass }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRole(value)}
                  className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-sm transition-all ${
                    role === value
                      ? activeClass
                      : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Pick 1–3 skills or interests
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SKILL_OPTIONS.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                    skills.includes(skill)
                      ? "border-red-500 bg-red-50 text-red-700"
                      : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              {skills.length}/3 selected
            </p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 text-red-500 focus:ring-red-500"
            />
            <span className="text-sm text-zinc-600">
              I agree to the{" "}
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-red-500 hover:underline"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-red-500 hover:underline"
              >
                Privacy Policy
              </a>
            </span>
          </label>

          <button
            type="submit"
            disabled={loading || skills.length === 0}
            className="w-full rounded-full bg-red-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link
            href="/auth/signin"
            className="font-medium text-red-500 hover:text-red-600"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
