export type VipRow = { nameKr: string; nameEn: string; affiliation: string };

export function normalizeStr(s: string): string {
  return (s || "").toString().toLowerCase().replace(/\s+/g, "").replace(/[().,-]/g, "");
}

export function findVipMatch(
  vipList: VipRow[],
  inputName: string,
  inputAffiliation: string,
): VipRow | null {
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
