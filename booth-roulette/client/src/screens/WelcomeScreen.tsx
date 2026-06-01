type WelcomeScreenProps = {
  onStart: () => void;
};

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="app-card center">
      <div style={{ fontSize: 56, marginBottom: 8 }}>🏥</div>
      <h2 className="app-h2">국립교통재활병원</h2>
      <p className="app-subtitle">행사 부스에 오신 것을 환영합니다</p>
      <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24, lineHeight: 1.6 }}>
        정보 입력 → 병원 소개 영상 → 퀴즈 → 경품 룰렛 순서로 진행됩니다.
      </p>
      <button type="button" onClick={onStart} className="btn-primary" style={{ maxWidth: "28rem", margin: "0 auto" }}>
        시작하기
      </button>
    </div>
  );
}
