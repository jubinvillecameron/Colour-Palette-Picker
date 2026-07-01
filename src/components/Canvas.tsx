import { useCallback, useEffect, useRef, useState } from 'react';
import type { CircleShape, PathShape, Point, RectShape, Shape, Tool } from '../types';
import { drawShape, drawSelectionOutline, drawDraftShape, getShapeBounds } from '../utils/draw';
import { findShapeAt } from '../utils/hitTest';
import { generateId } from '../utils/color';

const MIN_SIZE = 3;
const PEN_STROKE_WIDTH = 3;

interface CanvasProps {
  shapes: Shape[];
  onCommit: (next: Shape[]) => void;
  tool: Tool;
  color: string;
  bgColor: string;
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  onDoubleClickShape: (shape: Shape, clientX: number, clientY: number) => void;
}

type DragState =
  | { kind: 'draw-rect'; start: Point; current: Point }
  | { kind: 'draw-circle'; start: Point; current: Point }
  | { kind: 'draw-path'; points: Point[] }
  | { kind: 'move'; shapeIds: string[]; startPointer: Point; dx: number; dy: number }
  | { kind: 'select-marquee'; start: Point; current: Point; addToSelection: boolean }
  | null;

function rectFromPoints(start: Point, current: Point): { x: number; y: number; width: number; height: number } {
  const x = Math.min(start.x, current.x);
  const y = Math.min(start.y, current.y);
  const width = Math.abs(current.x - start.x);
  const height = Math.abs(current.y - start.y);
  return { x, y, width, height };
}

function circleFromPoints(start: Point, current: Point): { x: number; y: number; radius: number } {
  const radius = Math.hypot(current.x - start.x, current.y - start.y);
  return { x: start.x, y: start.y, radius };
}

function translateShape(shape: Shape, dx: number, dy: number): Shape {
  switch (shape.type) {
    case 'rect':
      return { ...shape, x: shape.x + dx, y: shape.y + dy };
    case 'circle':
      return { ...shape, x: shape.x + dx, y: shape.y + dy };
    case 'path':
      return { ...shape, points: shape.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) };
  }
}

