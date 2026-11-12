/**
 * Single source of truth for business facts. Only verified facts belong here.
 * Source: the company's printed business card and the live site (2026-11).
 * Fields set to null are waiting on the owner; the UI hides whatever is null.
 */
export const company = {
  name: "Plumbers on Call CORP",
  shortName: "Plumbers on Call",
  url: "https://plumberoncallcorp.com",
  phone: {
    display: "(781) 299-5011",
    compact: "781-299-5011",
    href: "tel:+17812995011",
    e164: "+17812995011",
  },
  email: "plumbersoncallcorp@gmail.com",
  owner: { name: "Antonio Abdallah", title: "President & Owner" },
  region: "Greater Boston",
  state: "Massachusetts",
  /** Printed on the card: Residential | Commercial | 24/7 Service. */
  availability: "24/7",
  /** Housecall Pro online-booking link. Null until the owner supplies a verified URL. */
  bookingUrl: null as string | null,
  /** Public review profile (e.g. Google Business Profile). Null until supplied. */
  reviewUrl: null as string | null,
  /** Massachusetts plumbing license number(s). Null until verified. */
  license: null as string | null,
} as const;

export type Company = typeof company;
