export type Role = "FOUNDER" | "PROFESSIONAL" | "INVESTOR";
export type StartupStage = "IDEA" | "MVP" | "EARLY_REVENUE" | "SCALING";
export type Availability = "FULL_TIME" | "PART_TIME" | "ADVISORY" | "FLEXIBLE";
export type ActivityStatus = "ACTIVE_THIS_WEEK" | "OCCASIONALLY_ACTIVE" | "INACTIVE";
export type JoinRequestStatus = "PENDING" | "ACCEPTED" | "DECLINED";

export interface UserWithRelations {
  id: string;
  name: string;
  email: string;
  image: string | null;
  bio: string | null;
  location: string | null;
  canton: string | null;
  roles: string;
  activityStatus: string;
  identityVerified: boolean;
  isEarlyMember: boolean;
  averageRating: number;
  ratingCount: number;
  openToMessages: boolean;
  skills: { skill: { id: string; name: string } }[];
  memberships: { projectId: string; project: { name: string }; roleTitle: string; isFounder: boolean }[];
}

export interface ProjectWithRelations {
  id: string;
  name: string;
  logo: string | null;
  problem: string | null;
  solution: string | null;
  industry: string | null;
  stage: string;
  location: string;
  isRemote: boolean;
  teamSize: number;
  followerCount: number;
  createdAt: Date;
  owner: { id: string; name: string; image: string | null };
  members: {
    id: string;
    user: { id: string; name: string; image: string | null; identityVerified: boolean };
    roleTitle: string;
    isFounder: boolean;
  }[];
  openRoles: OpenRole[];
  faqs: FAQ[];
}

export interface OpenRole {
  id: string;
  title: string;
  skills: string;
  commitment: string;
  description: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  order: number;
}
