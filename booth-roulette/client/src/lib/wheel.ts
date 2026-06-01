import type { Prize, WheelSegment } from "../types/booth";

export const DEFAULT_WHEEL_SEGMENT_COUNT = 6;

export const DEFAULT_PRIZES: Prize[] = [
  { id: "brush", name: "칫솔", emoji: "🪥", color: "#60a5fa", sortOrder: 0, wheelSlots: 3, stock: 1000 },
  { id: "battery", name: "보조배터리", emoji: "🔋", color: "#f59e0b", sortOrder: 1, wheelSlots: 1, stock: 100 },
  { id: "fan", name: "부채", emoji: "🪭", color: "#10b981", sortOrder: 2, wheelSlots: 1, stock: 100 },
  { id: "ecobag", name: "에코백", emoji: "🛍️", color: "#ec4899", sortOrder: 3, wheelSlots: 1, stock: 100 },
];

export const PRIZE_COLOR_PRESETS = [
  "#60a5fa",
  "#f59e0b",
  "#10b981",
  "#ec4899",
  "#8b5cf6",
  "#ef4444",
  "#14b8a6",
  "#f97316",
];

export function createEmptyPrize(sortOrder: number): Prize {
  const color = PRIZE_COLOR_PRESETS[sortOrder % PRIZE_COLOR_PRESETS.length]!;
  return {
    id: `prize_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: "",
    emoji: "🎁",
    color,
    sortOrder,
    wheelSlots: 1,
    stock: 0,
  };
}

export function buildWheelSegments(prizes: Prize[], wheelSegmentCount: number): WheelSegment[] {
  const sorted = [...prizes].sort((a, b) => a.sortOrder - b.sortOrder);
  const sweep = 360 / wheelSegmentCount;
  const segments: WheelSegment[] = [];
  let index = 0;

  for (const prize of sorted) {
    for (let i = 0; i < prize.wheelSlots; i++) {
      const start = index * sweep;
      const end = (index + 1) * sweep;
      segments.push({
        productId: prize.id,
        name: prize.name,
        emoji: prize.emoji,
        color: prize.color,
        start,
        end,
        center: start + sweep / 2,
        sweep,
      });
      index++;
    }
  }

  return segments;
}

export function sumWheelSlots(prizes: Prize[]): number {
  return prizes.reduce((s, p) => s + (p.wheelSlots || 0), 0);
}

export function pickPrizeByStock(prizes: Prize[]): Prize | null {
  const available = prizes.filter((p) => p.stock > 0);
  if (available.length === 0) return null;

  const total = available.reduce((s, p) => s + p.stock, 0);
  let rand = Math.random() * total;
  for (const p of available) {
    rand -= p.stock;
    if (rand <= 0) return p;
  }
  return available[available.length - 1]!;
}

export function describeWheelArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;
  const polar = (angle: number) => ({
    x: cx + r * Math.cos(toRad(angle)),
    y: cy + r * Math.sin(toRad(angle)),
  });
  const start = polar(endAngle);
  const end = polar(startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

export function wheelLabelPosition(centerAngle: number, radius = 120) {
  const toRad = ((centerAngle - 90) * Math.PI) / 180;
  return {
    x: 200 + radius * Math.cos(toRad),
    y: 200 + radius * Math.sin(toRad),
  };
}

export function getPrize(prizes: Prize[], id: string): Prize | undefined {
  return prizes.find((p) => p.id === id);
}
