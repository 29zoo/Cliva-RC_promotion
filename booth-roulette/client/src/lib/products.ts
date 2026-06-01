import type { Product, ProductId, SlotAngle } from "../types/booth";

export const PRODUCTS: Product[] = [
  { id: "brush", name: "칫솔", emoji: "🪥", color: "#60a5fa" },
  { id: "battery", name: "보조배터리", emoji: "🔋", color: "#f59e0b" },
  { id: "fan", name: "부채", emoji: "🪭", color: "#10b981" },
  { id: "ecobag", name: "에코백", emoji: "🛍️", color: "#ec4899" },
];

export const DEFAULT_STOCK: Record<ProductId, number> = {
  brush: 1000,
  battery: 100,
  fan: 100,
  ecobag: 100,
};

export const SLOT_ANGLES: SlotAngle[] = [
  { id: "brush", start: 0, end: 60, center: 30, sweep: 60 },
  { id: "battery", start: 60, end: 120, center: 90, sweep: 60 },
  { id: "brush", start: 120, end: 180, center: 150, sweep: 60 },
  { id: "fan", start: 180, end: 240, center: 210, sweep: 60 },
  { id: "brush", start: 240, end: 300, center: 270, sweep: 60 },
  { id: "ecobag", start: 300, end: 360, center: 330, sweep: 60 },
];

export function getProduct(id: ProductId): Product {
  return PRODUCTS.find((p) => p.id === id)!;
}
