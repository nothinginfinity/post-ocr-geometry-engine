import { describe, expect, it } from "vitest";
import { buildDocument, fromTesseractTSV } from "../src/index.js";
import { loadFixture, loadJsonFixture } from "./helpers/loadFixture.js";

interface ExpectedBlockSummary {
  type: string;
  text?: string;
  rows?: string[][];
}

interface ExpectedFixtureJson {
  blockTypes: string[];
  blocks?: ExpectedBlockSummary[];
}

interface FixtureCase {
  name: string;
  tsv: string;
  expectedMarkdown: string;
  expectedJson: string;
  options?: {
    enableTableInference?: boolean;
    enableCodeInference?: boolean;
  };
}

const FIXTURES: FixtureCase[] = [
  {
    name: "article-basic",
    tsv: "fixtures/tesseract/article-basic.tsv",
    expectedMarkdown: "fixtures/tesseract/article-basic.expected.md",
    expectedJson: "fixtures/tesseract/article-basic.expected.json",
  },
  {
    name: "code-screenshot",
    tsv: "fixtures/tesseract/code-screenshot.tsv",
    expectedMarkdown: "fixtures/tesseract/code-screenshot.expected.md",
    expectedJson: "fixtures/tesseract/code-screenshot.expected.json",
    options: { enableCodeInference: true },
  },
  {
    name: "simple-table",
    tsv: "fixtures/tesseract/simple-table.tsv",
    expectedMarkdown: "fixtures/tesseract/simple-table.expected.md",
    expectedJson: "fixtures/tesseract/simple-table.expected.json",
    options: { enableTableInference: true },
  },
  {
    name: "list-notes",
    tsv: "fixtures/tesseract/list-notes.tsv",
    expectedMarkdown: "fixtures/tesseract/list-notes.expected.md",
    expectedJson: "fixtures/tesseract/list-notes.expected.json",
  },
  {
    name: "mixed-page",
    tsv: "fixtures/tesseract/mixed-page.tsv",
    expectedMarkdown: "fixtures/tesseract/mixed-page.expected.md",
    expectedJson: "fixtures/tesseract/mixed-page.expected.json",
    options: { enableTableInference: true, enableCodeInference: true },
  },
];

describe("fixture regressions", () => {
  for (const fixture of FIXTURES) {
    it(`matches fixture output for ${fixture.name}`, () => {
      const tsv = loadFixture(fixture.tsv);
      const expectedMarkdown = loadFixture(fixture.expectedMarkdown).trim();
      const expected = loadJsonFixture<ExpectedFixtureJson>(fixture.expectedJson);

      const input = fromTesseractTSV(tsv, { pageWidth: 1200, pageHeight: 1600 });
      const result = buildDocument(input, fixture.options ?? {});

      expect(result.markdown.trim()).toBe(expectedMarkdown);
      expect(result.blocks.map((b) => b.type)).toEqual(expected.blockTypes);

      if (expected.blocks) {
        for (let i = 0; i < expected.blocks.length; i += 1) {
          const actual = result.blocks[i];
          const exp = expected.blocks[i];
          expect(actual?.type).toBe(exp?.type);
          if (exp?.text !== undefined) expect(actual?.text ?? "").toBe(exp.text);
          if (exp?.rows !== undefined) expect(actual?.rows ?? []).toEqual(exp.rows);
        }
      }

      expect(result.blocks.length).toBeGreaterThan(0);
    });
  }
});