function boundsIntersect(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export default function Canvas({
  shapes,
  onCommit,
  tool,
  color,
  bgColor,
  selectedIds,
  onSelect,
  onDoubleClickShape,
}: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drag, setDrag] = useState<DragState>(null);
  const [hoveredShape, setHoveredShape] = useState<Shape | null>(null);
  const [pointerClientPos, setPointerClientPos] = useState<Point | null>(null);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const sel = new Set(selectedIds);

    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, rect.width, rect.height);

    for (const shape of shapes) {
      const isMoving = drag?.kind === 'move' && drag.shapeIds.includes(shape.id);
      const renderShape = isMoving ? translateShape(shape, drag.dx, drag.dy) : shape;
      drawShape(ctx, renderShape);
      if (sel.has(shape.id)) drawSelectionOutline(ctx, renderShape);
    }

    if (drag?.kind === 'draw-rect') {
      const bounds = rectFromPoints(drag.start, drag.current);
      const draft: RectShape = { id: '__draft', type: 'rect', color, ...bounds };
      drawDraftShape(ctx, draft);
    } else if (drag?.kind === 'draw-circle') {
      const bounds = circleFromPoints(drag.start, drag.current);
      const draft: CircleShape = { id: '__draft', type: 'circle', color, ...bounds };
      drawDraftShape(ctx, draft);
    } else if (drag?.kind === 'draw-path') {
      const draft: PathShape = {
        id: '__draft',
        type: 'path',
        color,
        points: drag.points,
        strokeWidth: PEN_STROKE_WIDTH,
      };
      drawShape(ctx, draft);
    } else if (drag?.kind === 'select-marquee') {
      const bounds = rectFromPoints(drag.start, drag.current);
      ctx.save();
      ctx.fillStyle = 'rgba(26, 115, 232, 0.08)';
      ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
      ctx.strokeStyle = '#1a73e8';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
      ctx.restore();
    }
  }, [shapes, selectedIds, drag, color, bgColor]);

  useEffect(() => {
    render();
  }, [render]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resize = () => {
      const r = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      canvas.style.width = `${r.width}px`;
      canvas.style.height = `${r.height}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
      }
      render();
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    return () => observer.disconnect();
  }, [render]);

  const getPos = useCallback((e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const pos = getPos(e);
      const isMod = e.ctrlKey || e.metaKey;

      if (tool === 'select') {
        const shape = findShapeAt(shapes, pos.x, pos.y);
        if (shape) {
          let next: string[];
          if (isMod) {
            next = selectedIds.includes(shape.id)
              ? selectedIds.filter((id) => id !== shape.id)
              : [...selectedIds, shape.id];
          } else {
            next = selectedIds.includes(shape.id) && selectedIds.length === 1
              ? selectedIds
              : [shape.id];
          }
          onSelect(next);
          setDrag({ kind: 'move', shapeIds: next, startPointer: pos, dx: 0, dy: 0 });
        } else {
          setDrag({ kind: 'select-marquee', start: pos, current: pos, addToSelection: isMod });
        }
        canvasRef.current?.setPointerCapture(e.pointerId);
        return;
      }

      if (tool === 'rectangle') {
        setDrag({ kind: 'draw-rect', start: pos, current: pos });
        canvasRef.current?.setPointerCapture(e.pointerId);
      } else if (tool === 'circle') {
        setDrag({ kind: 'draw-circle', start: pos, current: pos });
        canvasRef.current?.setPointerCapture(e.pointerId);
      } else if (tool === 'pen') {
        setDrag({ kind: 'draw-path', points: [pos] });
        canvasRef.current?.setPointerCapture(e.pointerId);
      }
    },
    [tool, shapes, selectedIds, getPos, onSelect],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!drag) {
        const pos = getPos(e);
        setHoveredShape(findShapeAt(shapes, pos.x, pos.y));
        setPointerClientPos({ x: e.clientX, y: e.clientY });
        return;
      }
      const pos = getPos(e);

      if (drag.kind === 'select-marquee') {
        setHoveredShape(null);
        setPointerClientPos(null);
        setDrag({ ...drag, current: pos });
        return;
      }

      if (drag.kind === 'draw-rect' || drag.kind === 'draw-circle') {
        setDrag({ ...drag, current: pos });
      } else if (drag.kind === 'draw-path') {
        setDrag({ ...drag, points: [...drag.points, pos] });
      } else if (drag.kind === 'move') {
        setDrag({
          ...drag,
          dx: pos.x - drag.startPointer.x,
          dy: pos.y - drag.startPointer.y,
        });
      }
    },
    [drag, getPos, shapes],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!drag) return;
      canvasRef.current?.releasePointerCapture(e.pointerId);

      if (drag.kind === 'select-marquee') {
        const bounds = rectFromPoints(drag.start, drag.current);
        if (bounds.width < MIN_SIZE && bounds.height < MIN_SIZE) {
          if (!drag.addToSelection) onSelect([]);
        } else {
          const intersecting = shapes
            .filter((s) => boundsIntersect(bounds, getShapeBounds(s)))
            .map((s) => s.id);
          if (drag.addToSelection) {
            const existing = new Set(selectedIds);
            for (const id of intersecting) {
              if (existing.has(id)) existing.delete(id);
              else existing.add(id);
            }
            onSelect([...existing]);
          } else {
            onSelect(intersecting);
          }
        }
        setDrag(null);
        return;
      }

      if (drag.kind === 'draw-rect') {
        const bounds = rectFromPoints(drag.start, drag.current);
        if (bounds.width >= MIN_SIZE && bounds.height >= MIN_SIZE) {
          const shape: RectShape = { id: generateId(), type: 'rect', color, ...bounds };
          onCommit([...shapes, shape]);
        }
      } else if (drag.kind === 'draw-circle') {
        const bounds = circleFromPoints(drag.start, drag.current);
        if (bounds.radius >= MIN_SIZE) {
          const shape: CircleShape = { id: generateId(), type: 'circle', color, ...bounds };
          onCommit([...shapes, shape]);
        }
      } else if (drag.kind === 'draw-path') {
        const shape: PathShape = {
          id: generateId(),
          type: 'path',
          color,
          points: drag.points,
          strokeWidth: PEN_STROKE_WIDTH,
        };
        onCommit([...shapes, shape]);
      } else if (drag.kind === 'move') {
        if (drag.dx !== 0 || drag.dy !== 0) {
          const next = shapes.map((s) =>
            drag.shapeIds.includes(s.id) ? translateShape(s, drag.dx, drag.dy) : s,
          );
          onCommit(next);
        }
      }

      setDrag(null);
    },
    [drag, shapes, color, onCommit],
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (tool !== 'select') return;
      const r = canvasRef.current!.getBoundingClientRect();
      const pos = { x: e.clientX - r.left, y: e.clientY - r.top };
      const shape = findShapeAt(shapes, pos.x, pos.y);
      if (shape) {
        onSelect([shape.id]);
        onDoubleClickShape(shape, e.clientX, e.clientY);
      }
    },
    [tool, shapes, onSelect, onDoubleClickShape],
  );

  const cursor = tool === 'select' ? 'default' : 'crosshair';

  const handlePointerLeave = useCallback(() => {
    setHoveredShape(null);
    setPointerClientPos(null);
  }, []);

  return (
    <div className="canvas-container" ref={containerRef}>
      <canvas
        ref={canvasRef}
        className="drawing-canvas"
        style={{ cursor }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onDoubleClick={handleDoubleClick}
      />
      {hoveredShape && pointerClientPos && (
        <div
          className="canvas-tooltip"
          style={{
            left: pointerClientPos.x + 12,
            top: pointerClientPos.y - 8,
          }}
        >
          {hoveredShape.color.toUpperCase()}
        </div>
      )}
    </div>
  );
}