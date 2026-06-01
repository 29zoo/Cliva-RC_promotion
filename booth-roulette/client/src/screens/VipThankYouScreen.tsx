type VipThankYouScreenProps = {
  name: string;
  affiliation: string;
  prize: string;
  onFinish: () => void;
};

export function VipThankYouScreen({ name, affiliation, prize, onFinish }: VipThankYouScreenProps) {
  return (
    <div className="app-card">
      <div className="text-center mb-4">
        <div className="step-label">STEP 5 / 5</div>
        <h2 className="app-h2">⭐ VIP 감사 인사</h2>
        <p className="app-subtitle">감사 인사장을 추가로 드립니다</p>
      </div>

      <div className="thankyou-letter">
        <div className="thankyou-letter-header">감 사 인 사 장</div>
        <div className="thankyou-letter-body">
          <p>
            <strong>{name}</strong>
            {affiliation ? ` (${affiliation})` : ""} 귀하
          </p>
          <p style={{ marginTop: 20, lineHeight: 1.8 }}>
            국립교통재활병원 행사 부스를 방문해 주셔서 진심으로 감사드립니다.
            <br />
            <br />
            VIP 게스트로서 보내주신 관심과 성원에 깊은 감사를 드리며,
            앞으로도 교통재활 의료 발전에 함께해 주시길 바랍니다.
          </p>
          <p style={{ marginTop: 20 }}>
            경품 <strong>「{prize}」</strong>과 함께 이 감사 인사장을 전달해 드립니다.
          </p>
        </div>
        <div className="thankyou-letter-footer">
          국립교통재활병원
          <br />
          행사 운영팀 드림
        </div>
      </div>

      <div style={{ background: "#fffbeb", border: "2px solid #fcd34d", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#b45309", marginBottom: 4 }}>📢 운영자 안내</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#78350f" }}>
          VIP {name}님께 감사 인사장(인쇄물)을 추가로 전달해주세요
        </div>
      </div>

      <button type="button" onClick={onFinish} className="btn-primary">
        ✅ 전달 완료 — 다음 손님
      </button>
    </div>
  );
}
