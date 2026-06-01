export const DEFAULT_WHEEL_SEGMENT_COUNT = 6;

export const DEFAULT_PRIZES = [
  { id: "brush", name: "칫솔", emoji: "🪥", color: "#60a5fa", sortOrder: 0, wheelSlots: 3, stock: 1000 },
  { id: "battery", name: "보조배터리", emoji: "🔋", color: "#f59e0b", sortOrder: 1, wheelSlots: 1, stock: 100 },
  { id: "fan", name: "부채", emoji: "🪭", color: "#10b981", sortOrder: 2, wheelSlots: 1, stock: 100 },
  { id: "ecobag", name: "에코백", emoji: "🛍️", color: "#ec4899", sortOrder: 3, wheelSlots: 1, stock: 100 },
] as const;

export type DefaultPrizeId = (typeof DEFAULT_PRIZES)[number]["id"];
