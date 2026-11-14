// Make the marble textures tile without a seam and write them as WebP.
//
//   node scripts/tile-marble.mjs <dir with marble-color.png and marble-orm.png>
//
// The left and bottom edges are cross-faded with the opposite edges, so the
// texture repeats with no mirror axis and no visible join. The tile that comes
// out covers (1 - BAND) of the source, which is why world/materials.ts sets one
// tile to 7.418 m rather than the 8.43 m the source was drawn at.
import path from "node:path";
import sharp from "sharp";

const BAND = 0.12;
const SIZE = 2048;
const dir = process.argv[2];
if (!dir) throw new Error("usage: node scripts/tile-marble.mjs <dir>");

for (const name of ["marble-color", "marble-orm"]) {
  const { data, info } = await sharp(path.join(dir, `${name}.png`)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  const bx = Math.round(W * BAND);
  const by = Math.round(H * BAND);
  const at = (x, y, c) => data[(y * W + x) * C + c];
  // Source pixel with the left band faded into the right edge.
  const fadedX = (x, y, c) => {
    if (x >= bx) return at(x, y, c);
    const s = x / bx;
    return s * at(x, y, c) + (1 - s) * at(x + W - bx, y, c);
  };
  const outW = W - bx;
  const outH = H - by;
  const out = Buffer.alloc(outW * outH * C);
  for (let oy = 0; oy < outH; oy++) {
    const y = oy + by; // keep rows [by, H); the top band only feeds the fade
    const s = y >= H - by ? (H - y) / by : 1; // bottom band fades into the top rows
    for (let x = 0; x < outW; x++) {
      for (let c = 0; c < C; c++) {
        const v = s === 1 ? fadedX(x, y, c) : s * fadedX(x, y, c) + (1 - s) * fadedX(x, y - (H - by), c);
        out[(oy * outW + x) * C + c] = Math.round(v);
      }
    }
  }
  const file = path.join("public/world/tex", `${name}.webp`);
  await sharp(out, { raw: { width: outW, height: outH, channels: C } }).resize(SIZE, SIZE).webp({ quality: 88 }).toFile(file);
  console.log("wrote", file);
}
