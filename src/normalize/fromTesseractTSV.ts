import type { TesseractTSVOptions } from "../types/config.js";
import type {
  DocumentPageInput,
  NormalizedProviderInput,
  OCRWord,
} from "../types/provider.js";

interface ParsedTSVRow {
  level: number;
  page_num: number;
  block_num: number;
  par_num: number;
  line_num: number;
  word_num: number;
  left: number;
  top: number;
  width: number;
  height: number;
  conf: number;
  text: string;
}

function parseNumber(value: string | undefined, fallback = 0): number {
  if (!value) {
    return fallback;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseTSV(tsv: string): ParsedTSVRow[] {
  const lines = tsv
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);

  if (lines.length <= 1) {
    return [];
  }

  const header = lines[0].split("\t");
  const rows: ParsedTSVRow[] = [];

  for (const rawLine of lines.slice(1)) {
    const cols = rawLine.split("\t");
    const row: Record<string, string> = {};

    for (let i = 0; i < header.length; i += 1) {
      row[header[i] ?? `col_${i}`] = cols[i] ?? "";
    }

    rows.push({
      level: parseNumber(row.level),
      page_num: parseNumber(row.page_num, 1),
      block_num: parseNumber(row.block_num),
      par_num: parseNumber(row.par_num),
      line_num: parseNumber(row.line_num),
      word_num: parseNumber(row.word_num),
      left: parseNumber(row.left),
      top: parseNumber(row.top),
      width: parseNumber(row.width),
      height: parseNumber(row.height),
      conf: parseNumber(row.conf, -1),
      text: row.text ?? "",
    });
  }

  return rows;
}

export function fromTesseractTSV(
  tsv: string,
  options: TesseractTSVOptions = {},
): NormalizedProviderInput {
  const rows = parseTSV(tsv);
  const threshold = options.confidenceThreshold ?? 0;

  const pagesByNumber = new Map<number, DocumentPageInput>();

  for (const row of rows) {
    if (row.level !== 5) {
      continue;
    }

    const text = row.text.trim();
    if (!text) {
      continue;
    }

    if (row.conf >= 0 && row.conf < threshold) {
      continue;
    }

    const pageNumber = options.pageNumberOverride ?? row.page_num;

    if (!pagesByNumber.has(pageNumber)) {
      pagesByNumber.set(pageNumber, {
        page: pageNumber,
        width: options.pageWidth ?? 1000,
        height: options.pageHeight ?? 1000,
        words: [],
        regions: [],
      });
    }

    const page = pagesByNumber.get(pageNumber)!;

    const word: OCRWord = {
      id: `p${pageNumber}-b${row.block_num}-par${row.par_num}-l${row.line_num}-w${row.word_num}`,
      text,
      bbox: {
        x: row.left,
        y: row.top,
        w: row.width,
        h: row.height,
      },
      confidence: row.conf >= 0 ? row.conf / 100 : undefined,
      page: pageNumber,
      source: "tesseract",
      raw: {
        block_num: row.block_num,
        par_num: row.par_num,
        line_num: row.line_num,
        word_num: row.word_num,
      },
    };

    page.words.push(word);
  }

  return {
    provider: "tesseract",
    pages: Array.from(pagesByNumber.values()).sort((a, b) => a.page - b.page),
  };
}
