import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseRoles(roles: string): string[] {
  try {
    return JSON.parse(roles);
  } catch {
    return ["PROFESSIONAL"];
  }
}

export function formatActivityStatus(status: string): string {
  switch (status) {
    case "ACTIVE_THIS_WEEK":
      return "Active this week";
    case "OCCASIONALLY_ACTIVE":
      return "Occasionally active";
    case "INACTIVE":
      return "Inactive";
    default:
      return status;
  }
}

export function formatStage(stage: string): string {
  switch (stage) {
    case "IDEA":
      return "Idea";
    case "MVP":
      return "MVP";
    case "EARLY_REVENUE":
      return "Early Revenue";
    case "SCALING":
      return "Scaling";
    case "LAUNCHED":
      return "Launched";
    default:
      return stage;
  }
}

// Per-stage badge colors (subtle bg + text).
export function stageBadgeClass(stage: string): string {
  switch (stage) {
    case "IDEA": return "bg-blue-50 text-blue-700";
    case "MVP": return "bg-amber-50 text-amber-700";
    case "EARLY_REVENUE": return "bg-green-50 text-green-700";
    case "SCALING": return "bg-purple-50 text-purple-700";
    case "LAUNCHED": return "bg-emerald-50 text-emerald-700";
    default: return "bg-[#f1f5f9] text-[#475569]";
  }
}

// Ordered project lifecycle stages, used by the progress tracker.
export const PROJECT_STAGES: { value: string; label: string }[] = [
  { value: "IDEA", label: "Idea" },
  { value: "MVP", label: "MVP" },
  { value: "EARLY_REVENUE", label: "Early Revenue" },
  { value: "SCALING", label: "Scaling" },
  { value: "LAUNCHED", label: "Launched" },
];

export function formatAvailability(avail: string): string {
  switch (avail) {
    case "FULL_TIME":
      return "Full-time";
    case "PART_TIME":
      return "Part-time";
    case "ADVISORY":
      return "Advisory";
    case "FLEXIBLE":
      return "Flexible";
    default:
      return avail;
  }
}

export function swissCities(): { city: string; canton: string }[] {
  return [
    { city: "Zürich", canton: "ZH" },
    { city: "Geneva", canton: "GE" },
    { city: "Basel", canton: "BS" },
    { city: "Bern", canton: "BE" },
    { city: "Lausanne", canton: "VD" },
    { city: "Lucerne", canton: "LU" },
    { city: "St. Gallen", canton: "SG" },
    { city: "Lugano", canton: "TI" },
    { city: "Winterthur", canton: "ZH" },
    { city: "Zug", canton: "ZG" },
  ];
}

export const industries = [
  "FinTech",
  "DeepTech",
  "Health",
  "Climate",
  "EdTech",
  "Robotics",
  "Consumer",
  "B2B SaaS",
  "Logistics",
  "Legal",
  "Real Estate",
  "Other",
] as const;

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const SWISS_CANTONS = [
  "Aargau", "Appenzell Ausserrhoden", "Appenzell Innerrhoden", "Basel-Landschaft",
  "Basel-Stadt", "Bern", "Fribourg", "Geneva", "Glarus", "Graubünden", "Jura",
  "Lucerne", "Neuchâtel", "Nidwalden", "Obwalden", "Schaffhausen", "Schwyz",
  "Solothurn", "St. Gallen", "Thurgau", "Ticino", "Uri", "Valais", "Vaud",
  "Zug", "Zürich",
];

export const SCHOOL_TYPES = [
  { value: "GYMNASIUM", label: "Gymnasium" },
  { value: "BERUFSSCHULE", label: "Berufsschule" },
  { value: "UNIVERSITY", label: "University" },
  { value: "ORGANIZATION", label: "Organization (e.g. YES Project)" },
];

export function formatSchoolType(type: string): string {
  return SCHOOL_TYPES.find((t) => t.value === type)?.label || type;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function stripTags(value: string): string {
  return value.replace(/<[^>]*>/g, "");
}

// Only allow http(s) URLs — blocks javascript:, data:, etc. Returns "" if invalid.
export function sanitizeUrl(value: unknown): string {
  const url = String(value ?? "").trim();
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url.slice(0, 500);
  return "";
}

// Known disposable / throwaway email domains — blocked at signup.
export const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "guerrillamail.com", "tempmail.com", "throwaway.email", "mailinator.com",
  "yopmail.com", "guerrillamail.info", "grr.la", "guerrillamail.net",
  "sharklasers.com", "guerrillamail.org", "guerrillamail.de", "tmail.com",
  "temp-mail.org",
]);

export function isDisposableEmail(email: string): boolean {
  const domain = String(email).toLowerCase().split("@")[1] || "";
  return DISPOSABLE_EMAIL_DOMAINS.has(domain);
}

export function limitStr(value: unknown, max: number): string {
  const s = typeof value === "string" ? value : "";
  return s.slice(0, max);
}

export function parseRolesNeeded(value: string | null | undefined): { title: string; description: string }[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter((r: unknown) => r && typeof (r as any).title === "string");
  } catch {}
  return [];
}
