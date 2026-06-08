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
    default:
      return stage;
  }
}

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
