import { useEffect, useRef, useState } from "react";
import { MIN_VIDEO_SECONDS, PROMO_VIDEO_URL } from "../lib/constants";

type VideoScreenProps = {
  onComplete: () => void;
};

function isYoutubeEmbed(url: string): boolean {
  return /youtube\.com\/embed|youtu\.be/.test(url);
}

export function VideoScreen({ onComplete }: VideoScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [watched, setWatched] = useState(0);
  const [canProceed, setCanProceed] = useState(!PROMO_VIDEO_URL);

  useEffect(() => {
    if (!PROMO_VIDEO_URL || isYoutubeEmbed(PROMO_VIDEO_URL)) {
      const timer = setInterval(() => {
        setWatched((w) => {
          const next = w + 1;
          if (next >= MIN_VIDEO_SECONDS) setCanProceed(true);
          return next;
        });
      }, 1000);
      return () => clearInterval(timer);
    }

    const el = videoRef.current;
    if (!el) return;

    const onTimeUpdate = () => {
      const t = Math.floor(el.currentTime);
      setWatched(t);
      if (t >= MIN_VIDEO_SECONDS) setCanProceed(true);
    };
    el.addEventListener("timeupdate", onTimeUpdate);
    return () => el.removeEventListener("timeupdate", onTimeUpdate);
  }, []);

  return (
    <div className="app-card">
      <div className="text-center mb-4">
        <div className="step-label">STEP 2 / 5</div>
        <h2 className="app-h2">병원 홍보 영상</h2>
        <p className="app-subtitle">국립교통재활병원을 소개합니다</p>
      </div>

      <div className="video-wrap">
        {PROMO_VIDEO_URL ? (
          isYoutubeEmbed(PROMO_VIDEO_URL) ? (
            <iframe
              src={PROMO_VIDEO_URL}
              title="병원 홍보 영상"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video ref={videoRef} src={PROMO_VIDEO_URL} controls playsInline />
          )
        ) : (
          <div className="video-placeholder">
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎬</div>
            <p style={{ fontWeight: 600, color: "#334155", marginBottom: 8 }}>홍보 영상 준비 중</p>
            <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>
              `VITE_PROMO_VIDEO_URL`에 영상 URL을 설정하면 재생됩니다.
              <br />
              ({MIN_VIDEO_SECONDS}초 후 다음 단계로 이동할 수 있습니다)
            </p>
          </div>
        )}
      </div>

      <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", marginTop: 12 }}>
        {canProceed
          ? "영상 시청이 완료되었습니다"
          : `${MIN_VIDEO_SECONDS - watched}초 후 다음 단계로 이동할 수 있습니다`}
      </p>

      <button
        type="button"
        onClick={onComplete}
        className="btn-primary mt-4"
        disabled={!canProceed}
        style={{ marginTop: 16 }}
      >
        퀴즈 풀러 가기 →
      </button>
    </div>
  );
}
