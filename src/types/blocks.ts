import type { Box } from "./geometry.js";
import type { AmbiguityReason } from "../score/ambiguity.js";

export type StructuredBlockType =
  | "heading"
  | "paragraph"
  | "list"
  | "list_item"
  | "table"
  | "code"
  | "quote"
  | "caption"
  | "image"
  | "section_break"
  | "unknown";

export interface BlockAmbiguity {
  level: "low" | "medium" | "high";
  reasons: AmbiguityReason[];
}

export interface StructuredBlock {
  id: string;
  type: StructuredBlockType;
  bbox: Box;
  page: number;
  text?: string;
  level?: number;
  items?: StructuredBlock[];
  rows?: string[][];
  children?: StructuredBlock[];
  /** 0.0–1.0 confidence score derived from OCR word confidences and structural signals. */
  confidence: number;
  /** Present only when the engine is uncertain about block classification. */
  ambiguity?: BlockAmbiguity;
  flags?: string[];
}
