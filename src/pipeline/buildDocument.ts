import {
  DEFAULT_PARAGRAPH_HEURISTICS,
  type BuildOptions,
  type BuildResult,
} from "../types/config.js";
import type { StructuredBlock } from "../types/blocks.js";
import type { DocumentPage } from "../types/document.js";
import type { NormalizedProviderInput } from "../types/provider.js";
import { toMarkdown } from "../emit/toMarkdown.js";
import { reconstructParagraphs } from "../reconstruct/paragraphs.js";
import { reconstructLines } from "../reconstruct/lines.js";
import { detectHeadings } from "../reconstruct/headings.js";
import { detectLists } from "../reconstruct/lists.js";
import { applyReadingOrder } from "../order/readingOrder.js";

export function buildDocument(
  input: NormalizedProviderInput,
  options: BuildOptions = {},
): BuildResult {
  const shouldDetectHeadings = options.detectHeadings ?? true;
  const shouldDetectLists = options.detectLists ?? true;
  const shouldSortReadingOrder = options.sortReadingOrder ?? true;

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

  for (const page of pages) {
    // Step 1: heading detection from lines
    let pageBlocks: StructuredBlock[] = shouldDetectHeadings
      ? detectHeadings(page.lines)
      : reconstructParagraphs({
          page,
          lines: page.lines,
          heuristics: paragraphHeuristics,
        });

    // Step 2: list detection
    if (shouldDetectLists) {
      pageBlocks = detectLists(pageBlocks);
    }

    blocks.push(...pageBlocks);
  }

  // Step 3: reading order sort
  const orderedBlocks = shouldSortReadingOrder ? applyReadingOrder(blocks) : blocks;

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
      warnings: [],
      ambiguousBlocks: [],
    },
  };
}
