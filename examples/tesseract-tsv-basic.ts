import { buildDocument } from "../src/pipeline/buildDocument.js";
import { fromTesseractTSV } from "../src/normalize/fromTesseractTSV.js";

const tsv = `level	page_num	block_num	par_num	line_num	word_num	left	top	width	height	conf	text
5	1	1	1	1	1	72	64	88	22	96	Main
5	1	1	1	1	2	168	64	120	22	95	Heading
5	1	1	1	2	1	72	112	52	18	93	This
5	1	1	1	2	2	132	112	24	18	92	is
5	1	1	1	2	3	164	112	12	18	91	a
5	1	1	1	2	4	184	112	92	18	94	test
5	1	1	1	2	5	284	112	120	18	93	paragraph.
5	1	1	1	3	1	72	138	68	18	93	Second
5	1	1	1	3	2	148	138	44	18	93	line
5	1	1	1	3	3	200	138	34	18	93	of
5	1	1	1	3	4	242	138	92	18	93	text.
5	1	1	1	4	1	72	220	64	18	95	New
5	1	1	1	4	2	144	220	110	18	95	paragraph
5	1	1	1	4	3	262	220	82	18	95	starts
5	1	1	1	4	4	352	220	54	18	95	here.`;

const normalized = fromTesseractTSV(tsv, {
  pageWidth: 1200,
  pageHeight: 1600,
});

const result = buildDocument(normalized);

console.log("Markdown:");
console.log(result.markdown);
console.log("\nBlocks:");
console.log(JSON.stringify(result.blocks, null, 2));
