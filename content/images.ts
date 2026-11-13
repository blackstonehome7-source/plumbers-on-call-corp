import type { ImageKey, SiteImage } from "./types";

/**
 * Every image on the site is registered here with its provenance.
 * None of these document Plumbers on Call CORP jobs: they are our own 3D
 * renders (plus one generated exterior) and carry a visible "Illustrative" label. Genuine project photos
 * belong in content/projects.ts, not here.
 */
const generated = { name: "Generated concept art", url: "", source: "Generated" } as const;

export const images: Record<ImageKey, SiteImage> = {
  newEnglandHome: {
    src: "/images/illustrative/new-england-home.webp",
    width: 1817,
    height: 866,
    alt: "Brick and shingle New England home on a quiet, rain-washed street.",
    illustrative: true,
    credit: generated,
  },
  // Our own renders of the fixtures in the site's 3D building (scripts/render-fixtures.py).
  boiler: render("boiler", "3D render of a wall-hung boiler with brass pipework and a valve manifold."),
  waterHeater: render("tank", "3D render of a storage water heater with brass supply lines."),
  bathroomModern: render("tub", "3D render of a freestanding tub with a brass floor-standing filler."),
  residentialPipes: render("kitchen", "3D render of a kitchen counter with a sink, brass faucet and supply lines."),
  commercial: render("commercial", "3D render of a row of wall-hung basins with brass spouts."),
  emergency: render("valve", "3D render of a main shut-off valve with a red lever on a brass water main."),
  mechanicalRoom: render("radiators", "3D render of column radiators on a brass heating loop."),
  fixtureDetail: render("meter", "3D render of a water meter and unions on a brass water main."),
};

function render(file: string, alt: string): SiteImage {
  return {
    src: `/images/renders/${file}.webp`,
    width: 1600,
    height: 1000,
    alt,
    illustrative: true,
    credit: { name: "3D render", url: "", source: "Generated" },
  };
}
