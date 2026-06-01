import { useEffect, useRef, useState } from "react";
import { fetchPromoVideo } from "../lib/api";
import { MIN_VIDEO_SECONDS } from "../lib/constants";

type VideoScreenProps = {
  onComplete: () => void;
};

export function VideoScreen({ onComplete }: VideoScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [watched, setWatched] = useState(0);
  const [canProceed, setCanProceed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const info = await fetchPromoVideo();
        if (!cancelled && info.url) setVideoUrl(info.url);
      } catch {
        /* 영상 없음 — 대기 타이머로 진행 */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    if (!videoUrl) {
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
  }, [loading, videoUrl]);

  return (
    <div className="app-card">
      <div className="text-center mb-4">
        <div className="step-label">STEP 2 / 5</div>
        <h2 className="app-h2">병원 홍보 영상</h2>
        <p className="app-subtitle">국립교통재활병원을 소개합니다</p>
      </div>

      <div className="video-wrap">
        {loading ? (
          <div className="video-placeholder">
            <div className="spinner" />
            <p style={{ marginTop: 12, color: "#64748b", fontSize: 14 }}>영상 불러오는 중...</p>
          </div>
        ) : videoUrl ? (
          <video ref={videoRef} src={videoUrl} controls playsInline />
        ) : (
          <div className="video-placeholder">
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎬</div>
            <p style={{ fontWeight: 600, color: "#334155", marginBottom: 8 }}>홍보 영상 준비 중</p>
            <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>
              관리자 화면에서 MP4 영상을 업로드하면 재생됩니다.
              <br />
              ({MIN_VIDEO_SECONDS}초 후 다음 단계로 이동할 수 있습니다)
            </p>
          </div>
        )}
      </div>

      <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", marginTop: 12 }}>
        {canProceed
          ? "영상 시청이 완료되었습니다"
          : `${Math.max(0, MIN_VIDEO_SECONDS - watched)}초 후 다음 단계로 이동할 수 있습니다`}
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
