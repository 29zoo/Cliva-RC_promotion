export const DEFAULT_STOCK = {
  brush: 1000,
  battery: 100,
  fan: 100,
  ecobag: 100,
} as const;

export type ProductId = keyof typeof DEFAULT_STOCK;
