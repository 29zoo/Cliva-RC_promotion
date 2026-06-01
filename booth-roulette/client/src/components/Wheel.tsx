import { useEffect, useRef } from "react";

type WheelProps = {
  spinning: boolean;
  onSpin: () => void;
  spinTarget: number | null;
};

export function Wheel({ spinning, onSpin, spinTarget }: WheelProps) {
  const wheelRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = wheelRef.current;
    if (!el) return;
    if (spinTarget === null) {
      el.style.transition = "none";
      el.style.transform = "rotate(0deg)";
      requestAnimationFrame(() => {
        el.style.transition = "transform 5s cubic-bezier(0.17, 0.67, 0.21, 1)";
      });
    } else {
      el.style.transition = "transform 5s cubic-bezier(0.17, 0.67, 0.21, 1)";
      void el.getBoundingClientRect();
      el.style.transform = `rotate(${spinTarget}deg)`;
    }
  }, [spinTarget]);

  return (
    <div className="wheel-container">
      <div className="pointer" />
      <svg ref={wheelRef} className="wheel" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
        <path d="M 200 200 L 200 20 A 180 180 0 0 1 355.88 110 Z" fill="#60a5fa" stroke="white" strokeWidth="2" />
        <path d="M 200 200 L 355.88 110 A 180 180 0 0 1 355.88 290 Z" fill="#f59e0b" stroke="white" strokeWidth="2" />
        <path d="M 200 200 L 355.88 290 A 180 180 0 0 1 200 380 Z" fill="#60a5fa" stroke="white" strokeWidth="2" />
        <path d="M 200 200 L 200 380 A 180 180 0 0 1 44.12 290 Z" fill="#10b981" stroke="white" strokeWidth="2" />
        <path d="M 200 200 L 44.12 290 A 180 180 0 0 1 44.12 110 Z" fill="#60a5fa" stroke="white" strokeWidth="2" />
        <path d="M 200 200 L 44.12 110 A 180 180 0 0 1 200 20 Z" fill="#ec4899" stroke="white" strokeWidth="2" />
        <g
          fontFamily="Pretendard, sans-serif"
          fontWeight="800"
          fill="white"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ textShadow: "0 1px 3px rgba(0,0,0,0.4)", pointerEvents: "none" }}
        >
          <text x="260" y="96.08" fontSize="17" transform="rotate(30 260 96.08)">
            칫솔
          </text>
          <text x="320" y="200" fontSize="15" transform="rotate(90 320 200)">
            보조배터리
          </text>
          <text x="260" y="303.92" fontSize="17" transform="rotate(150 260 303.92)">
            칫솔
          </text>
          <text x="140" y="303.92" fontSize="17" transform="rotate(210 140 303.92)">
            부채
          </text>
          <text x="80" y="200" fontSize="17" transform="rotate(270 80 200)">
            칫솔
          </text>
          <text x="140" y="96.08" fontSize="17" transform="rotate(330 140 96.08)">
            에코백
          </text>
        </g>
      </svg>
      <button type="button" className="center-btn" disabled={spinning} onClick={onSpin}>
        {spinning ? "..." : "START"}
      </button>
    </div>
  );
}
