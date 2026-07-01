import type { Point, Shape } from '../types';

/** Returns true if (x, y) lies within/near the given shape. */
export function hitTestShape(shape: Shape, x: number, y: number): boolean {
  switch (shape.type) {
    case 'rect':
      return (
        x >= shape.x &&
        x <= shape.x + shape.width &&
        y >= shape.y &&
        y <= shape.y + shape.height
      );
    case 'circle': {
      const dx = x - shape.x;
      const dy = y - shape.y;
      return dx * dx + dy * dy <= shape.radius * shape.radius;
    }
    case 'path': {
      const tolerance = Math.max(shape.strokeWidth, 8);
      for (let i = 0; i < shape.points.length - 1; i++) {
        if (distanceToSegment({ x, y }, shape.points[i], shape.points[i + 1]) <= tolerance) {
          return true;
        }
      }
      // Handle single-point paths (dots).
      if (shape.points.length === 1) {
        return distance({ x, y }, shape.points[0]) <= tolerance;
      }
      return false;
    }
  }
}

/** Finds the topmost (last-drawn) shape hit by the given point, if any. */
export function findShapeAt(shapes: Shape[], x: number, y: number): Shape | null {
  for (let i = shapes.length - 1; i >= 0; i--) {
    if (hitTestShape(shapes[i], x, y)) return shapes[i];
  }
  return null;
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function distanceToSegment(p: Point, a: Point, b: Point): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const lengthSquared = abx * abx + aby * aby;

  if (lengthSquared === 0) return distance(p, a);

  let t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / lengthSquared;
  t = Math.max(0, Math.min(1, t));

  const closest: Point = { x: a.x + t * abx, y: a.y + t * aby };
  return distance(p, closest);
}
