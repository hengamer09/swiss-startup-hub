// Pure helper — computes profile completeness from a user-like object.
// Safe to use on both server and client (no imports with side effects).

export interface CompletenessInput {
  name?: string | null;
  emailVerified?: boolean | null;
  image?: string | null;
  bio?: string | null;
  skillsCount?: number;
  rolesCount?: number;
  portfolioUrl?: string | null;
  websiteUrl?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  portfolio?: string | null;
}

export interface CompletenessItem {
  key: string;
  label: string;
  suggestion: string;
  weight: number;
  done: boolean;
}

export interface CompletenessResult {
  percent: number;
  items: CompletenessItem[];
  /** First incomplete item, or null when the profile is 100%. */
  nextMissing: (CompletenessItem & { reachPercent: number }) | null;
}

export function computeProfileCompleteness(u: CompletenessInput): CompletenessResult {
  const hasLinks = Boolean(
    u.portfolioUrl || u.websiteUrl || u.githubUrl || u.linkedinUrl || u.portfolio
  );

  const items: CompletenessItem[] = [
    {
      key: "name",
      label: "Add your name",
      suggestion: "Add your name",
      weight: 15,
      done: Boolean(u.name && u.name.trim().length > 0),
    },
    {
      key: "emailVerified",
      label: "Verify your email",
      suggestion: "Verify your email address",
      weight: 15,
      done: Boolean(u.emailVerified),
    },
    {
      key: "image",
      label: "Add a profile picture",
      suggestion: "Add a profile picture",
      weight: 20,
      done: Boolean(u.image),
    },
    {
      key: "bio",
      label: "Write a bio",
      suggestion: "Write a short bio (at least 20 characters)",
      weight: 15,
      done: Boolean(u.bio && u.bio.trim().length >= 20),
    },
    {
      key: "skills",
      label: "Add at least 3 skills",
      suggestion: "Add at least 3 skills",
      weight: 15,
      done: (u.skillsCount ?? 0) >= 3,
    },
    {
      key: "roles",
      label: "Select an interest or role",
      suggestion: "Select at least one interest or role",
      weight: 10,
      done: (u.rolesCount ?? 0) >= 1,
    },
    {
      key: "links",
      label: "Add portfolio or links",
      suggestion: "Add a portfolio or profile link",
      weight: 10,
      done: hasLinks,
    },
  ];

  const percent = items.reduce((sum, it) => sum + (it.done ? it.weight : 0), 0);

  // Find the next missing item and the percentage reached once completed.
  let nextMissing: CompletenessResult["nextMissing"] = null;
  for (const it of items) {
    if (!it.done) {
      nextMissing = { ...it, reachPercent: percent + it.weight };
      break;
    }
  }

  return { percent, items, nextMissing };
}
