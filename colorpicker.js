var ColorPicker;
(function (ColorPicker) {
    function toNumber(c) {
        if (c.charAt(0) == "#" && c.length == 4) {
            return parseInt(c.charAt(1), 16) * 0x110000 +
                parseInt(c.charAt(2), 16) * 0x1100 +
                parseInt(c.charAt(3), 16) * 0x11;
        }
        if (c.charAt(0) == "#") {
            return parseInt(c.substr(1), 16);
        }
        const parts = c.split(/[^0-9]+/);
        return parseInt(parts[1], 10) * 0x10000 +
            parseInt(parts[2], 10) * 0x100 +
            parseInt(parts[3], 10);
    }
    ColorPicker.toNumber = toNumber;
    function toString(c) {
        const r = c >> 16;
        const g = (c >> 8) & 0xff;
        const b = c & 0xff;
        return "rgb(" + r + "," + g + "," + b + ")";
    }
    ColorPicker.toString = toString;
    function rgb2hsv(r, g, b) {
        const min = Math.min(r, g, b);
        const v = Math.max(r, g, b);
        if (v == 0) {
            return [0, 0, 0];
        }
        const delta = v - min;
        const s = delta / v;
        if (s == 0) {
            return [0, s, v / 255];
        }
        let h = 0;
        if (r == v) {
            h = (g - b) / delta;
        }
        else if (g == v) {
            h = 2 + (b - r) / delta;
        }
        else {
            h = 4 + (r - g) / delta;
        }
        h /= 6;
        if (h < 0) {
            h += 1;
        }
        return [h, s, v / 255];
    }
    ColorPicker.rgb2hsv = rgb2hsv;
    function hsv2rgb(h, s, v) {
        h *= 6;
        const i = Math.floor(h);
        const f = h - i;
        const p = Math.round(v * (1 - s) * 255);
        const q = Math.round(v * (1 - f * s) * 255);
        const t = Math.round(v * (1 - (1 - f) * s) * 255);
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
    ColorPicker.hsv2rgb = hsv2rgb;
})(ColorPicker || (ColorPicker = {}));
var ColorPicker;
(function (ColorPicker) {
    const wheelSize = 200;
    const wheelThickness = 10;
    const wheelGap = 2;
    class Picker {
        constructor(el) {
            this.win = document.createElement("div");
            this.swatch = document.createElement("div");
            this.hex = document.createElement("input");
            this.red = document.createElement("input");
            this.green = document.createElement("input");
            this.blue = document.createElement("input");
            this.color = 0;
            this.win.className = "picker";
            this.win.style.top = el.offsetTop + "px";
            this.win.style.left = el.offsetLeft + "px";
            const canvas = document.createElement("canvas");
            canvas.width = wheelSize;
            canvas.height = wheelSize;
            this.win.appendChild(canvas);
            const controls = document.createElement("div");
            controls.className = "controls";
            this.win.appendChild(controls);
            this.swatch.className = "swatch";
            controls.appendChild(this.swatch);
            this.hex.type = "text";
            this.hex.className = "hex";
            this.hex.addEventListener("keyup", () => {
                this.update(parseInt(this.hex.value, 16) & 0xffffff, 1);
            });
            controls.appendChild(this.hex);
            const r = document.createElement("div");
            r.className = "label";
            r.appendChild(document.createTextNode("R:"));
            controls.appendChild(r);
            this.red.type = "text";
            this.red.className = "channel";
            this.red.addEventListener("keyup", () => {
                this.update(((parseInt(this.red.value, 10) & 0xff) << 16) |
                    (this.color & 0xffff), 2);
            });
            controls.appendChild(this.red);
            const g = document.createElement("div");
            g.className = "label";
            g.appendChild(document.createTextNode("G:"));
            controls.appendChild(g);
            this.green.type = "text";
            this.green.className = "channel";
            this.green.addEventListener("keyup", () => {
                this.update(((parseInt(this.green.value, 10) & 0xff) << 8) |
                    (this.color & 0xff00ff), 4);
            });
            controls.appendChild(this.green);
            const b = document.createElement("div");
            b.className = "label";
            b.appendChild(document.createTextNode("B:"));
            controls.appendChild(b);
            this.blue.type = "text";
            this.blue.className = "channel";
            this.blue.addEventListener("keyup", () => {
                this.update((parseInt(this.blue.value, 10) & 0xff) |
                    (this.color & 0xffff00), 8);
            });
            controls.appendChild(this.blue);
            const buttonbox = document.createElement("div");
            buttonbox.className = "buttonbox";
            controls.appendChild(buttonbox);
            const okay = document.createElement("button");
            okay.appendChild(document.createTextNode("Okay"));
            okay.addEventListener("click", () => {
                document.body.removeChild(this.win);
                this.done(this.color);
            });
            buttonbox.appendChild(okay);
            const cancel = document.createElement("button");
            cancel.appendChild(document.createTextNode("Cancel"));
            cancel.addEventListener("click", () => {
                document.body.removeChild(this.win);
                this.done(null);
            });
            buttonbox.appendChild(cancel);
            this.win.appendChild(document.createElement("br"));
            this.wheel = new ColorPicker.ColorWheel(canvas, wheelSize, wheelThickness, wheelGap);
            this.wheel.draw();
            canvas.addEventListener("mousedown", (e) => {
                this.wheel.track(e.offsetX, e.offsetY, (c) => {
                    this.update(c, 16);
                });
                e.preventDefault();
                return false;
            });
        }
        async pick(color) {
            document.body.appendChild(this.win);
            this.update(color, 0);
            return new Promise((cb) => {
                this.done = cb;
            });
        }
        update(color, ignore) {
            this.color = color;
            let hex = this.color.toString(16);
            while (hex.length < 6) {
                hex = "0" + hex;
            }
            if (!(ignore & 1)) {
                this.hex.value = hex;
            }
            this.swatch.style.backgroundColor = "#" + hex;
            const r = this.color >> 16;
            const g = (this.color >> 8) & 0xff;
            const b = this.color & 0xff;
            if (!(ignore & 2)) {
                this.red.value = r.toString(10);
            }
            if (!(ignore & 4)) {
                this.green.value = g.toString(10);
            }
            if (!(ignore & 8)) {
                this.blue.value = b.toString(10);
            }
            if (!(ignore & 16)) {
                const [h, s, v] = ColorPicker.rgb2hsv(r, g, b);
                this.wheel.setHSV(h, s, v);
                this.wheel.draw();
            }
        }
    }
    ColorPicker.Picker = Picker;
})(ColorPicker || (ColorPicker = {}));
var ColorPicker;
(function (ColorPicker) {
    class ColorWheel {
        constructor(canvas, size, thickness, gap) {
            this.hue = 0.0;
            this.saturation = 0.0;
            this.value = 0.0;
            const ctx = canvas.getContext("2d");
            if (ctx == null) {
                throw new Error("No canvas support");
            }
            this.ctx = ctx;
            this.wheelSize = size;
            this.wheelThickness = thickness;
            const diam = this.wheelSize - thickness * 2 - gap;
            this.side = Math.sqrt(diam * diam / 2);
            this.wheel = this.ctx.createImageData(this.wheelSize, this.wheelSize);
            let offset = 0;
            const outer = this.wheelSize / 2;
            const inner = this.wheelSize / 2 - thickness;
            for (let y = 0; y < this.wheelSize; y++) {
                const dy = y - this.wheelSize / 2;
                const dy2 = dy * dy;
                for (let x = 0; x < this.wheelSize; x++) {
                    const dx = x - this.wheelSize / 2;
                    const distance = Math.sqrt(dx * dx + dy2);
                    if (distance >= inner && distance < outer) {
                        const angle = 1 + (Math.atan2(-dy, dx) / (Math.PI * 2));
                        const [r, g, b] = ColorPicker.hsv2rgb(angle, 1, 1);
                        this.wheel.data[offset++] = r;
                        this.wheel.data[offset++] = g;
                        this.wheel.data[offset++] = b;
                        if (outer - distance < 1) {
                            this.wheel.data[offset++] = 255 * (outer - distance);
                        }
                        else if (distance - inner < 1) {
                            this.wheel.data[offset++] = 255 * (distance - inner);
                        }
                        else {
                            this.wheel.data[offset++] = 255;
                        }
                    }
                    else {
                        this.wheel.data[offset++] = 0;
                        this.wheel.data[offset++] = 0;
                        this.wheel.data[offset++] = 0;
                        this.wheel.data[offset++] = 0;
                    }
                }
            }
        }
        setHSV(h, s, v) {
            this.hue = h;
            this.saturation = s;
            this.value = v;
        }
        draw() {
            this.ctx.putImageData(this.wheel, 0, 0);
            const d = this.ctx.getImageData(0, 0, this.wheelSize, this.wheelSize);
            const start = Math.round(this.wheelSize / 2 - this.side / 2);
            const end = Math.round(this.wheelSize / 2 + this.side / 2);
            for (let y = start; y < end; y++) {
                const v = (y - start) / this.side;
                let offset = y * d.width * 4 + start * 4;
                for (let x = start; x < end; x++) {
                    const s = (x - start) / this.side;
                    const [r, g, b] = ColorPicker.hsv2rgb(this.hue, s, 1 - v);
                    d.data[offset++] = r;
                    d.data[offset++] = g;
                    d.data[offset++] = b;
                    d.data[offset++] = 0xff;
                }
            }
            const angle = this.hue * Math.PI * 2;
            const h = this.wheelSize / 2 - this.wheelThickness / 2;
            let hx = Math.round(Math.cos(angle) * h + this.wheelSize / 2);
            let hy = Math.round(this.wheelSize / 2 - Math.sin(angle) * h);
            this.drawHandle(d, hx, hy);
            hx = Math.round(this.saturation * this.side + start);
            hy = Math.round((1 - this.value) * this.side + start);
            this.drawHandle(d, hx, hy);
            this.ctx.putImageData(d, 0, 0);
        }
        track(x, y, update) {
            const start = Math.round(this.wheelSize / 2 - this.side / 2);
            const end = Math.round(this.wheelSize / 2 + this.side / 2);
            if (x >= start && x < end && y >= start && y < end) {
                this.trackSV(x, y, update);
            }
            else {
                this.trackH(x, y, update);
            }
        }
        trackH(x, y, update) {
            const outer = this.wheelSize / 2;
            const inner = this.wheelSize / 2 - this.wheelThickness;
            const dy = y - this.wheelSize / 2;
            const dx = x - this.wheelSize / 2;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance >= inner && distance < outer) {
                this.hue = 1 + (Math.atan2(-dy, dx) / (Math.PI * 2));
                this.draw();
                update(this.color());
                const mmove = (e) => {
                    const mdy = e.offsetY - this.wheelSize / 2;
                    const mdx = e.offsetX - this.wheelSize / 2;
                    this.hue = 1 + (Math.atan2(-mdy, mdx) / (Math.PI * 2));
                    this.draw();
                    update(this.color());
                    e.preventDefault();
                    return false;
                };
                const mup = () => {
                    document.removeEventListener("mousemove", mmove);
                    document.removeEventListener("mouseup", mup);
                    return false;
                };
                document.addEventListener("mousemove", mmove);
                document.addEventListener("mouseup", mup);
            }
        }
        trackSV(x, y, update) {
            const start = Math.round(this.wheelSize / 2 - this.side / 2);
            const end = Math.round(this.wheelSize / 2 + this.side / 2);
            this.saturation = (x - start) / this.side;
            this.value = 1 - (y - start) / this.side;
            this.draw();
            update(this.color());
            const mmove = (e) => {
                const mx = Math.max(Math.min(e.offsetX, end), start);
                const my = Math.max(Math.min(e.offsetY, end), start);
                this.saturation = (mx - start) / this.side;
                this.value = 1 - (my - start) / this.side;
                this.draw();
                update(this.color());
                e.preventDefault();
                return false;
            };
            const mup = () => {
                document.removeEventListener("mousemove", mmove);
                document.removeEventListener("mouseup", mup);
                return false;
            };
            document.addEventListener("mousemove", mmove);
            document.addEventListener("mouseup", mup);
        }
        color() {
            const [r, g, b] = ColorPicker.hsv2rgb(this.hue, this.saturation, this.value);
            return (r << 16) | (g << 8) | b;
        }
        drawHandle(d, x, y) {
            const circle = "..111.." +
                ".10001." +
                "10...01" +
                "10...01" +
                "10...01" +
                ".10001." +
                "..111..";
            let offset = (y - 3) * d.width * 4 + (x - 3) * 4;
            let pos = 0;
            for (y = 0; y < 7; y++, offset += d.width * 4 - 7 * 4) {
                for (x = 0; x < 7; x++, pos++) {
                    if (circle[pos] == ".") {
                        offset += 4;
                    }
                    else {
                        const c = (circle[pos] == "1") ? 0 : 0xff;
                        d.data[offset++] = c;
                        d.data[offset++] = c;
                        d.data[offset++] = c;
                        d.data[offset++] = 0xff;
                    }
                }
            }
        }
    }
    ColorPicker.ColorWheel = ColorWheel;
})(ColorPicker || (ColorPicker = {}));
//# sourceMappingURL=colorpicker.js.map