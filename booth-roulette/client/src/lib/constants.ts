import type { JobType } from "../types/booth";

export const JOB_TYPES: { id: JobType; label: string }[] = [
  { id: "doctor", label: "의사" },
  { id: "nurse", label: "간호사" },
  { id: "paramedic", label: "응급구조사" },
  { id: "therapist", label: "치료사" },
  { id: "admin", label: "행정" },
  { id: "student", label: "학생" },
  { id: "other", label: "기타" },
];

export function jobTypeLabel(id: string): string {
  return JOB_TYPES.find((j) => j.id === id)?.label ?? id;
}

/** client/.env → VITE_PROMO_VIDEO_URL (YouTube embed URL 또는 /promo.mp4 등) */
export const PROMO_VIDEO_URL =
  import.meta.env.VITE_PROMO_VIDEO_URL?.trim() || "";

export const MIN_VIDEO_SECONDS = 10;
