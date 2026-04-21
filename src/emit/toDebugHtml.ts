import type { StructuredBlock } from "../types/blocks.js";
import type { DocumentPage } from "../types/document.js";

function colorForType(type: StructuredBlock["type"]): string {
  switch (type) {
    case "heading": return "#8b5cf6";
    case "paragraph": return "#22c55e";
    case "list": return "#eab308";
    case "table": return "#ef4444";
    case "code": return "#3b82f6";
    default: return "#94a3b8";
  }
}

function esc(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export function toDebugHtml(pages: DocumentPage[], blocks: StructuredBlock[]): string {
  const pageHtml = pages.map((page) => {
    const pageBlocks = blocks.filter((block) => block.page === page.page);
    const overlays = pageBlocks.map((block) => {
      const color = colorForType(block.type);
      return `<div class="block" style="left:${block.bbox.x}px;top:${block.bbox.y}px;width:${block.bbox.w}px;height:${block.bbox.h}px;border-color:${color};"><div class="label" style="background:${color}">${esc(block.type)}</div></div>`;
    }).join("\n");
    const words = page.words.map((word) =>
      `<div class="word" style="left:${word.bbox.x}px;top:${word.bbox.y}px;width:${word.bbox.w}px;height:${word.bbox.h}px;">${esc(word.text)}</div>`
    ).join("\n");
    return `<section class="page-wrap"><h2>Page ${page.page}</h2><div class="page" style="width:${page.width}px;height:${page.height}px;">${words}${overlays}</div></section>`;
  }).join("\n");

  return `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8" />\n<title>Post OCR Geometry Debug</title>\n<style>\nbody { font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 24px; }\n.page-wrap { margin-bottom: 32px; }\n.page { position: relative; background: white; overflow: hidden; }\n.word { position: absolute; font-size: 10px; color: rgba(15,23,42,0.65); white-space: nowrap; overflow: hidden; }\n.block { position: absolute; border: 2px solid; box-sizing: border-box; pointer-events: none; }\n.label { position: absolute; left: 0; top: 0; color: white; font-size: 10px; padding: 2px 4px; }\n</style>\n</head>\n<body>\n<h1>Post OCR Geometry Debug Overlay</h1>\n${pageHtml}\n</body>\n</html>`;
}
