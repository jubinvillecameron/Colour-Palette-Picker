/** Copies the given text to the clipboard. Returns true on success. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** Parse a hex string (with or without #) into RGB components. Returns null on invalid input. */
export function hexToRgb(hex: string): Rgb | null {
  let h = hex.startsWith('#') ? hex.slice(1) : hex;
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  if (h.length !== 6) return null;
  const num = parseInt(h, 16);
  if (isNaN(num)) return null;
  return {
    r: (num >> 16) & 0xff,
    g: (num >> 8) & 0xff,
    b: num & 0xff,
  };
}

/** Format a hex colour as an rgba CSS function string. */
export function hexToRgba(hex: string, alpha = 1): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

/** Normalise a hex colour to #RRGGBB format. Returns null on invalid input. */
export function normaliseHex(raw: string): string | null {
  let h = raw.trim().startsWith('#') ? raw.trim().slice(1) : raw.trim();
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return '#' + h.toLowerCase();
}

/** Perceptual luminance of a hex colour (0-1). Higher = brighter. */
export function colorLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
}

/** Convert HSL (h in [0,360), s/l in [0,1]) to RGB. */
function hslToRgb(h: number, s: number, l: number): Rgb {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hh = ((h % 360) + 360) % 360 / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (hh < 1) { r = c; g = x; b = 0; }
  else if (hh < 2) { r = x; g = c; b = 0; }
  else if (hh < 3) { r = 0; g = c; b = x; }
  else if (hh < 4) { r = 0; g = x; b = c; }
  else if (hh < 5) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

/** Format an RGB triple as a lowercase #rrggbb hex string. */
function rgbToHex({ r, g, b }: Rgb): string {
  const toHex = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Find the HSL lightness (for the given hue/saturation) whose resulting
 * colour's perceptual luminance (per `colorLuminance`) is as close as
 * possible to `targetLum`. Luminance increases monotonically with HSL
 * lightness for a fixed hue/saturation, so binary search converges quickly.
 */
function hexAtLuminance(h: number, s: number, targetLum: number): string {
  let lo = 0;
  let hi = 1;
  let hex = rgbToHex(hslToRgb(h, s, 0.5));
  for (let i = 0; i < 14; i++) {
    const mid = (lo + hi) / 2;
    hex = rgbToHex(hslToRgb(h, s, mid));
    if (colorLuminance(hex) < targetLum) lo = mid;
    else hi = mid;
  }
  return hex;
}

const RANDOM_PALETTE_GLOBAL_SHIFT = 0.15;
const RANDOM_PALETTE_LOCAL_JITTER = 0.05;
const RANDOM_PALETTE_MIN_LUM = 0.08;
const RANDOM_PALETTE_MAX_LUM = 0.92;
const RANDOM_PALETTE_MIN_SAT = 0.4;
const RANDOM_PALETTE_MAX_SAT = 0.85;

/**
 * Generate a new random colour for each given hex colour, preserving the
 * overall brightness trend: a single random "global shift" moves the whole
 * palette brighter/darker together (keeping relative brightness distances
 * between swatches roughly intact), plus a smaller random per-swatch jitter
 * so each colour still moves independently. Hue and saturation are fully
 * randomised for each swatch. Order and length of the result match the input.
 */
export function generateRandomPalette(hexColors: string[]): string[] {
  const globalShift = (Math.random() * 2 - 1) * RANDOM_PALETTE_GLOBAL_SHIFT;
  return hexColors.map((hex) => {
    const baseLum = colorLuminance(hex);
    const localJitter = (Math.random() * 2 - 1) * RANDOM_PALETTE_LOCAL_JITTER;
    const targetLum = Math.min(
      RANDOM_PALETTE_MAX_LUM,
      Math.max(RANDOM_PALETTE_MIN_LUM, baseLum + globalShift + localJitter),
    );
    const hue = Math.random() * 360;
    const sat = RANDOM_PALETTE_MIN_SAT + Math.random() * (RANDOM_PALETTE_MAX_SAT - RANDOM_PALETTE_MIN_SAT);
    return hexAtLuminance(hue, sat, targetLum);
  });
}