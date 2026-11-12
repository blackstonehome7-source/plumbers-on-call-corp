export type ImageKey =
  | "standardBathroom"
  | "bathroomSpa"
  | "kitchen"
  | "newEnglandHome"
  | "brandWall"
  | "boiler"
  | "waterHeater"
  | "bathroomModern"
  | "residentialPipes"
  | "commercial"
  | "emergency"
  | "mechanicalRoom"
  | "fixtureDetail";

export type SiteImage = {
  src: string;
  width: number;
  height: number;
  alt: string;
  /** Illustrative imagery (stock or generated). Always captioned; never presented as company work. */
  illustrative: true;
  credit?: { name: string; url: string; source: "Unsplash" | "Generated" };
};

export type ServiceSlug =
  | "boilers-heating"
  | "water-heaters"
  | "bathroom-plumbing"
  | "residential-plumbing"
  | "commercial-plumbing"
  | "emergency-plumbing";

export type Service = {
  slug: ServiceSlug;
  /** Navigation / card name, e.g. "Boilers & Heating". */
  name: string;
  /** Small uppercase label above the page title. */
  eyebrow: string;
  /** Page H1 — specific, editorial, not a slogan. */
  title: string;
  /** One sentence for cards and the services overview (≤ 160 chars). */
  summary: string;
  /** 2–3 short paragraphs explaining the service in plain language. */
  intro: string[];
  image: ImageKey;
  /** 4–6 common project types, each a short noun phrase plus one-line detail. */
  projectTypes: { title: string; detail: string }[];
  /** 3–4 things a customer should weigh, each with a 1–3 sentence body. */
  considerations: { title: string; body: string }[];
  /** 4–6 real customer questions with honest, non-committal-where-needed answers. */
  faqs: { q: string; a: string }[];
  related: ServiceSlug[];
  /** Primary CTA label for this page. */
  cta: string;
  seo: { title: string; description: string };
};

export type Project = {
  slug: string;
  title: string;
  category: ServiceSlug;
  /** General location (town) only when the client approved it. */
  location?: string;
  year?: number;
  /** Genuine company photography only. */
  photos: { src: string; width: number; height: number; alt: string }[];
  challenge: string;
  work: string[];
  outcome?: string;
};
