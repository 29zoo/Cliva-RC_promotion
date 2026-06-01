import type { VipEntry } from "../types/booth";

type VipBadgeProps = {
  vip: VipEntry;
};

export function VipBadge({ vip }: VipBadgeProps) {
  return (
    <div className="vip-badge">
      <div className="vip-badge-icon">⭐</div>
      <div style={{ flex: 1 }}>
        <div className="vip-badge-title">VIP 명단 등록자</div>
        <div className="vip-badge-name">
          {vip.nameKr || ""}{" "}
          {vip.nameEn ? (
            <span style={{ fontWeight: "normal", fontSize: 13, color: "#b45309" }}>
              ({vip.nameEn})
            </span>
          ) : null}
        </div>
        {vip.affiliation ? <div className="vip-badge-aff">{vip.affiliation}</div> : null}
      </div>
    </div>
  );
}
