"use client";

import { useState } from "react";
import Link from "next/link";
import { Mountain, Briefcase, Banknote, MailCheck } from "lucide-react";

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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>("PROFESSIONAL");
  const [skills, setSkills] = useState<string[]>([]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [confirmedAge, setConfirmedAge] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

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

    if (!confirmedAge) {
      setError("You must confirm that you are at least 18 years old");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, skills, acceptedTerms, confirmedAge }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      // Do NOT log the user in — they must verify their email first.
      setRegisteredEmail(data.email || email);
      setLoading(false);
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  if (registeredEmail) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-12 bg-zinc-50">
        <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 shadow-sm text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <MailCheck className="h-6 w-6 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold text-zinc-900">Account created!</h1>
          <p className="mt-3 text-sm text-zinc-600">
            We sent a verification email to{" "}
            <span className="font-medium text-zinc-900">{registeredEmail}</span>.
            Please check your inbox and verify your email to continue.
          </p>
          <p className="mt-2 text-xs text-zinc-400">
            Didn&apos;t get it? Check your spam folder, or request a new link from the
            sign-in page.
          </p>
          <Link
            href="/auth/signin"
            className="mt-6 inline-block rounded-md bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors"
          >
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12 bg-zinc-50">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="mx-auto mb-4 flex w-fit items-center gap-2 text-lg font-semibold text-zinc-900"
          >
            <Mountain className="h-6 w-6 text-red-600" />
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
                  { value: "FOUNDER", label: "Founder", icon: RocketIcon },
                  { value: "PROFESSIONAL", label: "Professional", icon: Briefcase },
                  { value: "INVESTOR", label: "Investor", icon: Banknote },
                ] as const
              ).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRole(value)}
                  className={`flex flex-col items-center gap-1 rounded-lg border-2 p-3 text-sm transition-colors ${
                    role === value
                      ? "border-red-500 bg-red-50 text-red-700"
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
                className="font-medium text-red-600 hover:underline"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-red-600 hover:underline"
              >
                Privacy Policy
              </a>
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmedAge}
              onChange={(e) => setConfirmedAge(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 text-red-500 focus:ring-red-500"
            />
            <span className="text-sm text-zinc-600">
              I confirm that I am at least 18 years old
            </span>
          </label>

          {(() => {
            const ready =
              !loading &&
              name.trim().length > 0 &&
              email.trim().length > 0 &&
              password.length >= 8 &&
              skills.length > 0 &&
              acceptedTerms &&
              confirmedAge;
            return (
              <button
                type="submit"
                disabled={!ready}
                className={`w-full rounded-md px-4 py-2.5 text-sm font-medium text-white transition-colors ${
                  ready
                    ? "bg-red-600 hover:bg-red-700 cursor-pointer"
                    : "bg-zinc-300 cursor-not-allowed opacity-50"
                }`}
              >
                {loading ? "Creating account..." : "Create account"}
              </button>
            );
          })()}
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link
            href="/auth/signin"
            className="font-medium text-red-600 hover:text-red-700"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function RocketIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}
