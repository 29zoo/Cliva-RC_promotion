export type ProductId = "brush" | "battery" | "fan" | "ecobag";

export type Product = {
  id: ProductId;
  name: string;
  emoji: string;
  color: string;
};

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
  stock: Record<ProductId, number>;
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

export type SlotAngle = {
  id: ProductId;
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
