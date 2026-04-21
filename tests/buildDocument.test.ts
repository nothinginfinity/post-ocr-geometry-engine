import { describe, expect, it } from "vitest";
import { buildDocument, fromTesseractTSV, detectLists } from "../src/index.js";
import type { StructuredBlock } from "../src/index.js";

describe("buildDocument", () => {
  it("reconstructs paragraphs from basic Tesseract TSV", () => {
    const tsv = `level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext
5\t1\t1\t1\t1\t1\t72\t64\t88\t22\t96\tMain
5\t1\t1\t1\t1\t2\t168\t64\t120\t22\t95\tHeading
5\t1\t1\t1\t2\t1\t72\t112\t52\t18\t93\tThis
5\t1\t1\t1\t2\t2\t132\t112\t24\t18\t92\tis
5\t1\t1\t1\t2\t3\t164\t112\t12\t18\t91\ta
5\t1\t1\t1\t2\t4\t184\t112\t92\t18\t94\ttest
5\t1\t1\t1\t2\t5\t284\t112\t120\t18\t93\tparagraph.
5\t1\t1\t1\t3\t1\t72\t138\t68\t18\t93\tSecond
5\t1\t1\t1\t3\t2\t148\t138\t44\t18\t93\tline
5\t1\t1\t1\t3\t3\t200\t138\t34\t18\t93\tof
5\t1\t1\t1\t3\t4\t242\t138\t92\t18\t93\ttext.
5\t1\t1\t1\t4\t1\t72\t220\t64\t18\t95\tNew
5\t1\t1\t1\t4\t2\t144\t220\t110\t18\t95\tparagraph
5\t1\t1\t1\t4\t3\t262\t220\t82\t18\t95\tstarts
5\t1\t1\t1\t4\t4\t352\t220\t54\t18\t95\there.`;

    const input = fromTesseractTSV(tsv, { pageWidth: 1200, pageHeight: 1600 });
    const result = buildDocument(input);

    expect(result.pages).toHaveLength(1);
    expect(result.blocks.length).toBeGreaterThan(0);
    expect(result.blocks[0]?.type).toBe("heading");
    expect(result.blocks[1]?.type).toBe("paragraph");
  });
});

describe("detectLists", () => {
  it("detects list items and groups them", () => {
    const input: StructuredBlock[] = [
      { id: "b1", type: "paragraph", text: "- item one", bbox: { x: 0, y: 0, w: 100, h: 18 }, page: 1, confidence: 0.9 },
      { id: "b2", type: "paragraph", text: "- item two", bbox: { x: 0, y: 20, w: 100, h: 18 }, page: 1, confidence: 0.9 },
    ];

    const output = detectLists(input);

    expect(output[0]?.type).toBe("list");
    expect(output[0]?.items).toHaveLength(2);
  });
});
