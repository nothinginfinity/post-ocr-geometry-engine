import type { DocumentPage } from "./document.js";
import type { OCRLine } from "./provider.js";

export interface TesseractTSVOptions {
  pageWidth?: number;
  pageHeight?: number;
  confidenceThreshold?: number;
  pageNumberOverride?: number;
}

export interface ParagraphHeuristics {
  maxVerticalGapPx: number;
  leftEdgeTolerancePx: number;
  lineHeightSimilarityRatio: number;
}

export interface BuildOptions {
  paragraph?: Partial<ParagraphHeuristics>;
  preserveInputLines?: boolean;
}

export interface BuildDebugInfo {
  warnings: string[];
  ambiguousBlocks: string[];
}

export interface BuildResult {
  pages: DocumentPage[];
  blocks: import("./blocks.js").StructuredBlock[];
  markdown: string;
  text: string;
  debug: BuildDebugInfo;
}

export interface LineGroupingContext {
  pageWidth: number;
  pageHeight: number;
  words: import("./provider.js").OCRWord[];
}

export interface ParagraphGroupingContext {
  page: DocumentPage;
  lines: OCRLine[];
  heuristics: ParagraphHeuristics;
}

export const DEFAULT_PARAGRAPH_HEURISTICS: ParagraphHeuristics = {
  maxVerticalGapPx: 18,
  leftEdgeTolerancePx: 16,
  lineHeightSimilarityRatio: 0.35,
};
