import type { Shape } from '../types';

/** Draw a single shape onto the canvas context. */
export function drawShape(ctx: CanvasRenderingContext2D, shape: Shape): void {
  ctx.fillStyle = shape.color;
  ctx.strokeStyle = shape.color;

  switch (shape.type) {
    case 'rect': {
      ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
      break;
    }
    case 'circle': {
      ctx.beginPath();
      ctx.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'path': {
      if (shape.points.length === 0) break;
      ctx.lineWidth = shape.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(shape.points[0].x, shape.points[0].y);
      for (let i = 1; i < shape.points.length; i++) {
        ctx.lineTo(shape.points[i].x, shape.points[i].y);
      }
      // A single point (click without drag) should still render as a dot.
      if (shape.points.length === 1) {
        ctx.lineTo(shape.points[0].x + 0.01, shape.points[0].y + 0.01);
      }
      ctx.stroke();
      break;
    }
  }
}

/** Draw a dashed selection outline / bounding box around a shape. */
export function drawSelectionOutline(ctx: CanvasRenderingContext2D, shape: Shape): void {
  ctx.save();
  ctx.strokeStyle = '#1a73e8';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);

  const bounds = getShapeBounds(shape);
  const pad = 6;
  ctx.strokeRect(
    bounds.x - pad,
    bounds.y - pad,
    bounds.width + pad * 2,
    bounds.height + pad * 2,
  );
  ctx.restore();
}

/** Draw a dashed stroke-only preview of a shape (for drag previews). */
export function drawDraftShape(ctx: CanvasRenderingContext2D, shape: Shape): void {
  ctx.save();
  ctx.strokeStyle = shape.color;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);

  switch (shape.type) {
    case 'rect': {
      ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
      break;
    }
    case 'circle': {
      ctx.beginPath();
      ctx.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
  }
  ctx.restore();
}

export function getShapeBounds(shape: Shape): { x: number; y: number; width: number; height: number } {
  switch (shape.type) {
    case 'rect':
      return { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
    case 'circle':
      return {
        x: shape.x - shape.radius,
        y: shape.y - shape.radius,
        width: shape.radius * 2,
        height: shape.radius * 2,
      };
    case 'path': {
      const xs = shape.points.map((p) => p.x);
      const ys = shape.points.map((p) => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }
  }
}
