import type { ImageKey, ServiceSlug } from "./types";

/**
 * Kinds of work the company takes on, shown on Home and /work while genuine
 * project stories are being documented. These describe scopes of work, not
 * specific completed jobs, and their images are illustrative.
 */
export const scopes: { title: string; detail: string; image: ImageKey; service: ServiceSlug }[] = [
  {
    title: "Primary bath remodel",
    detail: "Rough-in for a relocated shower, freestanding tub filler and double vanity.",
    image: "bathroomModern",
    service: "bathroom-plumbing",
  },
  {
    title: "Boiler replacement",
    detail: "Removing an end-of-life boiler and installing a correctly sized modern system.",
    image: "boiler",
    service: "boilers-heating",
  },
  {
    title: "Kitchen fixtures & supply",
    detail: "New sink, faucet, dishwasher and supply lines planned around the cabinetry.",
    image: "residentialPipes",
    service: "residential-plumbing",
  },
  {
    title: "Water heater upgrade",
    detail: "Replacing a failing tank with a unit matched to the household's demand.",
    image: "waterHeater",
    service: "water-heaters",
  },
  {
    title: "Commercial restroom",
    detail: "Fixture installation scheduled around a business's operating hours.",
    image: "commercial",
    service: "commercial-plumbing",
  },
];
