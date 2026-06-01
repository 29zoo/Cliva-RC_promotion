import { useEffect, useRef } from "react";
import type { WheelSegment } from "../types/booth";
import { describeWheelArc, wheelLabelPosition } from "../lib/wheel";

type WheelProps = {
  segments: WheelSegment[];
  spinning: boolean;
  onSpin: () => void;
  spinTarget: number | null;
  stockByProduct?: Record<string, number>;
};

export function Wheel({ segments, spinning, onSpin, spinTarget, stockByProduct }: WheelProps) {
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
        {segments.map((seg, i) => {
          const outOfStock = stockByProduct && (stockByProduct[seg.productId] ?? 0) <= 0;
          return (
            <path
              key={`${seg.productId}-${i}`}
              d={describeWheelArc(200, 200, 180, seg.start, seg.end)}
              fill={outOfStock ? "#cbd5e1" : seg.color}
              stroke="white"
              strokeWidth="2"
              opacity={outOfStock ? 0.65 : 1}
            />
          );
        })}
        <g
          fontFamily="Pretendard, sans-serif"
          fontWeight="800"
          fill="white"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ textShadow: "0 1px 3px rgba(0,0,0,0.4)", pointerEvents: "none" }}
        >
          {segments.map((seg, i) => {
            const pos = wheelLabelPosition(seg.center);
            const label = seg.sweep >= 45 ? seg.name : `${seg.emoji}`;
            const fontSize = seg.sweep >= 45 ? Math.min(17, 11 + seg.sweep / 8) : 20;
            return (
              <text
                key={`label-${seg.productId}-${i}`}
                x={pos.x}
                y={pos.y}
                fontSize={fontSize}
                transform={`rotate(${seg.center} ${pos.x} ${pos.y})`}
              >
                {label}
              </text>
            );
          })}
        </g>
      </svg>
      <button type="button" className="center-btn" disabled={spinning} onClick={onSpin}>
        {spinning ? "..." : "START"}
      </button>
    </div>
  );
}
