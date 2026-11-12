import type { Project } from "./types";

/**
 * Completed Plumbers on Call CORP projects — genuine photography only.
 * Empty until the owner supplies real project photos and details.
 * Adding an entry automatically creates /work/<slug>, lists it on /work and
 * the homepage, and adds it to the sitemap.
 *
 * Example shape:
 * {
 *   slug: "back-bay-primary-bath",
 *   title: "Primary bath remodel plumbing",
 *   category: "bathroom-plumbing",
 *   location: "Back Bay, Boston",            // only with client approval
 *   year: 2026,
 *   photos: [{ src: "/images/projects/back-bay/01.jpg", width: 2000, height: 1333, alt: "..." }],
 *   challenge: "What the client needed and what made it difficult.",
 *   work: ["Relocated the shower drain…", "New pressure-balanced valve…"],
 *   outcome: "Only verified outcomes.",
 * }
 */
export const projects: Project[] = [];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
