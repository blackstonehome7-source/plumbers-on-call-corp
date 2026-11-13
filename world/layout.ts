/**
 * World map. One continuous space; every page is a place along the brass line.
 * Units are roughly metres. +x right, +y up, +z toward the viewer.
 * The camera always stays in front (z > 4) of everything.
 *
 *   y ≈ +12   The Plumb   (About)      — plumb bob hanging beside the line
 *   y ≈   0   The Name    (Home)       — gold wordmark on the stone wall, left of the line
 *             The Valve   (Contact)    — far left along the same wall
 *             The Plates  (Our Work)   — free-standing fins to the right of the wall
 *   y ≈  -9…-29  The Section (Services) — building cut in section, the line is its riser
 */

/** The brass line: vertical, in front of the wall. */
export const LINE = { x: 0, z: 0.4, top: 26, bottom: -40, radius: 0.022 } as const;

/** The stone wall behind Home, About and Contact. Front face at z = 0. */
export const WALL = { left: -24, right: 3, bottom: -1.6, top: 22, depth: 0.6 } as const;

/** Polished floor under the wall and the plates. */
export const FLOOR = { y: -1.6, left: -24, right: 36, back: -0.6, front: 8 } as const;

/**
 * The official logo on its ivory stone slab, set proud of the wall.
 * `width` is the logo artwork's width in world units; the slab is larger.
 */
export const SIGN = { x: -4.6, y: 2.5, width: 6.2, aspect: 275 / 1210, slabW: 8.1, slabH: 2.9, slabD: 0.14 } as const;

/** Logo artwork: horizontal centres (0..1) and vertical centre of the letters P, o, C. */
export const MONO = { p: 93 / 1210, o: 796 / 1210, c: 950 / 1210, v: 0.6 } as const;

/**
 * The Section: six rooms stacked on the line. Room 0 is the top.
 * Room i spans y from roomBottom(i) (its floor slab top) to roomBottom(i) + floorH.
 * The building is centred on the line (x = 0) and is `width` wide, `depth` deep
 * (from z = -depth + 1 at the back to z = 1 at the open front).
 */
export const SECTION = { top: -8.5, floorH: 3.3, count: 6, width: 10.5, depth: 4.6, slab: 0.16 } as const;
export const roomBottom = (i: number) => SECTION.top - SECTION.floorH * (i + 1);
export const roomCenter = (i: number) => roomBottom(i) + SECTION.floorH / 2;

/** Physical order of the rooms, top to bottom, by service slug. */
export const SECTION_ROOMS = [
  "bathroom-plumbing",
  "residential-plumbing",
  "commercial-plumbing",
  "boilers-heating",
  "water-heaters",
  "emergency-plumbing",
] as const;

/** The Plates: plate i is centred at x = x0 + gap * i, standing on the floor. */
export const PLATES = { x0: 9.5, gap: 4.4, y: 0.35, z: 0, w: 3.2, h: 2.25 } as const;

/** The Plumb: a bob hanging from a pivot high above, in front of the wall. */
export const PLUMB = { x: -2.1, z: 1.2, pivotY: 21, bobY: 12.3 } as const;

/** The Valve: a door slot in the wall with the line's branch ending at a lever valve. */
export const VALVE = { x: -17.2, y: -0.25, slotW: 0.7, slotH: 3.8 } as const;
