import type { Box, PolygonPoint } from "./geometry.js";

export type OCRProvider = "tesseract" | "paddleocr" | "other";

export interface OCRWord {
  id: string;
  text: string;
  bbox: Box;
  polygon?: PolygonPoint[];
  confidence?: number;
  page: number;
  source: OCRProvider;
  raw?: Record<string, unknown>;
}

export interface OCRLine {
  id: string;
  text: string;
  bbox: Box;
  words: OCRWord[];
  confidence?: number;
  page: number;
}

export interface LayoutRegion {
  id: string;
  kind:
    | "text"
    | "title"
    | "paragraph"
    | "list"
    | "table"
    | "image"
    | "figure"
    | "caption"
    | "header"
    | "footer"
    | "sidebar"
    | "formula"
    | "code"
    | "unknown";
  bbox: Box;
  confidence?: number;
  page: number;
  readingOrderHint?: number;
}

export interface DocumentPageInput {
  page: number;
  width: number;
  height: number;
  words: OCRWord[];
  lines?: OCRLine[];
  regions?: LayoutRegion[];
}

export interface NormalizedProviderInput {
  provider: OCRProvider;
  pages: DocumentPageInput[];
  meta?: Record<string, unknown>;
}
