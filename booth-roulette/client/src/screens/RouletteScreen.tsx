import { Wheel } from "../components/Wheel";
import { PRODUCTS } from "../lib/products";
import type { ProductId } from "../types/booth";

type RouletteScreenProps = {
  participant: { name: string; affiliation: string };
  stock: Record<ProductId, number>;
  spinning: boolean;
  spinTarget: number | null;
  onSpin: () => void;
};

export function RouletteScreen({
  participant,
  stock,
  spinning,
  spinTarget,
  onSpin,
}: RouletteScreenProps) {
  const label = `${participant.name}${participant.affiliation ? ` · ${participant.affiliation}` : ""}`;

  return (
    <div className="app-card">
      <div className="text-center mb-4">
        <div className="step-label">STEP 4 / 5</div>
        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>참가자</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#1e293b" }}>{label}</div>
      </div>
      <Wheel spinning={spinning} onSpin={onSpin} spinTarget={spinTarget} />

      <div className="stock-grid">
        {PRODUCTS.map((p) => {
          const s = stock[p.id];
          const cls = s <= 0 ? "stock-item zero" : s <= 5 ? "stock-item low" : "stock-item";
          return (
            <div key={p.id} className={cls}>
              <div className="label">{p.name}</div>
              <div className="count">
                {p.emoji} {s}개
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", marginTop: 12 }}>
        당첨 확률은 잔여 수량에 비례합니다
      </div>
    </div>
  );
}
