import { describe, expect, it } from "vitest";
import { buildDocument, fromTesseractTSV } from "../src/index.js";

const BASIC_TSV = `level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext
5\t1\t1\t1\t1\t1\t72\t64\t54\t24\t96\tQuick
5\t1\t1\t1\t1\t2\t136\t64\t72\t24\t95\tStart
5\t1\t1\t1\t2\t1\t72\t118\t48\t18\t94\tThis
5\t1\t1\t1\t2\t2\t128\t118\t26\t18\t93\tis
5\t1\t1\t1\t2\t3\t162\t118\t18\t18\t92\ta
5\t1\t1\t1\t2\t4\t188\t118\t78\t18\t94\tshort
5\t1\t1\t1\t2\t5\t274\t118\t98\t18\t94\tarticle
5\t1\t1\t1\t2\t6\t380\t118\t110\t18\t93\tintro.
5\t1\t1\t1\t3\t1\t72\t232\t36\t18\t95\tNew
5\t1\t1\t1\t3\t2\t116\t232\t104\t18\t95\tsection
5\t1\t1\t1\t3\t3\t228\t232\t60\t18\t95\tstarts
5\t1\t1\t1\t3\t4\t296\t232\t50\t18\t95\tnow.`;

const TABLE_TSV = `level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext
5\t1\t1\t1\t1\t1\t72\t64\t58\t18\t96\tName
5\t1\t1\t1\t1\t2\t220\t64\t62\t18\t96\tValue
5\t1\t1\t1\t2\t1\t72\t94\t36\t18\t95\tFoo
5\t1\t1\t1\t2\t2\t220\t94\t20\t18\t95\t12
5\t1\t1\t1\t3\t1\t72\t124\t36\t18\t95\tBar
5\t1\t1\t1\t3\t2\t220\t124\t20\t18\t95\t18`;

describe("scoring", () => {
  it("every block has a numeric confidence in [0, 1]", () => {
    const input = fromTesseractTSV(BASIC_TSV, { pageWidth: 1200, pageHeight: 1600 });
    const result = buildDocument(input);
    for (const block of result.blocks) {
      expect(typeof block.confidence).toBe("number");
      expect(block.confidence).toBeGreaterThanOrEqual(0);
      expect(block.confidence).toBeLessThanOrEqual(1);
    }
  });

  it("no block leaks a _signals field", () => {
    const input = fromTesseractTSV(BASIC_TSV, { pageWidth: 1200, pageHeight: 1600 });
    const result = buildDocument(input);
    for (const block of result.blocks) {
      expect((block as Record<string, unknown>)["_signals"]).toBeUndefined();
    }
  });

  it("table blocks have confidence when enableTableInference is true", () => {
    const input = fromTesseractTSV(TABLE_TSV, { pageWidth: 800, pageHeight: 1200 });
    const result = buildDocument(input, { enableTableInference: true });
    const tables = result.blocks.filter((b) => b.type === "table");
    expect(tables.length).toBeGreaterThan(0);
    for (const t of tables) {
      expect(typeof t.confidence).toBe("number");
      expect(t.confidence).toBeGreaterThanOrEqual(0);
      expect(t.confidence).toBeLessThanOrEqual(1);
    }
  });

  it("ambiguous blocks appear in debug.ambiguousBlocks", () => {
    const input = fromTesseractTSV(BASIC_TSV, { pageWidth: 1200, pageHeight: 1600 });
    const result = buildDocument(input);
    // ambiguousBlocks should be an array (may be empty for clean fixtures)
    expect(Array.isArray(result.debug.ambiguousBlocks)).toBe(true);
    // any block with ambiguity set should have its id in the list
    const ambiguousIds = result.blocks
      .filter((b) => b.ambiguity !== undefined)
      .map((b) => b.id);
    for (const id of ambiguousIds) {
      expect(result.debug.ambiguousBlocks).toContain(id);
    }
  });

  it("ambiguity object has valid level and reasons array when present", () => {
    const input = fromTesseractTSV(BASIC_TSV, { pageWidth: 1200, pageHeight: 1600 });
    const result = buildDocument(input);
    for (const block of result.blocks) {
      if (block.ambiguity) {
        expect(["low", "medium", "high"]).toContain(block.ambiguity.level);
        expect(Array.isArray(block.ambiguity.reasons)).toBe(true);
        expect(block.ambiguity.reasons.length).toBeGreaterThan(0);
      }
    }
  });
});
