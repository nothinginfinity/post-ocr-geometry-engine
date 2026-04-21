import type { LayoutRegion, OCRLine, OCRWord } from "./provider.js";

export interface DocumentPage {
  page: number;
  width: number;
  height: number;
  words: OCRWord[];
  lines: OCRLine[];
  regions: LayoutRegion[];
}
