import { hsv2rgb, rgbString } from "@kurkle/color";

function* hueGen() {
  yield 0;
  for (let i = 1; i < 10; i++) {
    const d = 1 << i;
    for (let j = 1; j <= d; j += 2) {
      yield j / d;
    }
  }
}

export function* colorGen() {
  const hue = hueGen();
  let h = hue.next();
  while (!h.done) {
    let rgb = hsv2rgb(Math.round(h.value * 360), 0.6, 0.8);
    yield {
      background: rgbString({ r: rgb[0], g: rgb[1], b: rgb[2], a: 192 }),
      border: rgbString({ r: rgb[0], g: rgb[1], b: rgb[2], a: 144 }),
    };
    rgb = hsv2rgb(Math.round(h.value * 360), 0.6, 0.5);
    yield {
      background: rgbString({ r: rgb[0], g: rgb[1], b: rgb[2], a: 192 }),
      border: rgbString({ r: rgb[0], g: rgb[1], b: rgb[2], a: 144 }),
    };
    h = hue.next();
  }
}
