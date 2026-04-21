import type { Box } from "./geometry.js";

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
  confidence: number;
  flags?: string[];
}
