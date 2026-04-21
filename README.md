# post-ocr-geometry-engine

A deterministic post-OCR reconstruction engine that converts OCR words, lines, and layout regions into reading-order-aware markdown and structured JSON without requiring an LLM.

## Purpose

This repo sits between OCR providers and downstream apps.

Pipeline:

```text
OCR provider output
→ normalize into internal geometry schema
→ reconstruct lines and paragraphs
→ infer headings/lists/tables/code blocks over time
→ emit markdown + JSON
```

Phase 1 in this starter template includes:

- Tesseract TSV normalizer
- Internal geometry/document schema
- Deterministic line grouping
- Deterministic paragraph grouping
- Markdown emitter
- Main pipeline function
- Basic test harness scaffolding

## Non-goals for Phase 1

- No OCR runtime included
- No LLM dependency
- No UI
- No table/code/list inference yet
- No PaddleOCR adapter yet

## Install

```bash
npm install
```

## Build

```bash
npm run build
```

## Test

```bash
npm run test
```

## Dev

```bash
npm run dev
```

## Example

```ts
import { fromTesseractTSV, buildDocument } from "./src/index.js";

const tsv = `
level	page_num	block_num	par_num	line_num	word_num	left	top	width	height	conf	text
5	1	1	1	1	1	72	64	88	22	96	Main
5	1	1	1	1	2	168	64	120	22	95	Heading
5	1	1	1	2	1	72	112	52	18	93	This
5	1	1	1	2	2	132	112	24	18	92	is
5	1	1	1	2	3	164	112	12	18	91	a
5	1	1	1	2	4	184	112	92	18	94	test
5	1	1	1	2	5	284	112	120	18	93	paragraph.
`;

const normalized = fromTesseractTSV(tsv, {
  pageWidth: 1200,
  pageHeight: 1600,
});

const result = buildDocument(normalized);

console.log(result.markdown);
console.log(JSON.stringify(result.blocks, null, 2));
```

## Planned phases

**Phase 2**
- PaddleOCR normalizer
- Heading detection
- List detection
- Reading-order solver

**Phase 3**
- Table inference
- Code block inference
- Caption detection
- Debug HTML emitter

**Phase 4**
- InfinityPaste adapter
- Browser worker wrapper
- Confidence-based optional escalation hooks

## Repo shape

```
src/
  index.ts
  pipeline/
    buildDocument.ts
  normalize/
    fromTesseractTSV.ts
  reconstruct/
    lines.ts
    paragraphs.ts
  emit/
    toMarkdown.ts
  types/
    geometry.ts
    provider.ts
    document.ts
    blocks.ts
    config.ts
```

## License

MIT
