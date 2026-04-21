# post-ocr-geometry-engine

A deterministic post-OCR reconstruction engine that converts OCR words, lines, and layout regions into reading-order-aware markdown and structured JSON — no LLM required.

## Pipeline

```text
OCR provider output
→ normalize into internal geometry schema
→ reconstruct lines and paragraphs
→ detect headings / lists / tables / code blocks
→ sort by reading order
→ emit markdown + JSON + debug HTML
```

---

## Phase Status

| Phase | Status | What shipped |
|-------|--------|--------------|
| **Phase 1** | ✅ Complete | Tesseract TSV normalizer, geometry schema, line/paragraph grouping, markdown emitter, pipeline function, tests |
| **Phase 2** | ✅ Complete | PaddleOCR normalizer, heading detection, list detection, reading-order sort, updated pipeline + types |
| **Phase 3** | ✅ Complete | Table inference (clustering), code block detection (symbol density), debug HTML overlay emitter, Markdown table rendering |
| **Phase 4** | 🔜 Planned | InfinityPaste adapter, browser worker wrapper, confidence-based escalation hooks |

---

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

## Dev — basic Tesseract example

```bash
npm run dev
```

## Dev — Phase 3 table + code example

```bash
npm run dev:phase3
```

Outputs `debug-phase3.html` — open in a browser to see color-coded bbox overlays for each detected block type.

---

## Usage

### Tesseract TSV → Markdown

```ts
import { fromTesseractTSV, buildDocument } from "./src/index.js";

const tsv = `level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext
5\t1\t1\t1\t1\t1\t72\t64\t88\t22\t96\tMain
5\t1\t1\t1\t1\t2\t168\t64\t120\t22\t95\tHeading
5\t1\t1\t1\t2\t1\t72\t112\t52\t18\t93\tThis
5\t1\t1\t1\t2\t2\t132\t112\t24\t18\t92\tis
5\t1\t1\t1\t2\t3\t164\t112\t12\t18\t91\ta
5\t1\t1\t1\t2\t4\t184\t112\t92\t18\t94\ttest
5\t1\t1\t1\t2\t5\t284\t112\t120\t18\t93\tparagraph.`;

const normalized = fromTesseractTSV(tsv, { pageWidth: 1200, pageHeight: 1600 });
const result = buildDocument(normalized);

console.log(result.markdown);
console.log(JSON.stringify(result.blocks, null, 2));
```

### Phase 3 — Table + Code inference

```ts
import { fromTesseractTSV, buildDocument } from "./src/index.js";

const normalized = fromTesseractTSV(tsv, { pageWidth: 800, pageHeight: 1200 });

const result = buildDocument(normalized, {
  enableTableInference: true,
  enableCodeInference: true,
});

console.log(result.markdown);       // Tables render as GFM | col | col | rows
console.log(result.debug.warnings); // e.g. "Detected 1 table block(s) on page 1"

// Write debug overlay HTML
import { writeFileSync } from "node:fs";
if (result.debug.debugHtml) {
  writeFileSync("./debug.html", result.debug.debugHtml, "utf8");
}
```

### PaddleOCR input

```ts
import { fromPaddleOCR, buildDocument } from "./src/index.js";

const normalized = fromPaddleOCR(paddleOCRDocumentObject);
const result = buildDocument(normalized, { enableTableInference: true });
```

---

## BuildOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enableTableInference` | `boolean` | `false` | Run clustering-based table detection |
| `enableCodeInference` | `boolean` | `false` | Run symbol-density code block detection |
| `paragraph.maxVerticalGapPx` | `number` | `18` | Max gap between lines in same paragraph |
| `paragraph.leftEdgeTolerancePx` | `number` | `16` | Left-edge alignment tolerance |
| `preserveInputLines` | `boolean` | `false` | Skip line reconstruction, use provider lines |

---

## Repo shape

```
src/
  index.ts
  pipeline/
    buildDocument.ts
  normalize/
    fromTesseractTSV.ts
    fromPaddleOCR.ts
  reconstruct/
    lines.ts
    paragraphs.ts
    headings.ts
    lists.ts
    tables.ts
    codeBlocks.ts
  order/
    readingOrder.ts
  emit/
    toMarkdown.ts
    toDebugHtml.ts
  types/
    geometry.ts
    provider.ts
    document.ts
    blocks.ts
    config.ts
examples/
  tesseract-tsv-basic.ts
  phase3-basic.ts
tests/
  buildDocument.test.ts
  phase3.test.ts
```

---

## License

MIT
