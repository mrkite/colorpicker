/** @copyright 2019 Sean Kasun */

namespace ColorPicker {

export class ColorWheel {
  private ctx: CanvasRenderingContext2D;
  private wheel: ImageData;
  private wheelSize: number;
  private wheelThickness: number;
  private side: number;
  private hue: number = 0.0;
  private saturation: number = 0.0;
  private value: number = 0.0;

  constructor(canvas: HTMLCanvasElement, size: number, thickness: number,
              gap: number) {
    const ctx: CanvasRenderingContext2D | null = canvas.getContext("2d");
    if (ctx == null) {
      throw new Error("No canvas support");
    }
    this.ctx = ctx;
    this.wheelSize = size;
    this.wheelThickness = thickness;
    const diam: number = this.wheelSize - thickness * 2 - gap;
    this.side = Math.sqrt(diam * diam / 2);
    this.wheel = this.ctx.createImageData(this.wheelSize, this.wheelSize);
    let offset: number = 0;
    const outer: number = this.wheelSize / 2;
    const inner: number = this.wheelSize / 2 - thickness;

    for (let y: number = 0; y < this.wheelSize; y++) {
      const dy: number = y - this.wheelSize / 2;
      const dy2: number = dy * dy;
      for (let x: number = 0; x < this.wheelSize; x++) {
        const dx: number = x - this.wheelSize / 2;
        const distance: number = Math.sqrt(dx * dx + dy2);
        // is pixel inside the wheel?
        if (distance >= inner && distance < outer) {
          const angle: number = 1 + (Math.atan2(-dy, dx) / (Math.PI * 2));
          const [r, g, b] = hsv2rgb(angle, 1, 1);
          this.wheel.data[offset++] = r;
          this.wheel.data[offset++] = g;
          this.wheel.data[offset++] = b;
          if (outer - distance < 1) {  // antialias the outer edge?
            this.wheel.data[offset++] = 255 * (outer - distance);
          } else if (distance - inner < 1) {  // antialias inner edge?
            this.wheel.data[offset++] = 255 * (distance - inner);
          } else {
            this.wheel.data[offset++] = 255;
          }
        } else {
          this.wheel.data[offset++] = 0;
          this.wheel.data[offset++] = 0;
          this.wheel.data[offset++] = 0;
          this.wheel.data[offset++] = 0;
        }
      }
    }
  }

  public setHSV(h: number, s: number, v: number): void {
    this.hue = h;
    this.saturation = s;
    this.value = v;
  }

  public draw(): void {
    this.ctx.putImageData(this.wheel, 0, 0);  // erase all but wheel
    const d: ImageData = this.ctx.getImageData(0, 0, this.wheelSize,
                                               this.wheelSize);
    const start: number = Math.round(this.wheelSize / 2 - this.side / 2);
    const end: number = Math.round(this.wheelSize / 2 + this.side / 2);

    for (let y: number = start; y < end; y++) {
      const v: number = (y - start) / this.side;
      let offset: number = y * d.width * 4 + start * 4;
      for (let x: number = start; x < end; x++) {
        const s: number = (x - start) / this.side;
        const [r, g, b] = hsv2rgb(this.hue, s, 1 - v);
        d.data[offset++] = r;
        d.data[offset++] = g;
        d.data[offset++] = b;
        d.data[offset++] = 0xff;
      }
    }

    // now draw the selection points
    const angle: number = this.hue * Math.PI * 2;
    const h: number = this.wheelSize / 2 - this.wheelThickness / 2;
    let hx: number = Math.round(Math.cos(angle) * h + this.wheelSize / 2);
    let hy: number = Math.round(this.wheelSize / 2 - Math.sin(angle) * h);
    this.drawHandle(d, hx, hy);

    hx = Math.round(this.saturation * this.side + start);
    hy = Math.round((1 - this.value) * this.side + start);
    this.drawHandle(d, hx, hy);
    this.ctx.putImageData(d, 0, 0);
  }

  public track(x: number, y: number, update: (color: number) => void): void {
    const start: number = Math.round(this.wheelSize / 2 - this.side / 2);
    const end: number = Math.round(this.wheelSize / 2 + this.side / 2);
    if (x >= start && x < end && y >= start && y < end) {
      this.trackSV(x, y, update);
    } else {
      this.trackH(x, y, update);
    }
  }

  private trackH(x: number, y: number, update: (color: number) => void): void {
    const outer: number = this.wheelSize / 2;
    const inner: number = this.wheelSize / 2 - this.wheelThickness;
    const dy: number = y - this.wheelSize / 2;
    const dx: number = x - this.wheelSize / 2;
    const distance: number = Math.sqrt(dx * dx + dy * dy);
    if (distance >= inner && distance < outer) {
      this.hue = 1 + (Math.atan2(-dy, dx) / (Math.PI * 2));
      this.draw();
      update(this.color());
      const mmove = (e: MouseEvent): boolean => {
        const mdy: number = e.offsetY - this.wheelSize / 2;
        const mdx: number = e.offsetX - this.wheelSize / 2;
        this.hue = 1 + (Math.atan2(-mdy, mdx) / (Math.PI * 2));
        this.draw();
        update(this.color());
        e.preventDefault();
        return false;
      };
      const mup = (): boolean => {
        document.removeEventListener("mousemove", mmove);
        document.removeEventListener("mouseup", mup);
        return false;
      };
      document.addEventListener("mousemove", mmove);
      document.addEventListener("mouseup", mup);
    }
  }

  private trackSV(x: number, y: number, update: (color: number) => void): void {
    const start: number = Math.round(this.wheelSize / 2 - this.side / 2);
    const end: number = Math.round(this.wheelSize / 2 + this.side / 2);
    this.saturation = (x - start) / this.side;
    this.value = 1 - (y - start) / this.side;
    this.draw();
    update(this.color());
    const mmove = (e: MouseEvent): boolean => {
      const mx: number = Math.max(Math.min(e.offsetX, end), start);
      const my: number = Math.max(Math.min(e.offsetY, end), start);
      this.saturation = (mx - start) / this.side;
      this.value = 1 - (my - start) / this.side;
      this.draw();
      update(this.color());
      e.preventDefault();
      return false;
    };
    const mup = (): boolean => {
      document.removeEventListener("mousemove", mmove);
      document.removeEventListener("mouseup", mup);
      return false;
    };
    document.addEventListener("mousemove", mmove);
    document.addEventListener("mouseup", mup);
  }

  private color(): number {
    const [r, g, b] = hsv2rgb(this.hue, this.saturation, this.value);
    return (r << 16) | (g << 8) | b;
  }

  private drawHandle(d: ImageData, x: number, y: number): void {
    const circle: string =
        "..111.." +
        ".10001." +
        "10...01" +
        "10...01" +
        "10...01" +
        ".10001." +
        "..111..";
    let offset: number = (y - 3) * d.width * 4 + (x - 3) * 4;
    let pos: number = 0;
    for (y = 0; y < 7; y++, offset += d.width * 4 - 7 * 4) {
      for (x = 0; x < 7; x++, pos++) {
        if (circle[pos] == ".") {
          offset += 4;
        } else {
          const c: number = (circle[pos] == "1") ? 0 : 0xff;
          d.data[offset++] = c;
          d.data[offset++] = c;
          d.data[offset++] = c;
          d.data[offset++] = 0xff;
        }
      }
    }
  }
}
}
