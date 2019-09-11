/** @copyright 2019 Sean Kasun */

namespace ColorPicker {

const wheelSize: number = 200;  // size in pixels of color wheel
const wheelThickness: number = 10;  // thickness of color ring
const wheelGap: number = 2;  // gap between wheel and sv square

const enum Ignore {
  None = 0x00,
  Hex = 0x01,
  Red = 0x02,
  Green = 0x04,
  Blue = 0x08,
  HSV = 0x10,
}

export class Picker {
  private win: HTMLElement = document.createElement("div");
  private swatch: HTMLElement = document.createElement("div");
  private hex: HTMLInputElement = document.createElement("input");
  private red: HTMLInputElement = document.createElement("input");
  private green: HTMLInputElement = document.createElement("input");
  private blue: HTMLInputElement = document.createElement("input");
  private wheel: ColorWheel;
  private done: (color: number | null) => void;
  private color: number = 0;

  constructor(el: HTMLElement) {
    this.win.className = "picker";
    this.win.style.top = el.offsetTop + "px";
    this.win.style.left = el.offsetLeft + "px";

    const canvas: HTMLCanvasElement = document.createElement("canvas");
    canvas.width = wheelSize;
    canvas.height = wheelSize;
    this.win.appendChild(canvas);

    const controls: HTMLElement = document.createElement("div");
    controls.className = "controls";
    this.win.appendChild(controls);

    this.swatch.className = "swatch";
    controls.appendChild(this.swatch);

    this.hex.type = "text";
    this.hex.className = "hex";
    this.hex.addEventListener("keyup", () => {
      this.update(parseInt(this.hex.value, 16) & 0xffffff, Ignore.Hex);
    });
    controls.appendChild(this.hex);

    const r: HTMLElement = document.createElement("div");
    r.className = "label";
    r.appendChild(document.createTextNode("R:"));
    controls.appendChild(r);
    this.red.type = "text";
    this.red.className = "channel";
    this.red.addEventListener("keyup", () => {
      this.update(((parseInt(this.red.value, 10) & 0xff) << 16) |
                  (this.color & 0xffff), Ignore.Red);
    });
    controls.appendChild(this.red);

    const g: HTMLElement = document.createElement("div");
    g.className = "label";
    g.appendChild(document.createTextNode("G:"));
    controls.appendChild(g);
    this.green.type = "text";
    this.green.className = "channel";
    this.green.addEventListener("keyup", () => {
      this.update(((parseInt(this.green.value, 10) & 0xff) << 8) |
                  (this.color & 0xff00ff), Ignore.Green);
    });
    controls.appendChild(this.green);

    const b: HTMLElement = document.createElement("div");
    b.className = "label";
    b.appendChild(document.createTextNode("B:"));
    controls.appendChild(b);
    this.blue.type = "text";
    this.blue.className = "channel";
    this.blue.addEventListener("keyup", () => {
      this.update((parseInt(this.blue.value, 10) & 0xff) |
                  (this.color & 0xffff00), Ignore.Blue);
    });
    controls.appendChild(this.blue);

    const buttonbox: HTMLElement = document.createElement("div");
    buttonbox.className = "buttonbox";
    controls.appendChild(buttonbox);

    const okay: HTMLButtonElement = document.createElement("button");
    okay.appendChild(document.createTextNode("Okay"));
    okay.addEventListener("click", () => {
      document.body.removeChild(this.win);
      this.done(this.color);
    });
    buttonbox.appendChild(okay);

    const cancel: HTMLButtonElement = document.createElement("button");
    cancel.appendChild(document.createTextNode("Cancel"));
    cancel.addEventListener("click", () => {
      document.body.removeChild(this.win);
      this.done(null);
    });
    buttonbox.appendChild(cancel);

    this.win.appendChild(document.createElement("br"));

    this.wheel = new ColorWheel(canvas, wheelSize, wheelThickness, wheelGap);
    this.wheel.draw();
    canvas.addEventListener("mousedown", (e: MouseEvent): boolean => {
      this.wheel.track(e.offsetX, e.offsetY, (c: number) => {
        this.update(c, Ignore.HSV);
      });
      e.preventDefault();
      return false;
    });
  }

  public async pick(color: number): Promise<number | null> {
    document.body.appendChild(this.win);
    this.update(color, Ignore.None);
    return new Promise<number | null>((cb: (c: number | null) => void) => {
      this.done = cb;
    });
  }

  private update(color: number, ignore: Ignore): void {
    this.color = color;
    let hex: string = this.color.toString(16);
    while (hex.length < 6) {
      hex = "0" + hex;
    }
    if (!(ignore & Ignore.Hex)) {
      this.hex.value = hex;
    }
    this.swatch.style.backgroundColor = "#" + hex;
    const r: number = this.color >> 16;
    const g: number = (this.color >> 8) & 0xff;
    const b: number = this.color & 0xff;
    if (!(ignore & Ignore.Red)) {
      this.red.value = r.toString(10);
    }
    if (!(ignore & Ignore.Green)) {
      this.green.value = g.toString(10);
    }
    if (!(ignore & Ignore.Blue)) {
      this.blue.value = b.toString(10);
    }
    if (!(ignore & Ignore.HSV)) {
      const [h, s, v] = rgb2hsv(r, g, b);
      this.wheel.setHSV(h, s, v);
      this.wheel.draw();
    }
  }
}
}
