import Link from "next/link";
import type { CSSProperties } from "react";
import { company } from "@/content/company";
import { services } from "@/content/services";
import { PageHero } from "@/components/ui/PageHero";
import { CtaBand } from "@/components/ui/CtaBand";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { PhoneIcon } from "@/components/ui/Icon";
import { pageMetadata } from "@/lib/seo";
import styles from "./page.module.css";

export const metadata = pageMetadata({
  title: "Service Areas: Greater Boston & Massachusetts | Plumbers on Call CORP",
  description:
    "Plumbers on Call CORP serves homes and businesses across Greater Boston and Massachusetts, with 24/7 emergency plumbing. Call (781) 299-5011 to check your area.",
  path: "/service-areas",
});

/*
 * Town list intentionally omitted until the owner confirms which communities
 * are served. Add them to a `towns` array here (no individual city pages —
 * one useful page beats dozens of thin ones).
 */
const buildingTypes = [
  {
    title: "Older homes and multi-family buildings",
    body: "Much of Greater Boston’s housing is decades old: cast-iron drains, galvanized supply lines, steam and hot-water heating, and years of past alterations. Work in these buildings starts with understanding what is already there.",
  },
  {
    title: "Renovations and newer construction",
    body: "Remodels and additions need plumbing that is planned with the layout — rough-in coordinated with the contractor and designer, and fixtures set once finishes are in.",
  },
  {
    title: "Commercial properties",
    body: "Offices, retail and restaurants need work scheduled around operating hours, clear communication with property management, and documentation of what was done.",
  },
];

export default function ServiceAreasPage() {
  return (
    <>
      <PageHero
        variant="banner"
        eyebrow="Service areas"
        title={`Serving ${company.region} and communities across ${company.state}.`}
        lede={
          <p>
            We work throughout {company.region} and take on projects across {company.state}. If you are not
            sure whether your address is in range, call — we will tell you straight away.
          </p>
        }
        crumbs={[{ name: "Service Areas", path: "/service-areas" }]}
        image="newEnglandHome"
        actions={
          <TrackedLink href={company.phone.href} event="phone_click" placement="service-areas" className="btn btn--dark">
            <PhoneIcon /> Check your area · {company.phone.display}
          </TrackedLink>
        }
      />

      <section className="section section--paper" aria-labelledby="buildings-title">
        <div className={`container ${styles.layout}`}>
          <div className={styles.head}>
            <p className="eyebrow" data-reveal>
              Local knowledge
            </p>
            <h2 id="buildings-title" className="display-m" data-reveal>
              The buildings we work in.
            </h2>
          </div>
          <div className={styles.list}>
            {buildingTypes.map((b, i) => (
              <article key={b.title} data-reveal style={{ "--reveal-i": i } as CSSProperties}>
                <h3>{b.title}</h3>
                <p>{b.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="area-services-title">
        <div className="container">
          <h2 id="area-services-title" className="display-m" data-reveal>
            Services available across our area.
          </h2>
          <ul className={styles.services}>
            {services.map((s) => (
              <li key={s.slug}>
                <Link href={`/services/${s.slug}`}>{s.name}</Link>
              </li>
            ))}
          </ul>
          <p className={styles.note}>
            Emergency service is available {company.availability}. For planned work outside {company.region},
            get in touch with the details and location and we will let you know.
          </p>
        </div>
      </section>

      <CtaBand placement="service-areas" />
    </>
  );
}
