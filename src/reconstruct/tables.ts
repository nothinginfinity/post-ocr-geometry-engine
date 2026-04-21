import type { StructuredBlock } from "../types/blocks.js";
import { unionBoxes } from "../types/geometry.js";
import type { OCRLine } from "../types/provider.js";

export interface TableDetectionOptions {
  minRows?: number;
  minCols?: number;
  rowYTolerancePx?: number;
  colXTolerancePx?: number;
}

const DEFAULTS: Required<TableDetectionOptions> = {
  minRows: 2,
  minCols: 2,
  rowYTolerancePx: 10,
  colXTolerancePx: 24,
};

interface CellToken {
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
  page: number;
}

function clusterNumbers(values: number[], tolerance: number): number[] {
  const sorted = [...values].sort((a, b) => a - b);
  const centers: number[] = [];
  for (const value of sorted) {
    const last = centers[centers.length - 1];
    if (last === undefined || Math.abs(value - last) > tolerance) {
      centers.push(value);
    } else {
      centers[centers.length - 1] = (last + value) / 2;
    }
  }
  return centers;
}

function nearestCluster(value: number, clusters: number[]): number {
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let i = 0; i < clusters.length; i += 1) {
    const distance = Math.abs(value - clusters[i]!);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = i;
    }
  }
  return bestIndex;
}

function linesToTokens(lines: OCRLine[]): CellToken[] {
  const tokens: CellToken[] = [];
  for (const line of lines) {
    for (const word of line.words) {
      tokens.push({ text: word.text, x: word.bbox.x, y: word.bbox.y, w: word.bbox.w, h: word.bbox.h, page: word.page });
    }
  }
  return tokens;
}

export function detectTables(
  lines: OCRLine[],
  options: TableDetectionOptions = {},
): { tableBlocks: StructuredBlock[]; consumedLineIds: Set<string> } {
  const cfg = { ...DEFAULTS, ...options };
  const tokens = linesToTokens(lines);
  if (tokens.length === 0) return { tableBlocks: [], consumedLineIds: new Set() };

  const rowCenters = clusterNumbers(tokens.map((t) => t.y + t.h / 2), cfg.rowYTolerancePx);
  const colCenters = clusterNumbers(tokens.map((t) => t.x), cfg.colXTolerancePx);

  if (rowCenters.length < cfg.minRows || colCenters.length < cfg.minCols) {
    return { tableBlocks: [], consumedLineIds: new Set() };
  }

  const grid: string[][] = Array.from({ length: rowCenters.length }, () =>
    Array.from({ length: colCenters.length }, () => ""),
  );

  for (const token of tokens) {
    const row = nearestCluster(token.y + token.h / 2, rowCenters);
    const col = nearestCluster(token.x, colCenters);
    grid[row]![col] = grid[row]![col] ? `${grid[row]![col]} ${token.text}` : token.text;
  }

  const nonEmptyRows = grid.filter((row) => row.some((cell) => cell.trim().length > 0));
  if (nonEmptyRows.length < cfg.minRows) return { tableBlocks: [], consumedLineIds: new Set() };

  const denseCols = colCenters.filter((_, colIndex) =>
    nonEmptyRows.some((row) => row[colIndex]?.trim().length),
  );
  if (denseCols.length < cfg.minCols) return { tableBlocks: [], consumedLineIds: new Set() };

  const consumedLineIds = new Set<string>();
  const candidateLines = lines.filter((line) => {
    const wordXs = line.words.map((w) => w.bbox.x);
    const localCols = clusterNumbers(wordXs, cfg.colXTolerancePx);
    const looksTabular = localCols.length >= cfg.minCols;
    if (looksTabular) consumedLineIds.add(line.id);
    return looksTabular;
  });

  if (candidateLines.length < cfg.minRows) return { tableBlocks: [], consumedLineIds: new Set() };

  const tableBlock: StructuredBlock = {
    id: `p${candidateLines[0]!.page}-table-1`,
    type: "table",
    page: candidateLines[0]!.page,
    bbox: unionBoxes(candidateLines.map((line) => line.bbox)),
    rows: nonEmptyRows,
    confidence: 0.8,
    flags: ["deterministic-table-inference"],
  };

  return { tableBlocks: [tableBlock], consumedLineIds };
}
