// One-off asset preparation from the approved phase1 artwork (v6 hero + POC Standard).
// Usage: node scripts/prepare-brand-assets.mjs "<phase1>/public/assets"
// Outputs optimized layers into public/brand and public/images/illustrative.
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const src = process.argv[2];
if (!src) throw new Error("Pass the phase1 public/assets directory");
const at = (f) => path.join(src, f);
const brand = "public/brand";
const illus = "public/images/illustrative";
await mkdir(brand, { recursive: true });
await mkdir(illus, { recursive: true });

// Hero stone: the v6 clean plate already carries the approved architecture
// (corner slabs, light fall) without any baked interface text.
const plate = at("hero-approved-clean-plate-v6.png");
await sharp(plate).webp({ quality: 80 }).toFile(`${brand}/hero-stone.webp`);
await sharp(plate).resize(900).webp({ quality: 76 }).toFile(`${brand}/hero-stone-900.webp`);
await sharp(at("reference-ivory-calcite-v3.png")).webp({ quality: 80 }).toFile(`${brand}/stone-calcite.webp`);

// Wordmark: exact approved source rectangle x265 y245 1130x285, pixels unaltered.
await sharp(at("hero-approved-reference-v6.png"))
  .extract({ left: 265, top: 245, width: 1130, height: 285 })
  .webp({ quality: 92 })
  .toFile(`${brand}/wordmark.webp`);

// POC Standard: room aperture from the supplied section reference.
await sharp(at("poc-standard-reference.png"))
  .extract({ left: 548, top: 42, width: 1038, height: 826 })
  .webp({ quality: 82 })
  .toFile(`${illus}/standard-bathroom.webp`);

// Illustrative interiors (AI-generated in phase1; always captioned as illustrative).
await sharp(at("bathroom-interior-fallback.jpg")).webp({ quality: 80 }).toFile(`${illus}/bathroom-spa.webp`);
await sharp(at("kitchen-interior-fallback.png")).webp({ quality: 80 }).toFile(`${illus}/kitchen.webp`);
await sharp(at("exterior-hero.webp")).webp({ quality: 78 }).toFile(`${illus}/new-england-home.webp`);
await sharp(at("approved-bathroom-hero.png")).webp({ quality: 82 }).toFile(`${illus}/brand-wall.webp`);

console.log("done");

// Social share image (1200x630): the reference's own logo area blended into
// the clean plate at its native position (stone matches there), then cropped.
const logoMask = await sharp(
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1672" height="941"><rect width="1672" height="941" fill="#000"/><rect x="250" y="215" width="1160" height="285" fill="#fff"/></svg>`,
  ),
)
  .resize(1672, 941)
  .extractChannel(0)
  .blur(18)
  .raw()
  .toBuffer();
const logoLayer = await sharp(at("hero-approved-reference-v6.png"))

  .joinChannel(logoMask, { raw: { width: 1672, height: 941, channels: 1 } })
  .png()
  .toBuffer();
const ogBase = await sharp(plate).composite([{ input: logoLayer }]).png().toBuffer();
await sharp(ogBase)
  .extract({ left: 0, top: 0, width: 1672, height: 878 })
  .resize(1200, 630)
  .jpeg({ quality: 84 })
  .toFile("public/og.jpg");
console.log("og done");

// Transparent wordmark for UI surfaces: colour-to-alpha against the clean
// plate, which is the stone that sits behind the logo in the approved artwork.
{
  const box = { left: 265, top: 245, width: 1130, height: 285 };
  const P = await sharp(at("hero-approved-reference-v6.png")).extract(box).raw().toBuffer();
  const B = await sharp(plate).extract(box).blur(6).raw().toBuffer();
  const out = Buffer.alloc(box.width * box.height * 4);
  for (let i = 0, j = 0; i < P.length; i += 3, j += 4) {
    let a = 0;
    for (let c = 0; c < 3; c++) {
      const p = P[i + c];
      const b = Math.max(1, B[i + c]);
      const ac = p < b ? (b - p) / b : (p - b) / Math.max(1, 255 - b);
      if (ac > a) a = ac;
    }
    a = a < 0.07 ? 0 : Math.min(1, (a - 0.07) / 0.93 * 1.15);
    for (let c = 0; c < 3; c++) {
      const v = a > 0 ? (P[i + c] - (1 - a) * B[i + c]) / a : 0;
      out[j + c] = Math.max(0, Math.min(255, Math.round(v)));
    }
    out[j + 3] = Math.round(a * 255);
  }
  await sharp(out, { raw: { width: box.width, height: box.height, channels: 4 } })
    .webp({ quality: 90, alphaQuality: 90 })
    .toFile(`${brand}/wordmark-alpha.webp`);
  console.log("alpha wordmark done");
}
