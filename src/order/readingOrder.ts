import type { StructuredBlock } from "../types/blocks.js";

export function applyReadingOrder(blocks: StructuredBlock[]): StructuredBlock[] {
  return [...blocks].sort((a, b) => {
    if (a.page !== b.page) return a.page - b.page;
    if (Math.abs(a.bbox.y - b.bbox.y) > 5) return a.bbox.y - b.bbox.y;
    return a.bbox.x - b.bbox.x;
  });
}
