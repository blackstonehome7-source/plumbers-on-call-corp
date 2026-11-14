import { CanvasTexture } from "three";

/**
 * The glow a hidden light strip throws on stone: brightest at the strip (the
 * top edge of the texture), falling away below it and fading toward both ends
 * so it has no hard edge. Painted once and used on additive planes wherever a
 * strip grazes a wall or a floor (DESIGN.md rule 2).
 */
export function createWashTexture(): CanvasTexture {
  const gradient = document.createElement("canvas");
  gradient.width = 128;
  gradient.height = 128;
  const g2d = gradient.getContext("2d");
  if (g2d) {
    const fall = g2d.createLinearGradient(0, 0, 0, 128);
    fall.addColorStop(0, "rgba(255,255,255,1)");
    fall.addColorStop(0.18, "rgba(255,255,255,0.38)");
    fall.addColorStop(0.55, "rgba(255,255,255,0.08)");
    fall.addColorStop(1, "rgba(255,255,255,0)");
    g2d.fillStyle = fall;
    g2d.fillRect(0, 0, 128, 128);
    g2d.globalCompositeOperation = "destination-in";
    const sides = g2d.createLinearGradient(0, 0, 128, 0);
    sides.addColorStop(0, "rgba(0,0,0,0)");
    sides.addColorStop(0.16, "rgba(0,0,0,1)");
    sides.addColorStop(0.84, "rgba(0,0,0,1)");
    sides.addColorStop(1, "rgba(0,0,0,0)");
    g2d.fillStyle = sides;
    g2d.fillRect(0, 0, 128, 128);
  }
  return new CanvasTexture(gradient);
}
