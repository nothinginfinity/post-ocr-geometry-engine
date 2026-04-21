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

  for (const page of pages) {
    const pageBlocks = reconstructParagraphs({
      page,
      lines: page.lines,
      heuristics: paragraphHeuristics,
    });
    blocks.push(...pageBlocks);
  }

  const markdown = toMarkdown(blocks);
  const text = blocks
    .map((block) => block.text ?? "")
    .filter((value) => value.length > 0)
    .join("\n\n");

  return {
    pages,
    blocks,
    markdown,
    text,
    debug: {
      warnings: [],
      ambiguousBlocks: [],
    },
  };
}
