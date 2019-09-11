/** @copyright 2019 Sean Kasun */

namespace ColorPicker {
/** Convert a CSS string ccolor to a 24-bit integer */
export function toNumber(c: string): number {
  if (c.charAt(0) == "#" && c.length == 4) {
    return parseInt(c.charAt(1), 16) * 0x110000 +
        parseInt(c.charAt(2), 16) * 0x1100 +
        parseInt(c.charAt(3), 16) * 0x11;
  }
  if (c.charAt(0) == "#") {
    return parseInt(c.substr(1), 16);
  }
  // must be rgb() or rgba()
  const parts: string[] = c.split(/[^0-9]+/);
  return parseInt(parts[1], 10) * 0x10000 +
      parseInt(parts[2], 10) * 0x100 +
      parseInt(parts[3], 10);
}

/** Convert a 24-bit integer to a CSS string */
export function toString(c: number): string {
  const r: number = c >> 16;
  const g: number = (c >> 8) & 0xff;
  const b: number = c & 0xff;
  return "rgb(" + r + "," + g + "," + b + ")";
}

/** Convert rgb values (0-255) to HSV values (0-1) */
export function rgb2hsv(r: number, g: number, b: number): [number, number,
    number] {
  const min: number = Math.min(r, g, b);
  const v: number = Math.max(r, g, b);
  if (v == 0) {  // black
    return [0, 0, 0];
  }
  const delta: number = v - min;
  const s: number = delta / v;
  if (s == 0) {  // grey
    return [0, s, v / 255];
  }
  let h: number = 0;
  if (r == v) {  // yellow to magenta
    h = (g - b) / delta;
  } else if (g == v) {  // cyan to yellow
    h = 2 + (b - r) / delta;
  } else {  // magenta to cyan
    h = 4 + (r - g) / delta;
  }
  h /= 6;
  if (h < 0) {
    h += 1;
  }
  return [h, s, v / 255];
}

/** Convert hsv values (0-1) to rgb (0-255) */
export function hsv2rgb(h: number, s: number, v: number): [number, number,
    number] {
  h *= 6;
  const i: number = Math.floor(h);
  const f: number = h - i;
  const p: number = Math.round(v * (1 - s) * 255);
  const q: number = Math.round(v * (1 - f * s) * 255);
  const t: number = Math.round(v * (1 - (1 - f) * s) * 255);
  v = Math.round(v * 255);
  switch (i % 6) {
    case 0:
      return [v, t, p];
    case 1:
      return [q, v, p];
    case 2:
      return [p, v, t];
    case 3:
      return [p, q, v];
    case 4:
      return [t, p, v];
    case 5:
      return [v, p, q];
  }
  return [0, 0, 0];
}
}
