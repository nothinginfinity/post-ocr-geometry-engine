export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PolygonPoint {
  x: number;
  y: number;
}

export function right(box: Box): number {
  return box.x + box.w;
}

export function bottom(box: Box): number {
  return box.y + box.h;
}

export function unionBoxes(boxes: Box[]): Box {
  if (boxes.length === 0) {
    return { x: 0, y: 0, w: 0, h: 0 };
  }

  let minX = boxes[0].x;
  let minY = boxes[0].y;
  let maxX = right(boxes[0]);
  let maxY = bottom(boxes[0]);

  for (const box of boxes.slice(1)) {
    minX = Math.min(minX, box.x);
    minY = Math.min(minY, box.y);
    maxX = Math.max(maxX, right(box));
    maxY = Math.max(maxY, bottom(box));
  }

  return {
    x: minX,
    y: minY,
    w: maxX - minX,
    h: maxY - minY,
  };
}

export function verticalGap(a: Box, b: Box): number {
  if (a.y <= b.y) {
    return Math.max(0, b.y - bottom(a));
  }

  return Math.max(0, a.y - bottom(b));
}
