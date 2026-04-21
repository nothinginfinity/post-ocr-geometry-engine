import type { StructuredBlock } from "../types/blocks.js";
import type { OCRLine } from "../types/provider.js";

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1]! + sorted[mid]!) / 2
    : sorted[mid]!;
}

export function detectHeadings(lines: OCRLine[]): StructuredBlock[] {
  if (lines.length === 0) return [];

  const heights = lines.map((l) => l.bbox.h);
  const medianHeight = median(heights);

  return lines.map((line, index) => {
    const isLarge = line.bbox.h > medianHeight * 1.35;
    const isShort = line.text.length < 80;

    if (isLarge && isShort) {
      return {
        id: `heading-${index}`,
        type: "heading" as const,
        text: line.text,
        level: line.bbox.h > medianHeight * 1.6 ? 1 : 2,
        bbox: line.bbox,
        page: line.page,
        confidence: 0.85,
      };
    }

    return {
      id: `line-${index}`,
      type: "paragraph" as const,
      text: line.text,
      bbox: line.bbox,
      page: line.page,
      confidence: 0.6,
    };
  });
}
