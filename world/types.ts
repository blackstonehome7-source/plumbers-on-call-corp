import type { Group, Texture } from "three";
import type { Materials } from "./materials";

/** "full" on desktop-class devices, "lite" on phones and low-power devices. */
export type Tier = "full" | "lite";

export interface WorldCtx {
  tier: Tier;
  mats: Materials;
  /** Loads a texture (sRGB). The world re-renders when it arrives. */
  texture(url: string): Texture;
}

export interface FrameState {
  /** Seconds since the world started. */
  time: number;
  /** Seconds since the previous frame (clamped to 0.05). */
  dt: number;
  /** Smoothed pointer position, -1..1 on each axis (0 on touch devices). */
  pointerX: number;
  pointerY: number;
  /** 0..1 — how close the camera is to this scene (1 = the camera is here). */
  presence: number;
}

/**
 * A place in the world. The module positions its own `group` in world space
 * using the constants in ./layout. `update` runs every frame while presence > 0.
 * Lights belong to the group; scale their intensity by `presence` so distant
 * places cost nothing visually (never add/remove lights after creation).
 */
export interface SceneModule {
  group: Group;
  update(frame: FrameState): void;
}
