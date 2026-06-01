import type { VipEntry } from "../types/booth";

export function normalizeStr(s: string): string {
  return (s || "").toString().toLowerCase().replace(/\s+/g, "").replace(/[().,-]/g, "");
}

export function findVipMatch(
  vipList: VipEntry[],
  inputName: string,
  inputAffiliation: string,
): VipEntry | null {
  if (!inputName || vipList.length === 0) return null;

  const inN = normalizeStr(inputName);
  const inA = normalizeStr(inputAffiliation);

  let match = vipList.find((v) => {
    const vEn = normalizeStr(v.nameEn);
    const vAff = normalizeStr(v.affiliation);
    return vEn && vEn === inN && (!inA || !vAff || vAff.includes(inA) || inA.includes(vAff));
  });
  if (match) return match;

  match = vipList.find((v) => {
    const vKr = normalizeStr(v.nameKr);
    const vAff = normalizeStr(v.affiliation);
    return vKr && vKr === inN && (!inA || !vAff || vAff.includes(inA) || inA.includes(vAff));
  });
  if (match) return match;

  match = vipList.find((v) => {
    const vEn = normalizeStr(v.nameEn);
    const vKr = normalizeStr(v.nameKr);
    return (vEn && vEn === inN) || (vKr && vKr === inN);
  });
  return match ?? null;
}

export function isDuplicateParticipant(
  participants: { name: string; affiliation: string }[],
  name: string,
  affiliation: string,
): boolean {
  const n = name.toLowerCase().replace(/\s+/g, "");
  const a = affiliation.toLowerCase().replace(/\s+/g, "");
  return participants.some(
    (p) =>
      p.name.toLowerCase().replace(/\s+/g, "") === n &&
      p.affiliation.toLowerCase().replace(/\s+/g, "") === a,
  );
}
