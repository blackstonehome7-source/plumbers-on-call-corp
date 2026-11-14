import Link from "next/link";
import type { ReactNode } from "react";
import { company } from "@/content/company";
import { CtaBand } from "@/components/ui/CtaBand";
import { JsonLd } from "@/components/ui/JsonLd";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import styles from "./page.module.css";

export const metadata = pageMetadata({
  title: "About | Plumbers on Call CORP",
  description:
    "Plumbers on Call CORP is an owner-led residential and commercial plumbing company serving Greater Boston and Massachusetts, available 24/7.",
  path: "/about",
});

/*
 * Level and True: one instrument, one value, one full scene each, in the order
 * the camera meets them on the wall (world/scenes/plumb.ts). Plumb is the
 * opening scene and carries the page's headline.
 */
const scenes: { id: string; word: string; claim: ReactNode; body: string }[] = [
  {
    id: "level",
    word: "Level.",
    claim: (
      <>
        Respect the building and the <em>people</em> in it.
      </>
    ),
    body: "Homes are lived in and businesses have to keep operating. We protect finished surfaces, keep the work area orderly and plan around the people affected.",
  },
  {
    id: "true",
    word: "True.",
    claim: (
      <>
        Build it to be <em>lived</em> with.
      </>
    ),
    body: "Most of the work disappears behind walls and under floors. We give the parts that will be covered up the same attention as the parts on display: valves where they can be reached, piping that is supported, equipment that can be serviced.",
  },
];

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ])}
      />

      {/* Plumb: the bob hangs right of centre; the words keep the left of the frame. */}
      <section className={styles.scene} aria-labelledby="about-title">
        <div className={`container ${styles.col}`}>
          <h1 id="about-title" className={styles.title}>
            Plumb. <br />
            Level. <br />
            <em>True.</em>
          </h1>
          <div className={`panel ${styles.card} ${styles.opening}`}>
            <p className={styles.lede}>
              The word <i>plumber</i> comes from <i lang="la">plumbum</i>, the lead weight on a plumb line: the
              oldest tool for proving that something is truly vertical.
            </p>
            <p className={styles.text}>
              We talk about your job the same way: straight. What is wrong, what the choices are, and what we
              would do in your position.
            </p>
          </div>
        </div>
      </section>

      {scenes.map((s) => (
        <section key={s.id} className={styles.scene} aria-labelledby={`${s.id}-title`}>
          <div className={`container ${styles.col}`}>
            <div className={`panel ${styles.card}`} data-reveal>
              <h2 id={`${s.id}-title`} className={styles.heading}>
                <span className={styles.word}>{s.word}</span> <span className={styles.claim}>{s.claim}</span>
              </h2>
              <p className={styles.text}>{s.body}</p>
            </div>
          </div>
        </section>
      ))}

      {/* Leadership: the owner's name on the logo's own stone. No portrait. */}
      <section className={`${styles.scene} ${styles.leader}`} aria-labelledby="leader-title">
        <div className={`container ${styles.col}`}>
          <div className={styles.plate} data-reveal>
            <h2 id="leader-title" className={styles.plateName}>
              {company.owner.name}
            </h2>
            <p className={styles.plateRole}>{company.owner.title}</p>
          </div>
          <div className={`panel ${styles.card} ${styles.answer}`} data-reveal>
            <p className={styles.text}>
              {company.shortName} is owner-led, and the owner is accountable for the work. You can reach the
              company directly, any time.
            </p>
            <ul className={styles.reach}>
              <li>
                <TrackedLink href={company.phone.href} event="phone_click" placement="about-leadership">
                  {company.phone.display}
                </TrackedLink>
              </li>
              <li>
                <a href={`mailto:${company.email}`}>{company.email}</a>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className={styles.area} aria-labelledby="area-title">
        <div className={`container ${styles.col}`}>
          <div className={`panel ${styles.card}`} data-reveal>
            <h2 id="area-title" className={styles.areaTitle}>
              {company.region}, at <em>any</em> hour.
            </h2>
            <p className={styles.text}>
              We work in homes and businesses across {company.region} and {company.state}. Plumbing problems do
              not keep office hours, so we are available {company.availability}.
            </p>
            <Link href="/service-areas" className={`text-link ${styles.areaLink}`}>
              See the service area <span className="text-link__rule" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <CtaBand placement="about" />
    </>
  );
}
