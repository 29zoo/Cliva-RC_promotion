import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { deletePromoVideo, fetchPromoVideo, uploadPromoVideo, type PromoVideoInfo } from "../lib/api";
import { jobTypeLabel } from "../lib/constants";
import { buildWheelSegments, createEmptyPrize, sumWheelSlots } from "../lib/wheel";
import type { BoothState, Prize, VipEntry } from "../types/booth";

type AdminScreenProps = {
  state: BoothState;
  onSavePrizeConfig: (wheelSegmentCount: number, prizes: Prize[]) => Promise<void>;
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

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AdminScreen({
  state,
  onSavePrizeConfig,
  onSetVipList,
  onExportCsv,
  onResetParticipants,
}: AdminScreenProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const promoRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [wheelSegmentCount, setWheelSegmentCount] = useState(state.wheelSegmentCount);
  const [prizeDraft, setPrizeDraft] = useState<Prize[]>(state.prizes.map((p) => ({ ...p })));
  const [prizeSaving, setPrizeSaving] = useState(false);
  const [promoVideo, setPromoVideo] = useState<PromoVideoInfo | null>(null);
  const [promoLoading, setPromoLoading] = useState(true);
  const [promoUploading, setPromoUploading] = useState(false);

  useEffect(() => {
    setWheelSegmentCount(state.wheelSegmentCount);
    setPrizeDraft(state.prizes.map((p) => ({ ...p })));
  }, [state.wheelSegmentCount, state.prizes]);

  const slotSum = sumWheelSlots(prizeDraft);
  const slotsOk = slotSum === wheelSegmentCount;
  const previewSegments = slotsOk ? buildWheelSegments(prizeDraft, wheelSegmentCount) : [];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const info = await fetchPromoVideo();
        if (!cancelled) setPromoVideo(info.url ? info : null);
      } catch {
        if (!cancelled) setPromoVideo(null);
      } finally {
        if (!cancelled) setPromoLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const handlePromoUpload = async (file: File) => {
    setPromoUploading(true);
    try {
      const info = await uploadPromoVideo(file);
      setPromoVideo(info.url ? info : null);
      showStatus("success", `"${file.name}" 홍보 영상을 업로드했습니다.`);
    } catch (err) {
      showStatus("error", err instanceof Error ? err.message : "업로드에 실패했습니다.");
    } finally {
      setPromoUploading(false);
    }
  };

  const handlePromoDelete = async () => {
    if (!confirm("업로드된 홍보 영상을 삭제하시겠습니까?")) return;
    try {
      await deletePromoVideo();
      setPromoVideo(null);
      showStatus("success", "홍보 영상을 삭제했습니다.");
    } catch (err) {
      showStatus("error", err instanceof Error ? err.message : "삭제에 실패했습니다.");
    }
  };

  const updatePrize = (index: number, patch: Partial<Prize>) => {
    setPrizeDraft((list) => list.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  };

  const movePrize = (index: number, dir: -1 | 1) => {
    setPrizeDraft((list) => {
      const next = [...list];
      const target = index + dir;
      if (target < 0 || target >= next.length) return list;
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next.map((p, i) => ({ ...p, sortOrder: i }));
    });
  };

  const addPrize = () => {
    setPrizeDraft((list) => [...list, createEmptyPrize(list.length)]);
  };

  const removePrize = (index: number) => {
    if (prizeDraft.length <= 1) {
      showStatus("error", "선물은 최소 1개 이상 필요합니다.");
      return;
    }
    setPrizeDraft((list) => list.filter((_, i) => i !== index).map((p, i) => ({ ...p, sortOrder: i })));
  };

  const savePrizes = async () => {
    if (!slotsOk) {
      showStatus("error", `룰렛 칸 합(${slotSum})이 등분 수(${wheelSegmentCount})와 일치해야 합니다.`);
      return;
    }
    if (prizeDraft.some((p) => !p.name.trim())) {
      showStatus("error", "모든 선물의 이름을 입력해주세요.");
      return;
    }
    setPrizeSaving(true);
    try {
      await onSavePrizeConfig(
        wheelSegmentCount,
        prizeDraft.map((p, i) => ({ ...p, name: p.name.trim(), sortOrder: i })),
      );
      showStatus("success", "선물·룰렛 설정을 저장했습니다. 룰렛 화면에 즉시 반영됩니다.");
    } catch (err) {
      showStatus("error", err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setPrizeSaving(false);
    }
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
            🎬 홍보 영상
          </h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              ref={promoRef}
              type="file"
              className="file-input"
              accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handlePromoUpload(f);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              disabled={promoUploading}
              onClick={() => promoRef.current?.click()}
              style={{
                padding: "8px 12px",
                background: "#1e3a5f",
                color: "white",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                opacity: promoUploading ? 0.6 : 1,
              }}
            >
              {promoUploading ? "업로드 중..." : "📤 영상 업로드"}
            </button>
            {promoVideo?.url ? (
              <button
                type="button"
                onClick={() => void handlePromoDelete()}
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
            ) : null}
          </div>
        </div>

        {promoLoading ? (
          <p style={{ color: "#94a3b8", fontSize: 14 }}>불러오는 중...</p>
        ) : promoVideo?.url ? (
          <>
            <div className="video-wrap" style={{ marginBottom: 12 }}>
              <video src={promoVideo.url} controls playsInline />
            </div>
            <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
              파일: {promoVideo.originalName ?? "—"}
              {promoVideo.size ? ` · ${formatBytes(promoVideo.size)}` : ""}
              {promoVideo.uploadedAt
                ? ` · ${new Date(promoVideo.uploadedAt).toLocaleString("ko-KR")}`
                : ""}
            </p>
          </>
        ) : (
          <p style={{ fontSize: 14, color: "#94a3b8", margin: 0 }}>
            업로드된 홍보 영상이 없습니다. MP4·WebM·MOV 파일을 업로드하세요. (최대 500MB)
          </p>
        )}
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
            🎡 선물 · 룰렛 설정
          </h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={addPrize}
              style={{
                padding: "8px 12px",
                background: "#e2e8f0",
                color: "#334155",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              ＋ 선물 추가
            </button>
            <button
              type="button"
              disabled={prizeSaving || !slotsOk}
              onClick={() => void savePrizes()}
              style={{
                padding: "8px 12px",
                background: "#1e3a5f",
                color: "white",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                opacity: prizeSaving || !slotsOk ? 0.6 : 1,
              }}
            >
              {prizeSaving ? "저장 중..." : "💾 전체 저장"}
            </button>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <label style={{ fontWeight: 600, color: "#334155" }}>룰렛 등분 수</label>
          <input
            type="number"
            min={2}
            max={36}
            value={wheelSegmentCount}
            onChange={(e) => setWheelSegmentCount(Math.max(2, parseInt(e.target.value, 10) || 2))}
            style={{
              width: 72,
              padding: 8,
              border: "2px solid #e2e8f0",
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
            }}
          />
          <span style={{ fontSize: 13, color: slotsOk ? "#059669" : "#ef4444" }}>
            칸 합계 {slotSum} / {wheelSegmentCount}
            {!slotsOk ? " — 등분 수와 일치해야 저장 가능" : ""}
          </span>
        </div>

        <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: 8, marginBottom: 12 }}>
          <table>
            <thead>
              <tr>
                <th>순서</th>
                <th>이름</th>
                <th>이모지</th>
                <th>색상</th>
                <th>재고</th>
                <th>룰렛 칸</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {prizeDraft.map((p, i) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button type="button" onClick={() => movePrize(i, -1)} disabled={i === 0} style={{ padding: "2px 6px" }}>
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => movePrize(i, 1)}
                        disabled={i === prizeDraft.length - 1}
                        style={{ padding: "2px 6px" }}
                      >
                        ↓
                      </button>
                    </div>
                  </td>
                  <td>
                    <input
                      type="text"
                      value={p.name}
                      placeholder="선물 이름"
                      onChange={(e) => updatePrize(i, { name: e.target.value })}
                      style={{ width: "100%", minWidth: 100, padding: 8, border: "1px solid #e2e8f0", borderRadius: 6 }}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={p.emoji}
                      maxLength={4}
                      onChange={(e) => updatePrize(i, { emoji: e.target.value })}
                      style={{ width: 48, padding: 8, border: "1px solid #e2e8f0", borderRadius: 6, textAlign: "center" }}
                    />
                  </td>
                  <td>
                    <input
                      type="color"
                      value={p.color}
                      onChange={(e) => updatePrize(i, { color: e.target.value })}
                      style={{ width: 44, height: 36, border: "none", cursor: "pointer" }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      value={p.stock}
                      onChange={(e) => updatePrize(i, { stock: parseInt(e.target.value, 10) || 0 })}
                      style={{ width: 72, padding: 8, border: "1px solid #e2e8f0", borderRadius: 6 }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min={1}
                      max={wheelSegmentCount}
                      value={p.wheelSlots}
                      onChange={(e) => updatePrize(i, { wheelSlots: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                      style={{ width: 56, padding: 8, border: "1px solid #e2e8f0", borderRadius: 6 }}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => removePrize(i)}
                      style={{ padding: "6px 10px", background: "#fee2e2", color: "#991b1b", borderRadius: 6, fontSize: 12 }}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {slotsOk && previewSegments.length > 0 ? (
          <div style={{ maxWidth: 280, margin: "0 auto" }}>
            <p style={{ fontSize: 12, color: "#64748b", textAlign: "center", marginBottom: 8 }}>룰렛 미리보기</p>
            <svg viewBox="0 0 400 400" style={{ width: "100%", height: "auto" }}>
              {previewSegments.map((seg, i) => {
                const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;
                const polar = (angle: number, r: number) => ({
                  x: 200 + r * Math.cos(toRad(angle)),
                  y: 200 + r * Math.sin(toRad(angle)),
                });
                const start = polar(seg.end, 180);
                const end = polar(seg.start, 180);
                const largeArc = seg.end - seg.start > 180 ? 1 : 0;
                const d = `M 200 200 L ${start.x} ${start.y} A 180 180 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
                return <path key={i} d={d} fill={seg.color} stroke="white" strokeWidth="2" />;
              })}
            </svg>
          </div>
        ) : null}

        <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 12, marginBottom: 0 }}>
          선물별 <strong>룰렛 칸</strong> 합 = <strong>등분 수</strong>. 당첨 확률은 <strong>잔여 재고</strong>에 비례합니다.
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
