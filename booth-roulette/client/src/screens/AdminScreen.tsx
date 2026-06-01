import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { PRODUCTS } from "../lib/products";
import { jobTypeLabel } from "../lib/constants";
import type { BoothState, ProductId, VipEntry } from "../types/booth";

type AdminScreenProps = {
  state: BoothState;
  onUpdateStock: (id: ProductId, count: number) => void;
  onSetVipList: (list: VipEntry[]) => void;
  onExportCsv: () => void;
  onResetParticipants: () => void;
};

function findCol(sampleKeys: string[], patterns: string[]): string | null {
  for (const key of sampleKeys) {
    const norm = key.toString().toLowerCase().replace(/\s+/g, "");
    for (const pat of patterns) {
      if (norm.includes(pat)) return key;
    }
  }
  return null;
}

export function AdminScreen({
  state,
  onUpdateStock,
  onSetVipList,
  onExportCsv,
  onResetParticipants,
}: AdminScreenProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [stockDraft, setStockDraft] = useState<Record<ProductId, number>>({ ...state.stock });

  const showStatus = (type: "success" | "error", msg: string) => {
    setStatus({ type, msg });
    setTimeout(() => setStatus(null), 8000);
  };

  const handleVipFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]!]!;
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

        if (rows.length === 0) {
          showStatus("error", "엑셀에 데이터가 없습니다.");
          return;
        }

        const sampleKeys = Object.keys(rows[0]!);
        let krKey = findCol(sampleKeys, ["한글", "국문", "성명", "이름", "koreanname", "kname"]);
        let enKey = findCol(sampleKeys, ["영문", "영어", "englishname", "ename", "name(eng)", "name_en"]);
        let affKey = findCol(sampleKeys, ["소속", "기관", "병원", "affiliation", "organization", "hospital", "institution"]);

        if (!krKey && !enKey && sampleKeys.length >= 2) {
          krKey = sampleKeys[0]!;
          enKey = sampleKeys[1]!;
          if (sampleKeys.length >= 3) affKey = sampleKeys[2]!;
        }

        const newList: VipEntry[] = rows
          .map((row) => ({
            nameKr: krKey ? String(row[krKey] ?? "").trim() : "",
            nameEn: enKey ? String(row[enKey] ?? "").trim() : "",
            affiliation: affKey ? String(row[affKey] ?? "").trim() : "",
          }))
          .filter((v) => v.nameKr || v.nameEn);

        if (newList.length === 0) {
          showStatus("error", "유효한 명단을 찾지 못했습니다. 컬럼 이름을 확인해주세요.");
          return;
        }

        onSetVipList(newList);
        showStatus(
          "success",
          `${newList.length}명의 VIP 명단을 등록했습니다. (한글=${krKey ?? "-"}, 영문=${enKey ?? "-"}, 소속=${affKey ?? "-"})`,
        );
      } catch (err) {
        showStatus("error", "파일 읽기 실패: " + (err instanceof Error ? err.message : String(err)));
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadTemplate = () => {
    const sample = [
      { 한글이름: "홍길동", 영문이름: "Hong Gildong", 소속: "국립교통재활병원" },
      { 한글이름: "김철수", 영문이름: "Kim Cheolsu", 소속: "서울대학교병원" },
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "VIP명단");
    XLSX.writeFile(wb, "VIP명단_템플릿.xlsx");
  };

  const clearVip = () => {
    if (!confirm(`VIP 명단 ${state.vipList.length}명을 모두 삭제하시겠습니까?`)) return;
    onSetVipList([]);
  };

  const resetAll = () => {
    if (!confirm("참가자 명단을 모두 삭제하시겠습니까?\n(재고는 유지됩니다)")) return;
    if (!confirm("정말 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;
    onResetParticipants();
  };

  return (
    <>
      <div className="app-card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <h2 className="app-h2" style={{ margin: 0 }}>
            ⭐ VIP 명단 <span style={{ fontSize: 16, color: "#94a3b8", fontWeight: "normal" }}>({state.vipList.length}명)</span>
          </h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              ref={fileRef}
              type="file"
              className="file-input"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleVipFile(f);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              style={{
                padding: "8px 12px",
                background: "#f59e0b",
                color: "white",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              📤 엑셀 업로드
            </button>
            <button
              type="button"
              onClick={downloadTemplate}
              style={{
                padding: "8px 12px",
                background: "#e2e8f0",
                color: "#334155",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              📄 템플릿
            </button>
            <button
              type="button"
              onClick={clearVip}
              style={{
                padding: "8px 12px",
                background: "#ef4444",
                color: "white",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              🗑 삭제
            </button>
          </div>
        </div>

        {status ? (
          <div
            style={{
              marginBottom: 12,
              padding: 12,
              borderRadius: 6,
              fontSize: 14,
              background: status.type === "success" ? "#d1fae5" : "#fee2e2",
              color: status.type === "success" ? "#065f46" : "#991b1b",
              border: status.type === "success" ? "1px solid #6ee7b7" : "1px solid #fca5a5",
            }}
          >
            {status.msg}
          </div>
        ) : null}

        <div style={{ overflowX: "auto", maxHeight: 300, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: 8 }}>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>한글이름</th>
                <th>영문이름</th>
                <th>소속</th>
              </tr>
            </thead>
            <tbody>
              {state.vipList.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>
                    VIP 명단이 비어있습니다. 엑셀을 업로드해주세요.
                  </td>
                </tr>
              ) : (
                state.vipList.map((v, i) => (
                  <tr key={i}>
                    <td style={{ color: "#94a3b8" }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{v.nameKr || "-"}</td>
                    <td style={{ color: "#475569" }}>{v.nameEn || "-"}</td>
                    <td style={{ color: "#475569" }}>{v.affiliation || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 12 }}>
          엑셀 컬럼: <code>한글이름 / 영문이름 / 소속</code> 순서 또는 비슷한 이름의 헤더가 자동 인식됩니다.
        </p>
      </div>

      <div className="app-card">
        <h2 className="app-h2">📦 상품 재고 관리</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {PRODUCTS.map((p) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 130, fontWeight: 600, color: "#334155" }}>
                {p.emoji} {p.name}
              </div>
              <input
                type="number"
                min={0}
                value={stockDraft[p.id]}
                onChange={(e) =>
                  setStockDraft((d) => ({ ...d, [p.id]: parseInt(e.target.value, 10) || 0 }))
                }
                style={{
                  flex: 1,
                  padding: 10,
                  border: "2px solid #e2e8f0",
                  borderRadius: 8,
                  fontSize: 16,
                  fontWeight: 600,
                }}
              />
              <button
                type="button"
                onClick={() => onUpdateStock(p.id, stockDraft[p.id])}
                style={{
                  padding: "10px 16px",
                  background: "#1e3a5f",
                  color: "white",
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                저장
              </button>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 12 }}>
          당첨 확률은 잔여 수량에 비례합니다. 모든 상품 재고가 0이 되면 참여가 중단됩니다.
        </p>
      </div>

      <div className="app-card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <h2 className="app-h2" style={{ margin: 0 }}>
            👥 참가자 명단{" "}
            <span style={{ fontSize: 16, color: "#94a3b8", fontWeight: "normal" }}>
              ({state.participants.filter((p) => p.completedAt).length}명 완료)
            </span>
          </h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={onExportCsv}
              style={{
                padding: "8px 12px",
                background: "#1e3a5f",
                color: "white",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              📥 CSV 내보내기
            </button>
            <button
              type="button"
              onClick={resetAll}
              style={{
                padding: "8px 12px",
                background: "#ef4444",
                color: "white",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              🗑 초기화
            </button>
          </div>
        </div>
        <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: 8 }}>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>시각</th>
                <th>VIP</th>
                <th>이름</th>
                <th>소속</th>
                <th>직종</th>
                <th>전화</th>
                <th>퀴즈</th>
                <th>결과</th>
              </tr>
            </thead>
            <tbody>
              {state.participants.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>
                    아직 참가자가 없습니다
                  </td>
                </tr>
              ) : (
                [...state.participants].reverse().map((p, i) => {
                  const time = new Date(p.ts).toLocaleString("ko-KR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    month: "2-digit",
                    day: "2-digit",
                  });
                  return (
                    <tr key={p.ts + p.name} className={p.isVip ? "vip-row" : ""}>
                      <td style={{ color: "#94a3b8" }}>{state.participants.length - i}</td>
                      <td style={{ color: "#475569" }}>{time}</td>
                      <td>{p.isVip ? <span style={{ color: "#f59e0b", fontSize: 16 }}>⭐</span> : ""}</td>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td style={{ color: "#475569" }}>{p.affiliation || "-"}</td>
                      <td style={{ color: "#475569" }}>{jobTypeLabel(p.jobType)}</td>
                      <td style={{ color: "#475569", fontSize: 12 }}>{p.phone || "-"}</td>
                      <td style={{ color: p.quizCorrect ? "#059669" : p.quizCorrect === false ? "#ef4444" : "#94a3b8" }}>
                        {p.quizCorrect === true ? "O" : p.quizCorrect === false ? "X" : "-"}
                      </td>
                      <td style={{ color: "#1e3a5f", fontWeight: 600 }}>{p.prize || "(진행중)"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
