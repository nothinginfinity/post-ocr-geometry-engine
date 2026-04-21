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

export interface HeadingHeuristics {
  minHeightRatioVsMedian: number;
  maxWords: number;
  minGapAbovePx: number;
  minGapBelowPx: number;
  preferTitleRegions: boolean;
}

export interface ListHeuristics {
  leftEdgeTolerancePx: number;
}

export interface ReadingOrderOptions {
  useRegionHints: boolean;
  columnTolerancePx: number;
}

export interface BuildOptions {
  paragraph?: Partial<ParagraphHeuristics>;
  headings?: Partial<HeadingHeuristics>;
  lists?: Partial<ListHeuristics>;
  readingOrder?: Partial<ReadingOrderOptions>;
  detectHeadings?: boolean;
  detectLists?: boolean;
  sortReadingOrder?: boolean;
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

export const DEFAULT_HEADING_HEURISTICS: HeadingHeuristics = {
  minHeightRatioVsMedian: 1.18,
  maxWords: 12,
  minGapAbovePx: 10,
  minGapBelowPx: 10,
  preferTitleRegions: true,
};

export const DEFAULT_LIST_HEURISTICS: ListHeuristics = {
  leftEdgeTolerancePx: 18,
};

export const DEFAULT_READING_ORDER_OPTIONS: ReadingOrderOptions = {
  useRegionHints: true,
  columnTolerancePx: 80,
};
