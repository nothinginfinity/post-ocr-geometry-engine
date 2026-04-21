import type { StructuredBlock } from "../types/blocks.js";

function renderBlock(block: StructuredBlock): string {
  switch (block.type) {
    case "heading": {
      const level = Math.min(Math.max(block.level ?? 1, 1), 6);
      return `${"#".repeat(level)} ${block.text ?? ""}`.trim();
    }
    case "paragraph":
      return block.text ?? "";
    case "list":
      return (block.items ?? [])
        .map((item) => `- ${item.text ?? ""}`.trim())
        .join("\n");
    case "code":
      return `\`\`\`\n${block.text ?? ""}\n\`\`\``;
    default:
      return block.text ?? "";
  }
}

export function toMarkdown(blocks: StructuredBlock[]): string {
  return blocks
    .map((block) => renderBlock(block).trim())
    .filter((chunk) => chunk.length > 0)
    .join("\n\n")
    .trim();
}
