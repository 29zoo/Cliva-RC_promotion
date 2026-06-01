import { useEffect, useState } from "react";
import type { Product } from "../types/booth";
import { Confetti } from "./Confetti";

type ResultModalProps = {
  open: boolean;
  product: Product | null;
  recipientName: string;
  recipientAffiliation: string;
  isVip: boolean;
  onFinish: () => void;
};

export function ResultModal({
  open,
  product,
  recipientName,
  recipientAffiliation,
  isVip,
  onFinish,
}: ResultModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(10);

  useEffect(() => {
    if (!open) return;
    if (isVip) return;
    setSecondsLeft(10);
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          onFinish();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [open, onFinish, isVip]);

  if (!open || !product) return null;

  const recipientText = `${recipientName}${recipientAffiliation ? ` · ${recipientAffiliation}` : ""}`;
  const guideText = isVip
    ? `⭐ VIP ${recipientName}님께 「${product.name}」 ${product.emoji}을(를) 전달해주세요`
    : `${recipientName}님께 「${product.name}」 ${product.emoji}을(를) 전달해주세요`;

  return (
    <>
      <Confetti isVip={isVip} active={open} />
      <div className="modal-overlay show">
        <div className="modal-box">
          {isVip ? (
            <div
              style={{
                display: "inline-block",
                marginBottom: 12,
                padding: "4px 16px",
                background: "linear-gradient(to right, #fbbf24, #f59e0b)",
                color: "white",
                fontSize: 13,
                fontWeight: 700,
                borderRadius: 999,
              }}
            >
              ⭐ VIP 당첨자
            </div>
          ) : null}

          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#94a3b8",
              letterSpacing: "0.15em",
              marginBottom: 4,
            }}
          >
            🎉 CONGRATULATIONS 🎉
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#475569", marginBottom: 16 }}>
            축하합니다!
          </div>

          <div style={{ fontSize: 64, marginBottom: 12 }}>{product.emoji}</div>
          <div style={{ fontSize: 36, fontWeight: 800, marginBottom: 8, color: "#1e3a5f" }}>
            {product.name}
          </div>
          <div
            style={{
              fontSize: 15,
              color: "#475569",
              marginBottom: 24,
              paddingBottom: 24,
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            {recipientText}
          </div>

          <div
            style={{
              background: "#fffbeb",
              border: "2px solid #fcd34d",
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: "#b45309", marginBottom: 4 }}>
              📢 운영자 안내
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#78350f" }}>{guideText}</div>
          </div>

          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12 }}>
            {isVip
              ? "상품 전달 후 VIP 감사 인사장 화면으로 이동합니다"
              : `${secondsLeft}초 후 자동으로 다음 손님 응대 화면으로 이동합니다`}
          </div>

          <button type="button" onClick={onFinish} className="btn-primary">
            ✅ 상품 지급 완료
          </button>
        </div>
      </div>
    </>
  );
}
