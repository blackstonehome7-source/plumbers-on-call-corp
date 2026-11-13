import type { ImageKey, SiteImage } from "./types";

/**
 * Every image on the site is registered here with its provenance.
 * None of these document Plumbers on Call CORP jobs: all are illustrative
 * and rendered with a visible "Illustrative" label. Genuine project photos
 * belong in content/projects.ts, not here.
 */
const generated = { name: "Generated concept art", url: "", source: "Generated" } as const;

export const images: Record<ImageKey, SiteImage> = {
  bathroomSpa: {
    src: "/images/illustrative/bathroom-spa.webp",
    width: 1672,
    height: 941,
    alt: "Primary bathroom with a freestanding tub, double vanity and walk-in glass shower.",
    illustrative: true,
    credit: generated,
  },
  kitchen: {
    src: "/images/illustrative/kitchen.webp",
    width: 1672,
    height: 941,
    alt: "Bright kitchen with a farmhouse sink beneath a window and a brass faucet.",
    illustrative: true,
    credit: generated,
  },
  newEnglandHome: {
    src: "/images/illustrative/new-england-home.webp",
    width: 1817,
    height: 866,
    alt: "Brick and shingle New England home on a quiet, rain-washed street.",
    illustrative: true,
    credit: generated,
  },
  // Licensed stock photography (Unsplash License, free commercial use; attribution kept as courtesy).
  boiler: unsplash(
    "boiler.webp", 2000, 1330,
    "Heating system piping with valves, gauges and a circulator pump in a boiler room.",
    "Immo Wegmann", "U0jpGKtMtWE",
  ),
  waterHeater: unsplash(
    "water-heater.webp", 2000, 2500,
    "Copper water heater tank mounted on a green wall.",
    "Sies Kranen", "slTZivra5Zw",
  ),
  bathroomModern: unsplash(
    "bathroom-modern.webp", 2000, 3000,
    "Bathroom with a stone vanity, wall-mounted black faucet, arched mirror and walk-in shower.",
    "Peter Muniz", "9OKuf13OidA",
  ),
  residentialPipes: unsplash(
    "residential-pipes.webp", 2000, 3000,
    "Copper supply pipes running vertically inside an open wall.",
    "Kelsey Todd", "c5aW5Xy-O7c",
  ),
  commercial: unsplash(
    "commercial.webp", 2000, 1334,
    "Commercial restroom with a long stone counter, row of sinks and backlit mirrors.",
    "Alban", "hgPtOHE82Ec",
  ),
  emergency: unsplash(
    "emergency.webp", 2000, 1336,
    "Brass shut-off valve with a red handle on an exterior wall.",
    "Erik Mclean", "w2bzXCx7Y3g",
  ),
  fixtureDetail: unsplash(
    "fixture-detail.webp", 2000, 1334,
    "Brushed-brass widespread faucet on a white marble vanity.",
    "Clay Banks", "vYUkbsJ-Aq4",
  ),
  mechanicalRoom: unsplash(
    "mechanical-room.webp", 2000, 2666,
    "Mechanical room with valves and insulated piping.",
    "Haberdoedas", "iENM_LrJv9s",
  ),
};

function unsplash(
  file: string,
  width: number,
  height: number,
  alt: string,
  name: string,
  photoId: string,
): SiteImage {
  return {
    src: `/images/stock/${file}`,
    width,
    height,
    alt,
    illustrative: true,
    credit: { name, url: `https://unsplash.com/photos/${photoId}`, source: "Unsplash" },
  };
}
