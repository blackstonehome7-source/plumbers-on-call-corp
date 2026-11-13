import Link from "next/link";
import { company } from "@/content/company";
import { Logo } from "@/components/site/Logo";
import { ArrowDown, ArrowUpRight, PhoneIcon } from "@/components/ui/Icon";
import { TrackedLink } from "@/components/ui/TrackedLink";
import styles from "./HomeHero.module.css";

/**
 * "The Name". The logo lives in the 3D world as a lit ivory slab; the box
 * marked data-world-anchor tells the camera exactly where to frame it, so the
 * layout drives the composition at every screen size. The flat plate inside
 * is what shows before the world loads (or if it never does).
 */
export function HomeHero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <h1 id="hero-title" className={styles.title}>
        <span className={styles.anchor} data-world-anchor="sign">
          <Logo className={styles.plate} />
        </span>
        <span className="sr-only"> — residential and commercial plumbing in {company.region}</span>
      </h1>

      <div className={styles.copy}>
        <p className={styles.tagline}>
          Exceptional plumbing. <em>Built on trust.</em>
        </p>
        <p className={styles.line}>
          Residential, commercial &amp; emergency plumbing in {company.region}.
        </p>
        <div className={styles.actions}>
          <TrackedLink href="/contact" event="request_service_click" placement="hero" className="btn btn--gold">
            Request Service <ArrowUpRight />
          </TrackedLink>
          <TrackedLink href={company.phone.href} event="phone_click" placement="hero" className="btn">
            <PhoneIcon /> {company.phone.display}
          </TrackedLink>
        </div>
        <p className={styles.availability}>
          <span className={styles.dot} aria-hidden="true" />
          Available {company.availability} · <Link href="/work">Explore our work</Link>
        </p>
      </div>

      <a href="#standard" className={styles.scroll}>
        <span>Follow the line</span>
        <ArrowDown />
      </a>
    </section>
  );
}
