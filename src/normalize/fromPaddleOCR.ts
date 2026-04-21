import type { NormalizedProviderInput, OCRWord, LayoutRegion, DocumentPageInput } from "../types/provider.js";

export interface PaddleOCRWordLike {
  text?: string;
  transcription?: string;
  confidence?: number;
  score?: number;
  bbox?: { x: number; y: number; w: number; h: number };
  box?: number[][];
  polygon?: { x: number; y: number }[];
  page?: number;
}

export interface PaddleOCRRegionLike {
  type?: string;
  label?: string;
  category?: string;
  confidence?: number;
  score?: number;
  bbox?: { x: number; y: number; w: number; h: number };
  box?: number[][];
  page?: number;
  readingOrderHint?: number;
  order?: number;
}

export interface PaddleOCRPageLike {
  page?: number;
  page_num?: number;
  width?: number;
  height?: number;
  image_width?: number;
  image_height?: number;
  words?: PaddleOCRWordLike[];
  texts?: PaddleOCRWordLike[];
  regions?: PaddleOCRRegionLike[];
  layout?: PaddleOCRRegionLike[];
}

export interface PaddleOCRDocumentLike {
  pages?: PaddleOCRPageLike[];
  words?: PaddleOCRWordLike[];
  regions?: PaddleOCRRegionLike[];
  width?: number;
  height?: number;
}

function toBoxFromPolygon(points: { x: number; y: number }[]): { x: number; y: number; w: number; h: number } {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function polygonFromArray(box?: number[][]): { x: number; y: number }[] | undefined {
  if (!box || box.length === 0) return undefined;
  return box
    .filter((pt) => Array.isArray(pt) && pt.length >= 2)
    .map((pt) => ({ x: Number(pt[0]), y: Number(pt[1]) }));
}

function normalizeRegionKind(kind?: string): LayoutRegion["kind"] {
  const value = (kind ?? "").toLowerCase().trim();
  switch (value) {
    case "title":
    case "heading": return "title";
    case "text":
    case "paragraph": return "paragraph";
    case "list":
    case "bullet_list":
    case "ordered_list": return "list";
    case "table": return "table";
    case "image":
    case "picture": return "image";
    case "figure": return "figure";
    case "caption": return "caption";
    case "header": return "header";
    case "footer": return "footer";
    case "sidebar": return "sidebar";
    case "formula": return "formula";
    case "code": return "code";
    default: return "unknown";
  }
}

function normalizeWord(word: PaddleOCRWordLike, index: number, page: number): OCRWord | null {
  const text = (word.text ?? word.transcription ?? "").trim();
  if (!text) return null;
  let polygon = word.polygon;
  if (!polygon) polygon = polygonFromArray(word.box);
  let bbox = word.bbox;
  if (!bbox && polygon) bbox = toBoxFromPolygon(polygon);
  if (!bbox) return null;
  return {
    id: `p${page}-pw-${index + 1}`,
    text,
    bbox,
    polygon,
    confidence: word.confidence ?? word.score,
    page,
    source: "paddleocr",
    raw: word as Record<string, unknown>,
  };
}

function normalizeRegion(region: PaddleOCRRegionLike, index: number, page: number): LayoutRegion | null {
  const polygon = polygonFromArray(region.box);
  let bbox = region.bbox;
  if (!bbox && polygon) bbox = toBoxFromPolygon(polygon);
  if (!bbox) return null;
  return {
    id: `p${page}-region-${index + 1}`,
    kind: normalizeRegionKind(region.type ?? region.label ?? region.category),
    bbox,
    confidence: region.confidence ?? region.score,
    page,
    readingOrderHint: region.readingOrderHint ?? region.order,
  };
}

export function fromPaddleOCR(input: PaddleOCRDocumentLike): NormalizedProviderInput {
  const pages: DocumentPageInput[] = [];

  if (Array.isArray(input.pages) && input.pages.length > 0) {
    for (const rawPage of input.pages) {
      const page = rawPage.page ?? rawPage.page_num ?? pages.length + 1;
      const wordsSource = rawPage.words ?? rawPage.texts ?? [];
      const regionsSource = rawPage.regions ?? rawPage.layout ?? [];
      const words = wordsSource
        .map((word, index) => normalizeWord(word, index, page))
        .filter((word): word is OCRWord => word !== null);
      const regions = regionsSource
        .map((region, index) => normalizeRegion(region, index, page))
        .filter((region): region is LayoutRegion => region !== null);
      pages.push({
        page,
        width: rawPage.width ?? rawPage.image_width ?? input.width ?? 1000,
        height: rawPage.height ?? rawPage.image_height ?? input.height ?? 1000,
        words,
        regions,
      });
    }
  } else {
    const page = 1;
    const words = (input.words ?? [])
      .map((word, index) => normalizeWord(word, index, page))
      .filter((word): word is OCRWord => word !== null);
    const regions = (input.regions ?? [])
      .map((region, index) => normalizeRegion(region, index, page))
      .filter((region): region is LayoutRegion => region !== null);
    pages.push({
      page,
      width: input.width ?? 1000,
      height: input.height ?? 1000,
      words,
      regions,
    });
  }

  return { provider: "paddleocr", pages };
}
