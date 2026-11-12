import Link from "next/link";
import type { CSSProperties } from "react";
import { company } from "@/content/company";
import { SiteImage } from "@/components/ui/SiteImage";
import styles from "./AboutBridge.module.css";

export function AboutBridge() {
  return (
    <section className={`section ${styles.about}`} aria-labelledby="about-title">
      <div className={`container ${styles.layout}`}>
        <div className={styles.media} data-reveal="mask">
          <SiteImage image="brandWall" fill drift sizes="(max-width: 860px) 100vw, 55vw" />
        </div>
        <div className={styles.copy}>
          <p className="eyebrow" data-reveal>
            The company
          </p>
          <h2 id="about-title" className="display-l" data-reveal style={{ "--reveal-i": 1 } as CSSProperties}>
            An owner-led company. A name on every job.
          </h2>
          <div className="prose" data-reveal style={{ "--reveal-i": 2 } as CSSProperties}>
            <p>
              {company.name} is led by {company.owner.name}, its {company.owner.title.toLowerCase()}.
              When you call, you are dealing with the people responsible for the work — not a
              referral network or a call center.
            </p>
            <p>
              We serve homeowners, property managers and businesses across {company.region}, and we
              treat a building the way its owner would: carefully, and with the next twenty years in mind.
            </p>
          </div>
          <Link href="/about" className="text-link" data-reveal style={{ "--reveal-i": 3 } as CSSProperties}>
            About the company <span className="text-link__rule" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
