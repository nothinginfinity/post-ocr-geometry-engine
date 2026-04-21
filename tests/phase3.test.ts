import { describe, expect, it } from "vitest";
import { buildDocument, fromTesseractTSV } from "../src/index.js";

describe("phase 3 inference", () => {
  it("detects a simple table and code block", () => {
    const tsv = `level	page_num	block_num	par_num	line_num	word_num	left	top	width	height	conf	text
5	1	1	1	1	1	72	64	50	18	95	Name
5	1	1	1	1	2	220	64	50	18	95	Value
5	1	1	1	2	1	72	90	40	18	95	Foo
5	1	1	1	2	2	220	90	20	18	95	12
5	1	1	1	3	1	72	116	40	18	95	Bar
5	1	1	1	3	2	220	116	20	18	95	18
5	1	1	1	4	1	72	220	50	18	95	const
5	1	1	1	4	2	130	220	50	18	95	x
5	1	1	1	4	3	150	220	20	18	95	=
5	1	1	1	4	4	172	220	20	18	95	1;
5	1	1	1	5	1	96	246	70	18	95	return
5	1	1	1	5	2	174	246	20	18	95	x;`;

    const input = fromTesseractTSV(tsv, {
      pageWidth: 800,
      pageHeight: 1200,
    });

    const result = buildDocument(input, {
      enableTableInference: true,
      enableCodeInference: true,
    });

    expect(result.blocks.some((b) => b.type === "table")).toBe(true);
    expect(result.blocks.some((b) => b.type === "code")).toBe(true);
    expect(result.debug.debugHtml).toContain("Post OCR Geometry Debug Overlay");
  });
});
