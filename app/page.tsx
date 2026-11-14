import Link from "next/link";
import type { CSSProperties } from "react";
import { company } from "@/content/company";
import { scopes } from "@/content/scopes";
import { getService } from "@/content/services";
import { testimonials } from "@/content/testimonials";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeServices } from "@/components/home/HomeServices";
import { CtaBand } from "@/components/ui/CtaBand";
import { PhoneIcon } from "@/components/ui/Icon";
import { SiteImage } from "@/components/ui/SiteImage";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { pageMetadata } from "@/lib/seo";
import { SECTION_ROOMS } from "@/world/layout";
import styles from "./page.module.css";

export const metadata = pageMetadata({
  title: "Plumbers on Call CORP | Plumbing & Heating in Greater Boston",
  description:
    "Boilers, water heaters, bathroom plumbing and commercial work across Greater Boston, with 24/7 emergency service. Call (781) 299-5011.",
  path: "/",
});

/* The four points of the standard, each the plainest sentence of what we do. */
const principles = [
  {
    title: "Planned before it is built",
    body: "Larger jobs start with a look at the existing system and a clear scope.",
  },
  {
    title: "Workmanship you can inspect",
    body: "Straight runs, accessible valves, supported pipe and a clean work area.",
  },
  {
    title: "Residential and commercial",
    body: "We plan the work around occupants, operating hours and the people who share the space.",
  },
  {
    title: "Available around the clock",
    body: `Service is available ${company.availability}: call ${company.phone.display} whenever something cannot wait.`,
  },
];

/* Where each service lives in the building, top to bottom (the order of world/layout.ts). */
const floors = ["Top floor", "Living floor", "Street level", "Mechanical room", "Mechanical room", "At the main"];

const ri = (i: number) => ({ "--reveal-i": i }) as CSSProperties;

export default function HomePage() {
  const rooms = SECTION_ROOMS.map((slug, i) => {
    const s = getService(slug);
    return s ? { slug: s.slug, name: s.name, floor: floors[i], summary: s.summary } : undefined;
  }).filter((r) => r !== undefined);

  return (
    <>
      {/* Scene 1: the Name. */}
      <HomeHero />

      {/* Scene 2: the building in section. The camera goes down it floor by floor while
          the six services stay on glass at the left. The markers are the floors. */}
      <section id="services" className={styles.services} aria-labelledby="services-title">
        <div className={styles.stage}>
          <div className="container">
            <div className={`panel ${styles.servicesPanel}`}>
              <h2 id="services-title" className={styles.sceneTitle}>
                The systems a building <em>depends on.</em>
              </h2>
              <HomeServices items={rooms} markerPrefix="floor-" />
              <div className={styles.servicesFoot}>
                <Link href="/services" className="text-link">
                  See the whole building <span className="text-link__rule" aria-hidden="true" />
                </Link>
                <TrackedLink href={company.phone.href} event="phone_click" placement="home-services" className="btn btn--gold">
                  <PhoneIcon /> {company.phone.display}
                </TrackedLink>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.markers} aria-hidden="true">
          {rooms.map((r, i) => (
            <span key={r.slug} id={`floor-${i}`} data-world-step={i} style={{ "--i": i } as CSSProperties} />
          ))}
        </div>
      </section>

      {/* Scene 3: the standard. The camera closes on the main shut-off at the foot of the line. */}
      <section id="standard" className={styles.scene} aria-labelledby="standard-title" data-world-anchor="standard">
        <div className="container">
          <div className={`panel ${styles.standardPanel}`}>
            <h2 id="standard-title" className={styles.sceneTitle} data-reveal>
              Precision in <em>every</em> detail.
            </h2>
            <p className={styles.sceneLede} data-reveal style={ri(1)}>
              Most of our work ends up behind walls and under floors, where no one will ever check it. We build it
              as if someone will: runs that are plumb and level, valves you can reach, joints made to stay dry.
            </p>
            <ul className={styles.points}>
              {principles.map((p, i) => (
                <li key={p.title} data-reveal style={ri(i % 2)}>
                  <h3>{p.title}</h3>
                  <p>{p.body}</p>
                </li>
              ))}
            </ul>
            <Link href="/about" className="text-link">
              How we work <span className="text-link__rule" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Scene 4: the work. Three plates on ivory stone. */}
      <section className={styles.scene} aria-labelledby="work-title" data-world-anchor="gallery">
        <div className="container">
          <div className={`panel ${styles.workPanel}`}>
            <header className={styles.workHead}>
              <h2 id="work-title" className={styles.sceneTitle} data-reveal>
                From a single fixture to the <em>whole system.</em>
              </h2>
              <p className={styles.sceneLede} data-reveal style={ri(1)}>
                Three of the scopes of work we take on, each shown with an illustrative image.
              </p>
            </header>
            <ul className={styles.plates}>
              {scopes.slice(0, 3).map((s, i) => (
                <li key={s.title} data-reveal="mask" style={ri(i)}>
                  <Link href="/work" className={styles.plate}>
                    <span className={styles.plateMedia}>
                      <SiteImage image={s.image} fill decorative hideTag sizes="(max-width: 860px) 88vw, 26vw" />
                    </span>
                    <span className={styles.plateTitle}>{s.title}</span>
                    <span className="caption">Scope of work · Illustrative</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/work" className="text-link">
              Walk the gallery <span className="text-link__rule" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Scene 5: the company and its territory. */}
      <section className={`${styles.scene} ${styles.company}`} aria-label="The company">
        <div className="container">
          <div className={`panel ${styles.companyPanel}`}>
            <article data-reveal>
              <h2 className="display-m">
                Owner-led, and <em>accountable</em> for the work.
              </h2>
              <p>
                {company.name} is led by {company.owner.name}, {company.owner.title}. We serve homeowners,
                property managers and businesses, and we treat a building the way its owner would.
              </p>
              <Link href="/about" className="text-link">
                About the company <span className="text-link__rule" aria-hidden="true" />
              </Link>
            </article>
            <article data-reveal style={ri(1)}>
              <h2 className="display-m">
                {company.region}, and across <em>{company.state}.</em>
              </h2>
              <p>
                From Boston&apos;s older homes and brownstones to newer construction and commercial properties.
                Not sure if you&apos;re in range? Call and ask.
              </p>
              <Link href="/service-areas" className="text-link">
                Service areas <span className="text-link__rule" aria-hidden="true" />
              </Link>
            </article>
          </div>
        </div>
      </section>

      {/* Verified reviews only; hidden until content/testimonials.ts has entries. */}
      {testimonials.length > 0 ? (
        <section className="section" aria-labelledby="reviews-title">
          <div className="container">
            <h2 id="reviews-title" className={`display-m ${styles.reviewsTitle}`}>
              In our clients’ words.
            </h2>
            <div className={styles.reviews}>
              {testimonials.slice(0, 3).map((t) => (
                <figure key={t.quote} data-reveal>
                  <blockquote>“{t.quote}”</blockquote>
                  <figcaption>
                    {t.name}
                    {t.context ? ` · ${t.context}` : ""} ·{" "}
                    <a href={t.sourceUrl} rel="noopener" target="_blank">
                      {t.source}
                    </a>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <CtaBand placement="home" />
    </>
  );
}
