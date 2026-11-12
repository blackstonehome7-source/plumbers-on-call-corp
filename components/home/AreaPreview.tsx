import Link from "next/link";
import type { CSSProperties } from "react";
import { company } from "@/content/company";
import { SiteImage } from "@/components/ui/SiteImage";
import { PinIcon } from "@/components/ui/Icon";
import styles from "./AreaPreview.module.css";

export function AreaPreview() {
  return (
    <section className={styles.area} aria-labelledby="area-title">
      <div className={styles.media}>
        <SiteImage image="newEnglandHome" fill drift sizes="100vw" />
        <div className={styles.scrim} aria-hidden="true" />
      </div>
      <div className={`container ${styles.inner}`}>
        <div className={styles.panel} data-reveal>
          <p className="eyebrow">Service area</p>
          <h2 id="area-title" className="display-m">
            Based in {company.region}. Working across {company.state}.
          </h2>
          <p className={styles.text}>
            From Boston&apos;s older homes and brownstones to newer construction and commercial
            properties, we work throughout {company.region} and take on projects across{" "}
            {company.state}. Not sure if you&apos;re in range? Call and ask — we&apos;ll tell you
            straight away.
          </p>
          <div className={styles.row} style={{ "--reveal-i": 1 } as CSSProperties}>
            <span className={styles.pin}>
              <PinIcon /> {company.region} &amp; {company.state}
            </span>
            <Link href="/service-areas" className="text-link">
              Service areas <span className="text-link__rule" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
