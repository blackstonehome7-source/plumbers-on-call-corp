import Link from "next/link";
import { company } from "@/content/company";
import { SiteImage } from "@/components/ui/SiteImage";
import { ArrowUpRight } from "@/components/ui/Icon";
import { TrackedLink } from "@/components/ui/TrackedLink";
import styles from "./PocStandard.module.css";

/**
 * "The POC Standard" — the approved second composition: an ivory stone slab
 * cut on a diagonal over a charcoal-framed interior, with a gold edge and a
 * contact rail. Rebuilt in CSS (no layout JS) from the phase1 reference.
 */
export function PocStandard() {
  return (
    <section id="standard" className={styles.standard} aria-labelledby="standard-title">
      <div className={styles.stage}>
        <figure className={styles.photo}>
          <div className={styles.photoInner}>
            <SiteImage image="standardBathroom" fill drift sizes="(max-width: 860px) 100vw, 70vw" hideTag />
          </div>
          <figcaption className={styles.caption}>Illustrative project scene</figcaption>
        </figure>

        <div className={styles.slab}>
          <svg className={styles.edge} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="poc-gold" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#e0c492" />
                <stop offset=".5" stopColor="#8a602d" />
                <stop offset="1" stopColor="#e3c898" />
              </linearGradient>
            </defs>
            <path d="M74 0 100 100" vectorEffect="non-scaling-stroke" />
          </svg>
          <div className={styles.copy}>
            <p className="eyebrow" data-reveal>
              The POC Standard
            </p>
            <h2 id="standard-title" className={`display-l ${styles.heading}`} data-reveal style={{ "--reveal-i": 1 } as React.CSSProperties}>
              Precision in
              <br /> every detail.
            </h2>
            <p className={styles.body} data-reveal style={{ "--reveal-i": 2 } as React.CSSProperties}>
              Good plumbing is mostly invisible: a level trap arm, a valve that is easy to reach, a joint
              that is still dry in twenty years. We plan the parts no one sees with the same attention as
              the finishes everyone will.
            </p>
            <Link href="/work" className="text-link" data-reveal style={{ "--reveal-i": 3 } as React.CSSProperties}>
              Explore our work <span className="text-link__rule" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      <div className={styles.rail}>
        <TrackedLink href="/contact" event="request_service_click" placement="standard" className={styles.request}>
          Request Service <ArrowUpRight />
        </TrackedLink>
        <span className={styles.divider} aria-hidden="true" />
        <TrackedLink href={company.phone.href} event="phone_click" placement="standard" className={styles.phone}>
          <span>Call us · {company.availability}</span>
          <strong>{company.phone.compact}</strong>
        </TrackedLink>
      </div>
    </section>
  );
}
