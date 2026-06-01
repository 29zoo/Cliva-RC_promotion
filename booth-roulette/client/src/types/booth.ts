export type Prize = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  sortOrder: number;
  wheelSlots: number;
  stock: number;
};

/** @deprecated Use Prize */
export type Product = Pick<Prize, "id" | "name" | "emoji" | "color">;

export type JobType =
  | "doctor"
  | "nurse"
  | "paramedic"
  | "therapist"
  | "admin"
  | "student"
  | "other";

export type VipEntry = {
  nameKr: string;
  nameEn: string;
  affiliation: string;
};

export type Participant = {
  id?: number;
  ts: string;
  name: string;
  affiliation: string;
  jobType: JobType | string;
  phone: string;
  prize: string;
  isVip: boolean;
  quizQuestionId?: number | null;
  quizCorrect?: boolean | null;
  completedAt?: string | null;
};

export type BoothState = {
  wheelSegmentCount: number;
  prizes: Prize[];
  vipList: VipEntry[];
  participants: Participant[];
};

export type SessionParticipant = {
  id: number;
  name: string;
  affiliation: string;
  jobType: JobType | string;
  phone: string;
  isVip: boolean;
};

export type ScreenName =
  | "welcome"
  | "info"
  | "video"
  | "quiz"
  | "roulette"
  | "vip-thankyou"
  | "admin";

export type WheelSegment = {
  productId: string;
  name: string;
  emoji: string;
  color: string;
  start: number;
  end: number;
  center: number;
  sweep: number;
};

export type QuizQuestion = {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};
