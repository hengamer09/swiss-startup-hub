// Pure helper — computes a project quality/completeness score (0-100).
// Safe on both server and client.

export interface ProjectCompletenessInput {
  name?: string | null;
  problem?: string | null;
  solution?: string | null;
  rolesCount?: number;     // number of roles in "Who we're looking for"
  logo?: string | null;
  stage?: string | null;
  memberCount?: number;    // total team members (incl. founder)
  updateCount?: number;    // ProjectUpdate records
  postCount?: number;      // public chat messages (ProjectPost)
}

export interface CompletenessItem {
  key: string;
  label: string;
  suggestion: string;
  weight: number;
  done: boolean;
}

export interface ProjectCompletenessResult {
  percent: number;
  items: CompletenessItem[];
  nextMissing: (CompletenessItem & { reachPercent: number }) | null;
  level: "incomplete" | "in_progress" | "complete";
  badge: { label: string; className: string };
}

export function computeProjectCompleteness(p: ProjectCompletenessInput): ProjectCompletenessResult {
  const description = `${p.problem || ""} ${p.solution || ""}`.trim();

  const items: CompletenessItem[] = [
    { key: "title", label: "Project name", suggestion: "Add a project name", weight: 10, done: Boolean(p.name && p.name.trim()) },
    { key: "description", label: "Description (50+ chars)", suggestion: "Write a fuller problem & solution (50+ characters)", weight: 15, done: description.length >= 50 },
    { key: "problem", label: "Problem statement", suggestion: "Describe the problem you're solving", weight: 10, done: Boolean(p.problem && p.problem.trim()) },
    { key: "solution", label: "Solution statement", suggestion: "Describe your solution", weight: 10, done: Boolean(p.solution && p.solution.trim()) },
    { key: "roles", label: "Open role(s)", suggestion: "Add at least one role under 'Who we're looking for'", weight: 15, done: (p.rolesCount ?? 0) >= 1 },
    { key: "image", label: "Project image", suggestion: "Upload a project image / logo", weight: 10, done: Boolean(p.logo) },
    { key: "stage", label: "Stage set", suggestion: "Set your project stage beyond 'Idea'", weight: 5, done: Boolean(p.stage) && p.stage !== "IDEA" },
    { key: "team", label: "A teammate", suggestion: "Add at least one team member besides yourself", weight: 10, done: (p.memberCount ?? 0) > 1 },
    { key: "update", label: "A posted update", suggestion: "Post your first weekly update", weight: 10, done: (p.updateCount ?? 0) >= 1 },
    { key: "chat", label: "Public chat activity", suggestion: "Start the conversation in your public chat", weight: 5, done: (p.postCount ?? 0) >= 1 },
  ];

  const percent = items.reduce((sum, it) => sum + (it.done ? it.weight : 0), 0);

  let nextMissing: ProjectCompletenessResult["nextMissing"] = null;
  for (const it of items) {
    if (!it.done) {
      nextMissing = { ...it, reachPercent: percent + it.weight };
      break;
    }
  }

  let level: ProjectCompletenessResult["level"];
  let badge: { label: string; className: string };
  if (percent < 40) {
    level = "incomplete";
    badge = { label: "🔴 Incomplete", className: "bg-red-50 text-red-700" };
  } else if (percent < 70) {
    level = "in_progress";
    badge = { label: "🟡 In Progress", className: "bg-amber-50 text-amber-700" };
  } else {
    level = "complete";
    badge = { label: "🟢 Complete", className: "bg-green-50 text-green-700" };
  }

  return { percent, items, nextMissing, level, badge };
}
