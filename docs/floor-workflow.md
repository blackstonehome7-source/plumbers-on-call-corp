# Building a floor of the Services building: team workflow

Each floor of the Services page is built by a small team of agents. The main
session is the orchestrator: it sets the art direction, hands out the work,
checks every result against the owner's brief and `DESIGN.md`, and commits.
It does not build. The bathroom (floor 01) is the first floor made this way
and the pattern for the next five.

## Technique (decided for floor 01, reused unless a floor needs otherwise)

Real geometry, real camera, baked light. The room is modelled and lit in
Blender with Cycles; the light is path-traced once and stored in lightmaps; the
site draws the same geometry with that light and computes live only what
depends on the eye or on time (floor reflection, mirror, metal, water, steam,
curtain). It looks rendered, the camera can move through it, and it costs a
phone almost nothing.

## Roles and what each one owns

| Role | Owns (nobody else edits these) | Delivers |
|---|---|---|
| **Scene** (Blender) | `scripts/<floor>.py`, `scripts/make-stone.py`, `scripts/*-pack.mjs`, `scripts/bake-world.py`, `scripts/fixtures.py`, `public/world/baked/*`, `public/world/tex/*`, `world/scenes/<floor>.layout.json` (generated) | Model, light, lightmaps, mirror picture, panorama, layout file |
| **Live** (three.js) | `world/**/*.ts`, `components/world/*` | The floor's scene module, camera, water and air, interaction signals, performance |
| **Words** (page) | `app/services/*`, `components/services/*` | Typography, content, scroll structure, phone layout, fallbacks |
| **Review** | nothing (read-only) | Findings against the brief, `DESIGN.md`, accessibility and motion guidelines |
| **Orchestrator** | `DESIGN.md`, `docs/*`, commits | Briefs, order of work, verification, integration |

## The contract between the roles (floor 01)

- **Layout file** `world/scenes/bathroom.layout.json` is written by
  `scripts/bathroom.py` and read by the live scene and the engine. Keys may be
  added; none is renamed or removed without telling the orchestrator.
- **Material names** in `bathroom.glb` select the live material:
  `bathStone`, `bathFloor`, `bathPlaster`, `bathCeramic`, `bathLinen`,
  `bathAmber` (these carry a lightmap: `light-a` for the first three, `light-b`
  for the rest), `bathMetal`, `bathDark`, `bathGlass`, `bathGlow`,
  `bathCurtain`, `bathMirror`, `bathCut` (the building's cut faces, drawn in
  the house marble).
- **Signal** `signalWorld({ name: "bath", value })`: `-1` the room at rest,
  `0` rough-in, `1` shower, `2` vanity, `3` tub (`BATH_ZONES`).
- **Scroll markers**: `[data-world-step="0"]` twice, at the start and at the
  end of the floor's hold (the camera stays while the page scrolls between
  them), then `[data-world-step="1"]` … `"5"` for the floors below.
- **Words on the wall**: the element with `data-world-pin="bath"` receives,
  every frame on landscape screens, `--wall-x`, `--wall-y` (viewport pixels of
  the words' top-left corner on the back wall) and `--wall-m` (pixels per metre
  of wall), plus the attribute `data-pinned`. Without `data-pinned` (phones, no
  3D) the page lays the words out itself.

## Gates

1. **Composition**: Blender `preview` frame from the visitor's standpoint. The
   orchestrator approves before any bake.
2. **Draft in the site**: draft bake packed, live scene running, capture at
   1440 × 900.
3. **Words**: typography and scroll structure on top of the draft.
4. **Review**: read-only audit; findings go back to the owning role.
5. **Final**: final-quality bake, then `npx tsc --noEmit`, `npx eslint .`,
   `node --test lib/inquiry.test.ts`, `npm run build`,
   `node scripts/shots.mjs` at 1440 × 900 and 390 × 844.

## Rules for every agent

- Work in `C:\Users\muniq\Documents\plumbers-on-call-corp` on the current
  branch. No commit, push, deploy, branch switch or stash. Never read or print
  `.env` files.
- Edit only the files your role owns. If another role's file needs a change,
  say so in your report instead of making it.
- Edit with the editor tools (not scripted rewrites) so the running dev server
  sees the change. Do not start, stop or restart the dev server
  (`http://localhost:5181`); if a change does not show, report it.
- Check your work in a real browser: `node scripts/shots.mjs --sizes 1440x900 services`
  (routes without a leading slash) writes captures to `.shots/` and prints
  frames per second and console errors. Look at the captures.
- The GPU is shared with Blender bakes, so frame rates measured during a bake
  are not evidence.
- No invented projects, reviews, claims, licences or contact details. The
  official logo is never redrawn. Read `DESIGN.md` first.
- Report: what changed (files), what you verified and how (real output), what
  you did not verify, and anything another role must do.

## Commands

```
blender -b -P scripts/bathroom.py -- <out> preview          # one frame, about a minute
blender -b -P scripts/bathroom.py -- <out> bake draft       # everything, quick
blender -b -P scripts/bathroom.py -- <out> bake final       # everything, clean
node scripts/bathroom-pack.mjs <out>                        # into public/ and the layout file
blender -b -P scripts/make-stone.py -- <dir> && node scripts/tile-marble.mjs <dir> stone-color
node scripts/shots.mjs --sizes 1440x900,390x844 services services/bathroom-plumbing home
```
