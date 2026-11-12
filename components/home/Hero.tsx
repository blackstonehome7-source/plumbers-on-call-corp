import Image from "next/image";
import Link from "next/link";
import { company } from "@/content/company";
import { Wordmark } from "@/components/site/Wordmark";
import { ArrowDown, ArrowUpRight } from "@/components/ui/Icon";
import { TrackedLink } from "@/components/ui/TrackedLink";
import styles from "./Hero.module.css";

/**
 * Approved v6 hero: the owner-approved stone plate and wordmark crop as
 * decorative layers; every word and control is native HTML.
 */
export function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.stone} aria-hidden="true">
        <Image
          src="/brand/hero-stone.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          quality={80}
          className={styles.stoneImg}
        />
        <span className={styles.light} />
      </div>

      <div className={styles.content}>
        <h1 id="hero-title" className={styles.title}>
          <Wordmark surface="native" priority className={styles.wordmark} />
        </h1>
        <p className={styles.tagline}>
          Exceptional plumbing. <span className={styles.taglineEnd}>Built on trust.</span>
        </p>
        <p className={styles.serviceLine}>
          Residential, commercial &amp; emergency plumbing in {company.region}.
        </p>
        <div className={styles.actions}>
          <TrackedLink
            href="/contact"
            event="request_service_click"
            placement="hero"
            className={`btn btn--gold ${styles.primary}`}
          >
            Request Service <ArrowUpRight />
          </TrackedLink>
          <Link href="/work" className={`btn ${styles.secondary}`}>
            Explore Our Work
          </Link>
        </div>
        <p className={styles.availability}>
          <span className={styles.dot} aria-hidden="true" />
          Available {company.availability} —{" "}
          <TrackedLink href={company.phone.href} event="phone_click" placement="hero">
            {company.phone.display}
          </TrackedLink>
        </p>
      </div>

      <a href="#standard" className={styles.scroll}>
        <span>Scroll to explore</span>
        <ArrowDown />
      </a>
    </section>
  );
}
