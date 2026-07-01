export type Tool = 'select' | 'rectangle' | 'circle' | 'pen';

export interface Point {
  x: number;
  y: number;
}

interface BaseShape {
  id: string;
  color: string; // hex value, e.g. "#4f8ef7"
}

export interface RectShape extends BaseShape {
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CircleShape extends BaseShape {
  type: 'circle';
  x: number; // center x
  y: number; // center y
  radius: number;
}

export interface PathShape extends BaseShape {
  type: 'path';
  points: Point[];
  strokeWidth: number;
}

export type Shape = RectShape | CircleShape | PathShape;
