import type { Box } from "../types/geometry.js";
import type { StructuredBlockWithSignals } from "./index.js";

function intersects(a: Box, b: Box): boolean {
  return (
    a.left < b.left + b.width &&
    a.left + a.width > b.left &&
    a.top < b.top + b.height &&
    a.top + a.height > b.top
  );
}

export function applyOverlapFlags(blocks: StructuredBlockWithSignals[]): void {
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      const a = blocks[i];
      const b = blocks[j];
      if (!a || !b) continue;
      if (a.page !== b.page) continue;
      if (intersects(a.bbox, b.bbox)) {
        a._signals.overlapDetected = true;
        b._signals.overlapDetected = true;
      }
    }
  }
}
