import type {
  ParagraphGroupingContext,
  ParagraphHeuristics,
} from "../types/config.js";
import type { StructuredBlock } from "../types/blocks.js";
import { unionBoxes, verticalGap } from "../types/geometry.js";
import type { OCRLine } from "../types/provider.js";

function similarLineHeight(
  a: OCRLine,
  b: OCRLine,
  heuristics: ParagraphHeuristics,
): boolean {
  const avg = (a.bbox.h + b.bbox.h) / 2;
  if (avg === 0) {
    return true;
  }
  return Math.abs(a.bbox.h - b.bbox.h) / avg <= heuristics.lineHeightSimilarityRatio;
}

function leftAligned(
  a: OCRLine,
  b: OCRLine,
  heuristics: ParagraphHeuristics,
): boolean {
  return Math.abs(a.bbox.x - b.bbox.x) <= heuristics.leftEdgeTolerancePx;
}

function shouldJoinParagraph(
  prev: OCRLine,
  next: OCRLine,
  heuristics: ParagraphHeuristics,
): boolean {
  const gap = verticalGap(prev.bbox, next.bbox);
  return (
    gap <= heuristics.maxVerticalGapPx &&
    leftAligned(prev, next, heuristics) &&
    similarLineHeight(prev, next, heuristics)
  );
}

function blockFromLines(lines: OCRLine[], page: number, index: number): StructuredBlock {
  return {
    id: `p${page}-paragraph-${index + 1}`,
    type: "paragraph",
    page,
    bbox: unionBoxes(lines.map((line) => line.bbox)),
    text: lines.map((line) => line.text).join(" ").trim(),
    confidence:
      lines.reduce((sum, line) => sum + (line.confidence ?? 1), 0) / lines.length,
  };
}

export function reconstructParagraphs(
  context: ParagraphGroupingContext,
): StructuredBlock[] {
  const { lines, page, heuristics } = context;

  if (lines.length === 0) {
    return [];
  }

  const groups: OCRLine[][] = [];
  let current: OCRLine[] = [lines[0]!];

  for (const next of lines.slice(1)) {
    const prev = current[current.length - 1]!;
    if (shouldJoinParagraph(prev, next, heuristics)) {
      current.push(next);
      continue;
    }
    groups.push(current);
    current = [next];
  }

  groups.push(current);

  return groups.map((group, index) => blockFromLines(group, page.page, index));
}
