import {
  DEFAULT_PARAGRAPH_HEURISTICS,
  type BuildOptions,
  type BuildResult,
} from "../types/config.js";
import type { StructuredBlock } from "../types/blocks.js";
import type { DocumentPage } from "../types/document.js";
import type { NormalizedProviderInput } from "../types/provider.js";
import { toMarkdown } from "../emit/toMarkdown.js";
import { toDebugHtml } from "../emit/toDebugHtml.js";
import { reconstructParagraphs } from "../reconstruct/paragraphs.js";
import { reconstructLines } from "../reconstruct/lines.js";
import { detectHeadings } from "../reconstruct/headings.js";
import { detectLists } from "../reconstruct/lists.js";
import { detectTables } from "../reconstruct/tables.js";
import { detectCodeBlocks } from "../reconstruct/codeBlocks.js";
import { applyReadingOrder } from "../order/readingOrder.js";

export function buildDocument(
  input: NormalizedProviderInput,
  options: BuildOptions = {},
): BuildResult {
  const pages: DocumentPage[] = input.pages.map((page) => {
    const lines = page.lines ?? reconstructLines(page);
    return {
      page: page.page,
      width: page.width,
      height: page.height,
      words: page.words,
      lines,
      regions: page.regions ?? [],
    };
  });

  const paragraphHeuristics = {
    ...DEFAULT_PARAGRAPH_HEURISTICS,
    ...options.paragraph,
  };

  const blocks: StructuredBlock[] = [];
  const warnings: string[] = [];

  for (const page of pages) {
    const baseLines = page.lines;

    const { tableBlocks, consumedLineIds: tableLineIds } = options.enableTableInference
      ? detectTables(baseLines)
      : { tableBlocks: [], consumedLineIds: new Set<string>() };

    const remainingAfterTables = baseLines.filter((line) => !tableLineIds.has(line.id));

    const { codeBlocks, consumedLineIds: codeLineIds } = options.enableCodeInference
      ? detectCodeBlocks(remainingAfterTables)
      : { codeBlocks: [], consumedLineIds: new Set<string>() };

    const remainingLines = remainingAfterTables.filter((line) => !codeLineIds.has(line.id));

    const paragraphBlocks = reconstructParagraphs({
      page,
      lines: remainingLines,
      heuristics: paragraphHeuristics,
    });

    let semanticBlocks = detectHeadings(
      paragraphBlocks.map((block, index) => ({
        id: `p${page.page}-semantic-line-${index + 1}`,
        text: block.text ?? "",
        bbox: block.bbox,
        words: [],
        confidence: block.confidence,
        page: block.page,
      })),
    );

    semanticBlocks = detectLists(semanticBlocks);

    blocks.push(...tableBlocks, ...codeBlocks, ...semanticBlocks);

    if (tableBlocks.length > 0) {
      warnings.push(`Detected ${tableBlocks.length} table block(s) on page ${page.page}.`);
    }
    if (codeBlocks.length > 0) {
      warnings.push(`Detected ${codeBlocks.length} code block(s) on page ${page.page}.`);
    }
  }

  const orderedBlocks = applyReadingOrder(blocks);
  const markdown = toMarkdown(orderedBlocks);
  const text = orderedBlocks
    .map((block) => block.text ?? "")
    .filter((value) => value.length > 0)
    .join("\n\n");

  return {
    pages,
    blocks: orderedBlocks,
    markdown,
    text,
    debug: {
      warnings,
      ambiguousBlocks: [],
      debugHtml: toDebugHtml(pages, orderedBlocks),
    },
  };
}
