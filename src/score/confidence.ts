import type { StructuredBlock } from "../types/blocks.js";
import type { BlockSignals } from "./index.js";
import type { AmbiguityReason } from "./ambiguity.js";

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export interface ScoreResult {
  confidence: number;
  reasons: AmbiguityReason[];
}

export function scoreParagraph(signals: BlockSignals): ScoreResult {
  const reasons: AmbiguityReason[] = [];
  const { avgOcrConf, wordCount } = signals;

  if (avgOcrConf < 0.7) reasons.push("low-ocr-confidence");
  if (wordCount < 3) reasons.push("sparse-word-count");

  const confidence =
    avgOcrConf * clamp(wordCount / 5, 0, 1);

  return { confidence: clamp(confidence, 0, 1), reasons };
}

export function scoreHeading(signals: BlockSignals, medianBodyHeight: number): ScoreResult {
  const reasons: AmbiguityReason[] = [];
  const { avgOcrConf, wordCount, blockHeight = medianBodyHeight } = signals;

  const heightRatio = medianBodyHeight > 0 ? blockHeight / medianBodyHeight : 1;
  const sizeSignal = clamp((heightRatio - 1.0) / 0.5, 0, 1);

  if (avgOcrConf < 0.7) reasons.push("low-ocr-confidence");
  if (heightRatio >= 1.0 && heightRatio < 1.15) reasons.push("heading-size-ambiguous");
  if (wordCount < 3) reasons.push("sparse-word-count");

  const confidence =
    avgOcrConf * 0.5 +
    sizeSignal * 0.4 +
    (wordCount <= 8 ? 0.1 : 0.0);

  return { confidence: clamp(confidence, 0, 1), reasons };
}

export function scoreList(signals: BlockSignals): ScoreResult {
  const reasons: AmbiguityReason[] = [];
  const { avgOcrConf, markerConf = 1.0, indentSignal = 1.0 } = signals;

  if (avgOcrConf < 0.7) reasons.push("low-ocr-confidence");
  if (markerConf < 0.7) reasons.push("list-marker-uncertain");

  const confidence =
    avgOcrConf * 0.5 +
    markerConf * 0.3 +
    indentSignal * 0.2;

  return { confidence: clamp(confidence, 0, 1), reasons };
}

export function scoreTable(signals: BlockSignals): ScoreResult {
  const reasons: AmbiguityReason[] = [];
  const { avgOcrConf, colAlignScore = 1.0, rowCount = 0 } = signals;

  if (avgOcrConf < 0.7) reasons.push("low-ocr-confidence");
  if (colAlignScore < 0.6) reasons.push("table-column-skew");
  if (rowCount === 1) reasons.push("table-single-row");

  const confidence =
    avgOcrConf * 0.4 +
    clamp(colAlignScore, 0, 1) * 0.4 +
    (rowCount >= 2 ? 0.2 : 0.0);

  return { confidence: clamp(confidence, 0, 1), reasons };
}

export function scoreCode(signals: BlockSignals): ScoreResult {
  const reasons: AmbiguityReason[] = [];
  const {
    avgOcrConf,
    symbolDensity = 0,
    uniqueIndentLevels = 1,
  } = signals;

  if (avgOcrConf < 0.7) reasons.push("low-ocr-confidence");
  if (symbolDensity >= 0.08 && symbolDensity < 0.15) reasons.push("code-low-symbol-density");
  if (uniqueIndentLevels > 4) reasons.push("code-indent-inconsistent");

  const indentConsistency = uniqueIndentLevels > 4 ? 0.7 : 1.0;
  const confidence =
    avgOcrConf * 0.4 +
    clamp(symbolDensity / 0.15, 0, 1) * 0.4 +
    indentConsistency * 0.2;

  return { confidence: clamp(confidence, 0, 1), reasons };
}

export function scoreGeneric(signals: BlockSignals): ScoreResult {
  const reasons: AmbiguityReason[] = [];
  const { avgOcrConf } = signals;
  if (avgOcrConf < 0.7) reasons.push("low-ocr-confidence");
  return { confidence: clamp(avgOcrConf, 0, 1), reasons };
}
