import Link from "next/link";
import type { CSSProperties } from "react";
import { company } from "@/content/company";
import { scopes } from "@/content/scopes";
import { services } from "@/content/services";
import { testimonials } from "@/content/testimonials";
import { HomeHero } from "@/components/home/HomeHero";
import { CtaBand } from "@/components/ui/CtaBand";
import { ArrowUpRight, PhoneIcon } from "@/components/ui/Icon";
import { SiteImage } from "@/components/ui/SiteImage";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { pageMetadata } from "@/lib/seo";
import styles from "./page.module.css";

export const metadata = pageMetadata({
  title: "Plumbers on Call CORP | Plumbing & Heating in Greater Boston",
  description:
    "Boilers, water heaters, bathroom plumbing and commercial work across Greater Boston, with 24/7 emergency service. Call (781) 299-5011.",
  path: "/",
});

const principles = [
  {
    title: "Planned before it is built",
    body: "Larger jobs start with a look at the existing system and a clear scope, so the plan accounts for what is behind the wall before anything is opened.",
  },
  {
    title: "Workmanship you can inspect",
    body: "Straight runs, accessible valves, supported pipe and a clean work area. The parts no one sees are held to the same standard as the parts everyone does.",
  },
  {
    title: "Residential and commercial",
    body: "Homes, multi-family buildings and businesses each have their own constraints. We plan the work around occupants, operating hours and the people who share the space.",
  },
  {
    title: "Available around the clock",
    body: `Plumbing problems do not keep office hours, so neither do we. Service is available ${company.availability}: call ${company.phone.display} whenever something cannot wait.`,
  },
];

const ri = (i: number) => ({ "--reveal-i": i }) as CSSProperties;

