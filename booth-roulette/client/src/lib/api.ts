import type { BoothState, JobType, Participant } from "../types/booth";

export async function fetchBoothState(): Promise<BoothState> {
  const res = await fetch("/api/booth/state");
  if (!res.ok) throw new Error("상태를 불러오지 못했습니다.");
  return res.json() as Promise<BoothState>;
}

export async function saveBoothState(state: BoothState): Promise<BoothState> {
  const res = await fetch("/api/booth/state", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state),
  });
  if (!res.ok) throw new Error("상태 저장에 실패했습니다.");
  return res.json() as Promise<BoothState>;
}

export type RegisterPayload = {
  name: string;
  affiliation: string;
  jobType: JobType;
  phone: string;
};

export type RegisterResponse = {
  participant: Participant & { id: number };
  isVip: boolean;
  vipMatch: { nameKr: string; nameEn: string; affiliation: string } | null;
};

export async function registerParticipant(payload: RegisterPayload): Promise<RegisterResponse> {
  const res = await fetch("/api/booth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as RegisterResponse & { message?: string };
  if (!res.ok) {
    throw new Error(data.message ?? "등록에 실패했습니다.");
  }
  return data;
}

export async function saveQuizResult(
  participantId: number,
  quizQuestionId: number,
  quizCorrect: boolean,
): Promise<void> {
  const res = await fetch(`/api/booth/participants/${participantId}/quiz`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quizQuestionId, quizCorrect }),
  });
  if (!res.ok) throw new Error("퀴즈 결과 저장에 실패했습니다.");
}

export async function savePrizeResult(
  participantId: number,
  prize: string,
  productId: string,
): Promise<BoothState> {
  const res = await fetch(`/api/booth/participants/${participantId}/prize`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prize, productId }),
  });
  const data = (await res.json()) as { state?: BoothState; message?: string };
  if (!res.ok) {
    throw new Error(data.message ?? "당첨 저장에 실패했습니다.");
  }
  return data.state ?? fetchBoothState();
}
