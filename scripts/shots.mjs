// Capture the site the way a visitor's browser draws it: installed Chrome, real GPU,
// animation running. Used to check every scene against DESIGN.md at the sizes it ships at.
//
//   node scripts/shots.mjs [--base http://localhost:5181] [--out .shots] [--sizes 1440x900,390x844] [home services work ...]
//
// For each route and size it saves the top of the page, one frame per
// [data-world-step] scene and the end of the page, and prints the tier, the
// quality step and the measured frames per second.
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args.splice(i, 2)[1];
};
const base = opt("base", "http://localhost:5181");
const out = opt("out", ".shots");
const sizes = opt("sizes", "1440x900,390x844").split(",").map((s) => s.split("x").map(Number));
// Routes may be given without the leading slash ("services", "services/boilers-heating",
// "home"): Git Bash on Windows rewrites arguments that start with one.
const routes = (args.length ? args : ["home", "services", "work", "about", "contact"]).map((r) =>
  r === "home" ? "/" : r.startsWith("/") ? r : `/${r}`,
);

const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"],
});

for (const [width, height] of sizes) {
  const phone = width < 768;
  const context = await browser.newContext({ viewport: { width, height }, isMobile: phone, hasTouch: phone });
  // The intro plays once per visit; these captures are of the pages themselves.
  await context.addInitScript(() => sessionStorage.setItem("poc-intro", "1"));
  const dir = path.join(out, `${width}x${height}`);
  await mkdir(dir, { recursive: true });

  for (const route of routes) {
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && !m.text().includes("_next/hmr") && errors.push(m.text()));
    await page.goto(base + route, { waitUntil: "networkidle" });
    await page.waitForTimeout(3500);
    const slug = route === "/" ? "home" : route.slice(1).replaceAll("/", "-");
    const shot = (name) => page.screenshot({ path: path.join(dir, `${slug}-${name}.jpg`), quality: 86 });

    const info = await page.evaluate(async () => {
      const frames = await new Promise((done) => {
        let n = 0;
        const t0 = performance.now();
        const tick = (t) => (t - t0 < 1000 ? (n++, requestAnimationFrame(tick)) : done(n));
        requestAnimationFrame(tick);
      });
      const d = document.documentElement;
      return {
        fps: frames,
        tier: d.dataset.tier ?? "none",
        quality: d.dataset.quality ?? "full",
        steps: document.querySelectorAll("[data-world-step]").length,
        overflow: d.scrollWidth > innerWidth,
      };
    });
    await shot("00-top");
    for (let i = 0; i < info.steps; i++) {
      await page.evaluate((k) => document.querySelectorAll("[data-world-step]")[k].scrollIntoView({ block: "center" }), i);
      await page.waitForTimeout(1800);
      await shot(`${String(i + 1).padStart(2, "0")}-scene`);
    }
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(1800);
    await shot("99-end");
    console.log(
      `${width}x${height} ${route.padEnd(28)} tier=${info.tier} quality=${info.quality} fps=${info.fps}` +
        `${info.overflow ? " OVERFLOW-X" : ""}${errors.length ? ` errors=${errors.length}: ${errors[0].slice(0, 120)}` : ""}`,
    );
    await page.close();
  }
  await context.close();
}
await browser.close();
