import { Wheel } from "../components/Wheel";
import type { Prize, WheelSegment } from "../types/booth";

type RouletteScreenProps = {
  participant: { name: string; affiliation: string };
  prizes: Prize[];
  wheelSegments: WheelSegment[];
  stockByProduct: Record<string, number>;
  spinning: boolean;
  spinTarget: number | null;
  onSpin: () => void;
};

export function RouletteScreen({
  participant,
  prizes,
  wheelSegments,
  stockByProduct,
  spinning,
  spinTarget,
  onSpin,
}: RouletteScreenProps) {
  const label = `${participant.name}${participant.affiliation ? ` · ${participant.affiliation}` : ""}`;
  const totalStock = prizes.reduce((s, p) => s + p.stock, 0);

  return (
    <div className="app-card">
      <div className="text-center mb-4">
        <div className="step-label">STEP 4 / 5</div>
        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>참가자</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#1e293b" }}>{label}</div>
      </div>
      <Wheel
        segments={wheelSegments}
        spinning={spinning}
        onSpin={onSpin}
        spinTarget={spinTarget}
        stockByProduct={stockByProduct}
      />

      <div className="stock-grid">
        {prizes.map((p) => {
          const cls = p.stock <= 0 ? "stock-item zero" : p.stock <= 5 ? "stock-item low" : "stock-item";
          const pct = totalStock > 0 ? Math.round((p.stock / totalStock) * 100) : 0;
          return (
            <div key={p.id} className={cls}>
              <div className="label">{p.name}</div>
              <div className="count">
                {p.emoji} {p.stock}개
              </div>
              {totalStock > 0 ? (
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>약 {pct}%</div>
              ) : null}
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", marginTop: 12 }}>
        당첨 확률은 선물별 잔여 재고에 비례합니다 · 재고 0인 칸은 회색 표시
      </div>
    </div>
  );
}
