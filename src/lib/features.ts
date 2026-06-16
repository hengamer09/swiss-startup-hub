// Per-feature visual identity. The redesign gives each area of the app its own
// signature accent so they are instantly distinguishable instead of reading as
// one undifferentiated wall of white cards.
//
// Class strings are written out in full (not composed dynamically) so Tailwind's
// scanner picks them up.

export type FeatureKey =
  | "projects"
  | "schools"
  | "mentors"
  | "events"
  | "funding";

export interface FeatureStyle {
  /** Short uppercase label used in section headers and nav. */
  label: string;
  /** Solid accent — used for the section tick and active underlines. */
  tick: string;
  /** Accent text colour. */
  text: string;
  /** Soft tinted background for small labels / icon tiles. */
  soft: string;
  /** Hover underline colour for nav links (decoration). */
  underline: string;
  /** Top route for this feature. */
  href: string;
}

export const FEATURES: Record<FeatureKey, FeatureStyle> = {
  projects: {
    label: "Projects",
    tick: "bg-blue-600",
    text: "text-blue-700",
    soft: "bg-blue-50 text-blue-700",
    underline: "decoration-blue-600",
    href: "/feed",
  },
  schools: {
    label: "Schools",
    tick: "bg-purple-600",
    text: "text-purple-700",
    soft: "bg-purple-50 text-purple-700",
    underline: "decoration-purple-600",
    href: "/schools",
  },
  mentors: {
    label: "Mentors",
    tick: "bg-teal-600",
    text: "text-teal-700",
    soft: "bg-teal-50 text-teal-700",
    underline: "decoration-teal-600",
    href: "/mentors",
  },
  events: {
    label: "Events",
    tick: "bg-amber-500",
    text: "text-amber-700",
    soft: "bg-amber-50 text-amber-700",
    underline: "decoration-amber-500",
    href: "/events",
  },
  funding: {
    label: "Fundraising",
    tick: "bg-emerald-600",
    text: "text-emerald-700",
    soft: "bg-emerald-50 text-emerald-700",
    underline: "decoration-emerald-600",
    href: "/feed?fundraiser=true",
  },
};
