// Prepares the official logo (black lettering with gold edges on ivory stone)
// for use on the site. Usage:
//   node scripts/prepare-logo.mjs "<path>/Plumbers_on_Call_CORP_Logo.png"
//
// Nothing is redrawn. The ivory stone behind the letters is removed by
// colour-to-alpha so the same pixels can sit on the site's own ivory stone;
// the lettering, gold edges and soft shadows are the supplied artwork.
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const src = process.argv[2];
if (!src) throw new Error("Pass the official logo PNG path");
await mkdir("public/brand", { recursive: true });

const { data: P, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;

// Background estimate: the artwork heavily blurred, sampled only where it is
// still stone (bright). Falls back to the border average inside the letters.
const border = [0, 0, 0];
let n = 0;
for (let x = 0; x < W; x++) {
  for (const y of [1, H - 2]) {
    const i = (y * W + x) * 3;
    border[0] += P[i];
    border[1] += P[i + 1];
    border[2] += P[i + 2];
    n++;
  }
}
const bg = border.map((v) => v / n);

const out = Buffer.alloc(W * H * 4);
const cols = new Uint32Array(W);
for (let i = 0, j = 0, k = 0; i < P.length; i += 3, j += 4, k++) {
  let a = 0;
  for (let c = 0; c < 3; c++) {
    const p = P[i + c];
    const b = bg[c];
    const ac = p < b ? (b - p) / b : (p - b) / Math.max(1, 255 - b);
    if (ac > a) a = ac;
  }
  a = a < 0.085 ? 0 : Math.min(1, ((a - 0.085) / 0.915) * 1.15);
  for (let c = 0; c < 3; c++) {
    const v = a > 0 ? (P[i + c] - (1 - a) * bg[c]) / a : 0;
    out[j + c] = Math.max(0, Math.min(255, Math.round(v)));
  }
  out[j + 3] = Math.round(a * 255);
  if (a > 0.6 && Math.floor(k / W) < H * 0.72) cols[k % W]++;
}

// Report glyph column runs of the main line (to locate P, o and C).
const runs = [];
let start = -1;
for (let x = 0; x <= W; x++) {
  const on = x < W && cols[x] > 1;
  if (on && start < 0) start = x;
  if (!on && start >= 0) {
    runs.push([start, x - 1]);
    start = -1;
  }
}
console.log("size", W, H, "bg", bg.map(Math.round), "runs", JSON.stringify(runs));

const full = sharp(out, { raw: { width: W, height: H, channels: 4 } });
await full.clone().webp({ quality: 92, alphaQuality: 95 }).toFile("public/brand/logo.webp");
await full.clone().resize(560).webp({ quality: 90, alphaQuality: 95 }).toFile("public/brand/logo-560.webp");
console.log("logo done");
