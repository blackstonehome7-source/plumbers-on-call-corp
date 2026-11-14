import Link from "next/link";
import type { CSSProperties } from "react";
import { company } from "@/content/company";
import { CtaBand } from "@/components/ui/CtaBand";
import { JsonLd } from "@/components/ui/JsonLd";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import styles from "./page.module.css";

export const metadata = pageMetadata({
  title: "About | Plumbers on Call CORP",
  description:
    "Plumbers on Call CORP is an owner-led residential and commercial plumbing company serving Greater Boston and Massachusetts, available 24/7.",
  path: "/about",
});

/* The three checks of the trade, each tied to how the company works. */
const checks = [
  {
    word: "Plumb",
    meaning: "Straight up and down.",
    title: "Say what the job needs",
    body: "Not the most expensive option and not the quickest patch. A clear explanation of what is wrong, what the choices are, and what we would do in your position.",
  },
  {
    word: "Level",
    meaning: "Even, side to side.",
    title: "Respect the building and the people in it",
    body: "Homes are lived in and businesses have to keep operating. We protect finished surfaces, keep the work area orderly and plan around the people affected.",
  },
  {
    word: "True",
    meaning: "Exactly as intended.",
    title: "Build it to be lived with",
    body: "Valves where they can be reached, piping that is supported, equipment that can be serviced. Workmanship is judged years later, by whoever opens the wall next.",
  },
];

const ri = (i: number) => ({ "--reveal-i": i }) as CSSProperties;

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ])}
      />

      {/* The Plumb: the bob hangs in the left of the frame; the words stand to its right. */}
      <section className={styles.hero} aria-labelledby="about-title">
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroCopy}>
            <h1 id="about-title" className={styles.title}>
              Plumb. <br />
              Level. <br />
              <em>True.</em>
            </h1>
            <p className={styles.lede}>
              The word <i>plumber</i> comes from <i lang="la">plumbum</i>, the lead weight on a plumb line: the
              oldest tool there is for proving that something is truly vertical. The trade has always been
              about getting it exactly right where it matters, whether or not anyone is looking.
            </p>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="story-title">
        <div className={`container ${styles.story}`}>
          <div>
            <p className="eyebrow" data-reveal>
              Our approach
            </p>
            <h2 id="story-title" className="display-m" data-reveal style={ri(1)}>
              Most of the work disappears. That is why it has to be right.
            </h2>
          </div>
          <div className={styles.storyText}>
            <p data-reveal>
              Plumbing is one of the few trades where most of the work vanishes behind walls and under floors
              once it is finished. The difference between a system that serves a building for decades and one
              that causes problems is usually decided by details nobody sees on the day.
            </p>
            <p data-reveal style={ri(1)}>
              {company.name} takes on the substantial work of a building: heating systems, water heaters,
              remodels and commercial installations. We give the parts that will be covered up the same
              attention as the parts that will be on display. And because plumbing problems do not keep
              office hours, we are available {company.availability}.
            </p>
          </div>
        </div>
      </section>

      <section className={`section section--paper ${styles.checksSection}`} aria-labelledby="checks-title">
        <div className="container">
          <h2 id="checks-title" className="sr-only">
            How we work
          </h2>
          <ol className={styles.checks}>
            {checks.map((c, i) => (
              <li key={c.word} data-reveal style={ri(i)}>
                <p className={styles.word}>{c.word}</p>
                <p className={styles.meaning}>{c.meaning}</p>
                <h3>{c.title}</h3>
                <p className={styles.body}>{c.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section--dark" aria-labelledby="leader-title">
        <div className={`container ${styles.leader}`}>
          <div data-reveal>
            <p className="eyebrow">Leadership</p>
            <h2 id="leader-title" className="display-l">
              {company.owner.name}
            </h2>
            <p className={styles.role}>{company.owner.title}</p>
          </div>
          <div className={styles.leaderText} data-reveal style={ri(1)}>
            <p>
              {company.shortName} is owner-led, and the owner is accountable for the work. You can reach the
              company directly, any time.
            </p>
            <ul className={styles.reach}>
              <li>
                <a href={company.phone.href}>{company.phone.display}</a>
              </li>
              <li>
                <a href={`mailto:${company.email}`}>{company.email}</a>
              </li>
            </ul>
            <Link href="/service-areas" className="text-link">
              Serving {company.region} and {company.state} <span className="text-link__rule" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <CtaBand placement="about" />
    </>
  );
}
