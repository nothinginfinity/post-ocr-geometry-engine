import type { StructuredBlock } from "../types/blocks.js";

const BULLET_REGEX = /^[-•*]\s+/;
const NUMBER_REGEX = /^\d+[\.\)]\s+/;

function isListItem(text: string): boolean {
  return BULLET_REGEX.test(text) || NUMBER_REGEX.test(text);
}

export function detectLists(blocks: StructuredBlock[]): StructuredBlock[] {
  const result: StructuredBlock[] = [];
  let currentList: StructuredBlock | null = null;

  for (const block of blocks) {
    if (block.type === "paragraph" && block.text && isListItem(block.text)) {
      const cleanText = block.text.replace(BULLET_REGEX, "").replace(NUMBER_REGEX, "");

      if (!currentList) {
        currentList = {
          id: `list-${result.length}`,
          type: "list",
          items: [],
          bbox: block.bbox,
          page: block.page,
          confidence: 0.9,
        };
        result.push(currentList);
      }

      currentList.items!.push({
        id: `${currentList.id}-item-${currentList.items!.length}`,
        type: "list_item",
        text: cleanText,
        bbox: block.bbox,
        page: block.page,
        confidence: 0.85,
      });
    } else {
      currentList = null;
      result.push(block);
    }
  }

  return result;
}
