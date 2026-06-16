"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Mountain, Briefcase, Banknote, MailCheck, Target } from "lucide-react";

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
  const [isStudent, setIsStudent] = useState(false);
  const [schoolId, setSchoolId] = useState("");
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/schools")
      .then((r) => (r.ok ? r.json() : { schools: [] }))
      .then((d) => setSchools(d.schools || []))
      .catch(() => {});
  }, []);

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
        body: JSON.stringify({ name, email, password, role, skills, acceptedTerms, confirmedAge, isStudent, schoolId: isStudent ? schoolId : null }),
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
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
            <MailCheck className="h-6 w-6 text-[#1e40af]" />
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
            className="mt-6 inline-block rounded-md bg-[#1e40af] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#1d4ed8] transition-colors"
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
            <Mountain className="h-6 w-6 text-[#1e40af]" />
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
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
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
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
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
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
              placeholder="At least 8 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              I am a...
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(
                [
                  { value: "FOUNDER", label: "Founder", icon: RocketIcon },
                  { value: "PROFESSIONAL", label: "Professional", icon: Briefcase },
                  { value: "INVESTOR", label: "Investor", icon: Banknote },
                  { value: "MENTOR", label: "Mentor", icon: Target },
                ] as const
              ).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRole(value)}
                  className={`flex flex-col items-center gap-1 rounded-lg border-2 p-3 text-sm transition-colors ${
                    role === value
                      ? "border-[#1e40af] bg-blue-50 text-[#1e40af]"
                      : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Student toggle + school select */}
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <span className="text-sm font-medium text-purple-800">🎓 Are you a student?</span>
              <input
                type="checkbox"
                checked={isStudent}
                onChange={(e) => setIsStudent(e.target.checked)}
                className="h-4 w-4 rounded border-purple-300"
              />
            </label>
            {isStudent && (
              <div className="mt-3">
                <label className="block text-xs font-medium text-purple-800">Select your school</label>
                <select
                  value={schoolId}
                  onChange={(e) => setSchoolId(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none"
                >
                  <option value="">Select your school (optional)</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-purple-600">
                  School not listed?{" "}
                  <Link href="/schools/register" className="font-medium underline">Suggest it →</Link>
                </p>
              </div>
            )}
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
                      ? "border-[#1e40af] bg-blue-50 text-[#1e40af]"
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
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 text-[#1e40af] focus:ring-[#3b82f6]"
            />
            <span className="text-sm text-zinc-600">
              I agree to the{" "}
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#1e40af] hover:underline"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#1e40af] hover:underline"
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
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 text-[#1e40af] focus:ring-[#3b82f6]"
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
                    ? "bg-[#1e40af] hover:bg-[#1d4ed8] cursor-pointer"
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
            className="font-medium text-[#1e40af] hover:text-[#1e40af]"
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
