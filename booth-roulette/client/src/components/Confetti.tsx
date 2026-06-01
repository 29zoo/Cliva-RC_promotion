import { useEffect } from "react";

type ConfettiProps = {
  isVip: boolean;
  active: boolean;
};

export function Confetti({ isVip, active }: ConfettiProps) {
  useEffect(() => {
    if (!active) return;

    const container = document.createElement("div");
    container.id = "confettiContainer";
    container.className = "confetti-container";
    document.body.appendChild(container);

    const colors = isVip
      ? ["#fbbf24", "#f59e0b", "#fde68a", "#fcd34d", "#f97316", "#fef3c7"]
      : ["#60a5fa", "#10b981", "#ec4899", "#f59e0b", "#a78bfa", "#34d399", "#fb7185"];

    const shapes = ["10px 14px", "8px 8px", "12px 4px"];

    for (let i = 0; i < 80; i++) {
      const piece = document.createElement("div");
      piece.className = "confetti-piece";
      const color = colors[Math.floor(Math.random() * colors.length)];
      const shape = shapes[Math.floor(Math.random() * shapes.length)]!;
      const [w, h] = shape.split(" ");
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.width = w!;
      piece.style.height = h!;
      piece.style.backgroundColor = color;
      piece.style.borderRadius = Math.random() > 0.5 ? "2px" : "50%";
      piece.style.animationDuration = `${2.5 + Math.random() * 2}s`;
      piece.style.animationDelay = `${Math.random() * 0.8}s`;
      container.appendChild(piece);
    }

    const timer = setTimeout(() => container.remove(), 5500);
    return () => {
      clearTimeout(timer);
      container.remove();
    };
  }, [active, isVip]);

  return null;
}
