// Put what scripts/bathroom.py baked where the site loads it.
//
//   node scripts/bathroom-pack.mjs <dir the bake wrote to>
//
// Lightmaps and the mirror picture become WebP under public/world/baked; the
// geometry and the panorama are copied; the layout the live scene reads goes
// to world/scenes/bathroom.layout.json.
import { copyFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const dir = process.argv[2];
if (!dir) throw new Error("usage: node scripts/bathroom-pack.mjs <dir>");
const out = "public/world/baked";

for (const [name, quality] of [["light-a", 92], ["light-b", 92], ["mirror", 86]]) {
  const file = path.join(out, `bathroom-${name}.webp`);
  await sharp(path.join(dir, `${name}.png`)).removeAlpha().webp({ quality, smartSubsample: true }).toFile(file);
  console.log("wrote", file);
}
await copyFile(path.join(dir, "bathroom.glb"), path.join(out, "bathroom.glb"));
await copyFile(path.join(dir, "env.hdr"), path.join(out, "bathroom-env.hdr"));
await copyFile(path.join(dir, "layout.json"), "world/scenes/bathroom.layout.json");
console.log("copied bathroom.glb, bathroom-env.hdr and the layout");
