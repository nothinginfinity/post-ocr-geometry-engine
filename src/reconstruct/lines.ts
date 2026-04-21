import { unionBoxes } from "../types/geometry.js";
import type { DocumentPageInput, OCRLine, OCRWord } from "../types/provider.js";

interface LineBucket {
  words: OCRWord[];
}

function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2;
  }
  return sorted[mid]!;
}

function sortWords(words: OCRWord[]): OCRWord[] {
  return [...words].sort((a, b) => {
    if (a.bbox.y !== b.bbox.y) {
      return a.bbox.y - b.bbox.y;
    }
    return a.bbox.x - b.bbox.x;
  });
}

function canJoinLine(word: OCRWord, bucket: LineBucket, yTolerance: number): boolean {
  const avgCenterY =
    bucket.words.reduce((sum, w) => sum + w.bbox.y + w.bbox.h / 2, 0) /
    bucket.words.length;
  const wordCenterY = word.bbox.y + word.bbox.h / 2;
  return Math.abs(wordCenterY - avgCenterY) <= yTolerance;
}

export function reconstructLines(page: DocumentPageInput): OCRLine[] {
  const words = sortWords(page.words);
  const medianHeight = median(words.map((w) => w.bbox.h));
  const yTolerance = Math.max(8, medianHeight * 0.65);

  const buckets: LineBucket[] = [];

  for (const word of words) {
    let matched = false;
    for (const bucket of buckets) {
      if (canJoinLine(word, bucket, yTolerance)) {
        bucket.words.push(word);
        matched = true;
        break;
      }
    }
    if (!matched) {
      buckets.push({ words: [word] });
    }
  }

  const lines: OCRLine[] = buckets
    .map((bucket, index) => {
      const lineWords = [...bucket.words].sort((a, b) => a.bbox.x - b.bbox.x);
      const text = lineWords.map((w) => w.text).join(" ").trim();
      const bbox = unionBoxes(lineWords.map((w) => w.bbox));
      return {
        id: `p${page.page}-line-${index + 1}`,
        text,
        bbox,
        words: lineWords,
        confidence:
          lineWords.reduce((sum, w) => sum + (w.confidence ?? 1), 0) / lineWords.length,
        page: page.page,
      };
    })
    .sort((a, b) => {
      if (a.bbox.y !== b.bbox.y) {
        return a.bbox.y - b.bbox.y;
      }
      return a.bbox.x - b.bbox.x;
    });

  return lines;
}
