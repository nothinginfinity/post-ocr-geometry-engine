import type { StructuredBlock } from "../types/blocks.js";
import type { AmbiguityReason } from "./ambiguity.js";
import { rollupAmbiguity } from "./ambiguity.js";
import {
  scoreCode,
  scoreGeneric,
  scoreHeading,
  scoreList,
  scoreParagraph,
  scoreTable,
} from "./confidence.js";
import { applyOverlapFlags } from "./overlap.js";

export interface BlockSignals {
  avgOcrConf: number;
  wordCount: number;
  blockHeight?: number;
  markerConf?: number;
  indentSignal?: number;
  colAlignScore?: number;
  rowCount?: number;
  symbolDensity?: number;
  uniqueIndentLevels?: number;
  overlapDetected?: boolean;
}

export interface StructuredBlockWithSignals extends StructuredBlock {
  _signals: BlockSignals;
}

export interface PageContext {
  medianBodyHeight: number;
}

export function computeMedianHeight(blocks: StructuredBlock[]): number {
  const heights = blocks
    .filter((b) => b.type === "paragraph" || b.type === "list_item")
    .map((b) => b.bbox.height)
    .filter((h) => h > 0)
    .sort((a, z) => a - z);

  if (heights.length === 0) return 18;
  const mid = Math.floor(heights.length / 2);
  return heights.length % 2 === 0
    ? ((heights[mid - 1] ?? 18) + (heights[mid] ?? 18)) / 2
    : (heights[mid] ?? 18);
}

export function scoreBlocks(
  blocks: StructuredBlock[],
  ctx: PageContext
): StructuredBlock[] {
  // Attach empty signals scaffold — reconstructors may have pre-populated _signals
  // via the StructuredBlockWithSignals type; fall back to defaults from block data.
  const withSignals: StructuredBlockWithSignals[] = blocks.map((b) => {
    const existing = (b as StructuredBlockWithSignals)._signals;
    const wordCount = b.text ? b.text.trim().split(/\s+/).length : 0;
    const signals: BlockSignals = existing ?? {
      avgOcrConf: b.confidence > 0 ? b.confidence : 0.9,
      wordCount,
      blockHeight: b.bbox.height,
    };
    return { ...b, _signals: signals };
  });

  // Global pass: overlap detection across all blocks
  applyOverlapFlags(withSignals);

  // Per-block scoring
  const scored: StructuredBlock[] = withSignals.map((b) => {
    const s = b._signals;
    const reasons: AmbiguityReason[] = [];

    let result;
    switch (b.type) {
      case "paragraph":
        result = scoreParagraph(s);
        break;
      case "heading":
        result = scoreHeading(s, ctx.medianBodyHeight);
        break;
      case "list":
      case "list_item":
        result = scoreList(s);
        break;
      case "table":
        result = scoreTable(s);
        break;
      case "code":
        result = scoreCode(s);
        break;
      default:
        result = scoreGeneric(s);
    }

    reasons.push(...result.reasons);
    if (s.overlapDetected) reasons.push("mixed-content-overlap");

    const ambiguity = rollupAmbiguity(reasons);

    // Strip _signals — do not expose on final block
    const { _signals, ...clean } = { ...b };
    void _signals;

    return {
      ...clean,
      confidence: result.confidence,
      ...(ambiguity ? { ambiguity } : {}),
    } as StructuredBlock;
  });

  return scored;
}