export default function HomePage() {
  const emergency = services.find((s) => s.slug === "emergency-plumbing");
  const planned = services.filter((s) => s.slug !== "emergency-plumbing");

  return (
    <>
      <HomeHero />

      {/* The standard: set in the open, beside the line as the camera sinks past the floor. */}
      <section id="standard" className={styles.standard} aria-labelledby="standard-title">
        <div className={`container ${styles.standardInner}`}>
          <p className="eyebrow" data-reveal>
            The POC standard
          </p>
          <h2 id="standard-title" className={styles.statement} data-reveal style={ri(1)}>
            Precision in <em>every</em> detail.
          </h2>
          <p className={styles.standardBody} data-reveal style={ri(2)}>
            Most of our work ends up behind walls and under floors, where no one will ever check it. We build it
            as if someone will: runs that are plumb and level, valves you can reach, joints made to stay dry.
          </p>
          <Link href="/about" className="text-link" data-reveal style={ri(3)}>
            How we work <span className="text-link__rule" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* Services: a typographic index, not a grid of cards. */}
      <section className="section" aria-labelledby="services-title">
        <div className="container">
          <header className={styles.head}>
            <div>
              <p className="eyebrow" data-reveal>
                Services
              </p>
              <h2 id="services-title" className="display-l" data-reveal style={ri(1)}>
                The systems a building depends on.
              </h2>
            </div>
            <p className="lede" data-reveal style={ri(2)}>
              Heating plants, water heaters, remodels and commercial installations, with emergency service a
              phone call away, day or night.
            </p>
          </header>

          <ol className={styles.index}>
            {planned.map((s, i) => (
              <li key={s.slug} data-reveal style={ri(i % 3)}>
                <Link href={`/services/${s.slug}`} className={styles.row}>
                  <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
                  <span className={styles.name}>{s.name}</span>
                  <span className={styles.summary}>{s.summary}</span>
                  <ArrowUpRight className={styles.arrow} />
                </Link>
              </li>
            ))}
          </ol>

          {emergency ? (
            <aside className={styles.emergency} aria-labelledby="emergency-title" data-reveal>
              <div>
                <p className="caption">06 · Day or night</p>
                <h3 id="emergency-title" className="display-m">
                  {emergency.name}
                </h3>
                <p className={styles.emergencyText}>
                  Burst pipe, no heat, or water where it shouldn&apos;t be? Shut off the main if you can, then
                  call. We are available {company.availability}.
                </p>
              </div>
              <div className={styles.emergencyActions}>
                <TrackedLink href={company.phone.href} event="phone_click" placement="home-emergency" className="btn btn--gold">
                  <PhoneIcon /> {company.phone.display}
                </TrackedLink>
                <Link href={`/services/${emergency.slug}`} className="btn">
                  What to do first
                </Link>
              </div>
            </aside>
          ) : null}

          <p className={styles.all}>
            <Link href="/services" className="text-link">
              See the whole building <span className="text-link__rule" aria-hidden="true" />
            </Link>
          </p>
        </div>
      </section>

      {/* Work: three plates, staggered. */}
      <section className={`section section--paper ${styles.work}`} aria-labelledby="work-title">
        <div className="container">
          <header className={styles.head}>
            <div>
              <p className="eyebrow" data-reveal>
                The work we take on
              </p>
              <h2 id="work-title" className="display-l" data-reveal style={ri(1)}>
                From a single fixture to the whole system.
              </h2>
            </div>
            <p className="lede" data-reveal style={ri(2)}>
              We are documenting completed projects with photographs from the job. Until those are published,
              these illustrative scenes show the scope of work we are hired for.
            </p>
          </header>
          <ul className={styles.plates}>
            {scopes.slice(0, 3).map((s, i) => (
              <li key={s.title} data-reveal="mask" style={ri(i)}>
                <Link href="/work" className={styles.plate}>
                  <span className={styles.plateMedia}>
                    <SiteImage image={s.image} fill decorative sizes="(max-width: 860px) 88vw, 30vw" />
                  </span>
                  <span className="caption">{String(i + 1).padStart(2, "0")} · Scope of work</span>
                  <span className={styles.plateTitle}>{s.title}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className={styles.all}>
            <Link href="/work" className="text-link">
              Walk the gallery <span className="text-link__rule" aria-hidden="true" />
            </Link>
          </p>
        </div>
      </section>

      {/* Why: four statements on a ruled list. */}
      <section className="section" aria-labelledby="why-title">
        <div className={`container ${styles.why}`}>
          <header className={styles.whyHead}>
            <p className="eyebrow" data-reveal>
              Why Plumbers on Call
            </p>
            <h2 id="why-title" className="display-l" data-reveal style={ri(1)}>
              Professional plumbing, held to a standard.
            </h2>
          </header>
          <ol className={styles.whyList}>
            {principles.map((p, i) => (
              <li key={p.title} data-reveal style={ri(i % 2)}>
                <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Company and territory. */}
      <section className={`section section--dark ${styles.bridge}`} aria-label="The company">
        <div className={`container ${styles.bridgeGrid}`}>
          <article data-reveal>
            <p className="eyebrow">The company</p>
            <h2 className="display-m">Owner-led, and accountable for the work.</h2>
            <p>
              {company.name} is led by {company.owner.name}, {company.owner.title}. We serve homeowners,
              property managers and businesses, and we treat a building the way its owner would.
            </p>
            <Link href="/about" className="text-link">
              About the company <span className="text-link__rule" aria-hidden="true" />
            </Link>
          </article>
          <article data-reveal style={ri(1)}>
            <p className="eyebrow">Service area</p>
            <h2 className="display-m">
              {company.region}, and across {company.state}.
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
      </section>

      {/* Verified reviews only; hidden until content/testimonials.ts has entries. */}
      {testimonials.length > 0 ? (
        <section className="section" aria-labelledby="reviews-title">
          <div className="container">
            <p className="eyebrow">In our clients’ words</p>
            <h2 id="reviews-title" className="sr-only">
              Customer reviews
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
