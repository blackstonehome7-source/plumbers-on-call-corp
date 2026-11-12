/**
 * Verified customer feedback only — copied word for word from a public source
 * (e.g. Google reviews) with the reviewer's displayed name and the source URL.
 * The homepage section stays hidden while this list is empty.
 */
export type Testimonial = {
  quote: string;
  name: string;
  context?: string; // e.g. "Water heater replacement, Newton"
  source: string; // e.g. "Google"
  sourceUrl: string;
};

export const testimonials: Testimonial[] = [];
