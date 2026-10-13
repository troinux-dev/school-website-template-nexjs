/** Shared by server and client code. Each colour gives ≥ 4.5:1 with white text. */
export const EVENT_TYPES = ["Exams", "School holidays", "Sports", "Career Day", "Cultural Day", "Meetings"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_STYLE: Record<string, { bg: string; soft: string; text: string }> = {
  Exams: { bg: "#B91C1C", soft: "#FEE2E2", text: "#7F1D1D" },
  "School holidays": { bg: "#15803D", soft: "#DCFCE7", text: "#14532D" },
  Sports: { bg: "#1D4ED8", soft: "#DBEAFE", text: "#1E3A8A" },
  "Career Day": { bg: "#7E22CE", soft: "#F3E8FF", text: "#581C87" },
  "Cultural Day": { bg: "#C2410C", soft: "#FFEDD5", text: "#7C2D12" },
  Meetings: { bg: "#475569", soft: "#E2E8F0", text: "#1E293B" },
};

export const AUDIENCES = ["Parents", "Learners", "Staff"] as const;

export const GALLERY_CATEGORIES = ["Sports", "Cultural", "Academics", "Events"] as const;
export const POST_CATEGORIES = ["Sports", "Activities", "Announcement"] as const;
