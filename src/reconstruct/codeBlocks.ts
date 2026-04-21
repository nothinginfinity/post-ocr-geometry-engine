import type { StructuredBlock } from "../types/blocks.js";
import { unionBoxes, verticalGap } from "../types/geometry.js";
import type { OCRLine } from "../types/provider.js";

export interface CodeBlockDetectionOptions {
  minSymbolDensity?: number;
  minLines?: number;
  indentTolerancePx?: number;
  maxVerticalGapPx?: number;
}

const DEFAULTS: Required<CodeBlockDetectionOptions> = {
  minSymbolDensity: 0.08,
  minLines: 2,
  indentTolerancePx: 12,
  maxVerticalGapPx: 14,
};

const SYMBOL_REGEX = /[{}()[\];=<>/*+\-_.,:]/g;

function symbolDensity(text: string): number {
  if (!text.trim()) return 0;
  const matches = text.match(SYMBOL_REGEX);
  return (matches?.length ?? 0) / text.length;
}

function leadingIndentEstimate(line: OCRLine): number {
  return line.bbox.x;
}

function looksLikeCode(line: OCRLine, cfg: Required<CodeBlockDetectionOptions>): boolean {
  const text = line.text.trim();
  if (!text) return false;
  const density = symbolDensity(text);
  const hasIndent = leadingIndentEstimate(line) > 24;
  const hasTypicalShape =
    /[{}();=]/.test(text) ||
    /^\s*(const|let|var|function|if|for|while|return|class|import|export)\b/.test(text);
  return density >= cfg.minSymbolDensity || hasIndent || hasTypicalShape;
}

export function detectCodeBlocks(
  lines: OCRLine[],
  options: CodeBlockDetectionOptions = {},
): { codeBlocks: StructuredBlock[]; consumedLineIds: Set<string> } {
  const cfg = { ...DEFAULTS, ...options };
  const codeBlocks: StructuredBlock[] = [];
  const consumedLineIds = new Set<string>();
  let current: OCRLine[] = [];

  function flush() {
    if (current.length >= cfg.minLines) {
      const block: StructuredBlock = {
        id: `p${current[0]!.page}-code-${codeBlocks.length + 1}`,
        type: "code",
        page: current[0]!.page,
        bbox: unionBoxes(current.map((line) => line.bbox)),
        text: current.map((line) => line.text).join("\n"),
        confidence: 0.82,
        flags: ["deterministic-code-inference"],
      };
      for (const line of current) consumedLineIds.add(line.id);
      codeBlocks.push(block);
    }
    current = [];
  }

  for (const line of lines) {
    if (current.length === 0) {
      if (looksLikeCode(line, cfg)) current.push(line);
      continue;
    }
    const prev = current[current.length - 1]!;
    const gap = verticalGap(prev.bbox, line.bbox);
    const indentDiff = Math.abs(leadingIndentEstimate(prev) - leadingIndentEstimate(line));
    if (looksLikeCode(line, cfg) && gap <= cfg.maxVerticalGapPx && indentDiff <= 80 + cfg.indentTolerancePx) {
      current.push(line);
    } else {
      flush();
      if (looksLikeCode(line, cfg)) current.push(line);
    }
  }

  flush();
  return { codeBlocks, consumedLineIds };
}
