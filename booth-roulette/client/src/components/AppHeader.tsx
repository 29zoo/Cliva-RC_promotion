import type { ScreenName } from "../types/booth";

type AppHeaderProps = {
  participantCount: number;
  vipCount: number;
  onNavigate: (screen: ScreenName) => void;
};

export function AppHeader({ participantCount, vipCount, onNavigate }: AppHeaderProps) {
  const vipText = vipCount > 0 ? ` · ⭐VIP ${vipCount}` : "";

  return (
    <div className="app-header">
      <div className="app-header-inner">
        <div>
          <h1>🎰 부스 경품 룰렛</h1>
          <div className="stat-bar">
            참가자 {participantCount}명{vipText}
          </div>
        </div>
        <div>
          <button type="button" onClick={() => onNavigate("welcome")} className="app-header-btn">
            홈
          </button>
          <button type="button" onClick={() => onNavigate("admin")} className="app-header-btn">
            관리
          </button>
        </div>
      </div>
    </div>
  );
}
