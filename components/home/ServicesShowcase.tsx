import Link from "next/link";
import type { CSSProperties } from "react";
import { company } from "@/content/company";
import { getService } from "@/content/services";
import type { Service, ServiceSlug } from "@/content/types";
import { SiteImage } from "@/components/ui/SiteImage";
import { ArrowUpRight, PhoneIcon } from "@/components/ui/Icon";
import { TrackedLink } from "@/components/ui/TrackedLink";
import styles from "./ServicesShowcase.module.css";

const svc = (slug: ServiceSlug): Service => {
  const s = getService(slug);
  if (!s) throw new Error(`Unknown service ${slug}`);
  return s;
};

function Feature({
  service,
  index,
  className,
  sizes,
}: {
  service: Service;
  index: string;
  className: string;
  sizes: string;
}) {
  return (
    <Link href={`/services/${service.slug}`} className={`${styles.feature} ${className}`} data-reveal>
      <div className={styles.media}>
        <SiteImage image={service.image} fill decorative sizes={sizes} />
      </div>
      <div className={styles.featureText}>
        <span className={styles.index}>{index}</span>
        <h3 className={styles.featureTitle}>{service.name}</h3>
        <p className={styles.summary}>{service.summary}</p>
        <span className={styles.more}>
          Explore <ArrowUpRight />
        </span>
      </div>
    </Link>
  );
}

export function ServicesShowcase() {
  const boiler = svc("boilers-heating");
  const water = svc("water-heaters");
  const bath = svc("bathroom-plumbing");
  const residential = svc("residential-plumbing");
  const commercial = svc("commercial-plumbing");
  const emergency = svc("emergency-plumbing");

  return (
    <section className={`section ${styles.showcase}`} aria-labelledby="services-title">
      <div className="container">
        <header className={styles.head}>
          <div>
            <p className="eyebrow" data-reveal>
              Signature services
            </p>
            <h2 id="services-title" className="display-l" data-reveal style={{ "--reveal-i": 1 } as CSSProperties}>
              The systems a building depends on, installed properly.
            </h2>
          </div>
          <div className={styles.headAside} data-reveal style={{ "--reveal-i": 2 } as CSSProperties}>
            <p className="lede">
              Our focus is the substantial work — heating plants, water heaters, remodels and commercial
              installations — with emergency service a phone call away, day or night.
            </p>
            <Link href="/services" className="text-link">
              All services <span className="text-link__rule" aria-hidden="true" />
            </Link>
          </div>
        </header>

        <div className={styles.grid}>
          <Feature service={boiler} index="01" className={styles.a} sizes="(max-width: 860px) 100vw, 56vw" />
          <Feature service={water} index="02" className={styles.b} sizes="(max-width: 860px) 100vw, 38vw" />

          <Link href={`/services/${bath.slug}`} className={styles.band} data-reveal="mask">
            <div className={styles.bandMedia}>
              <SiteImage image={bath.image} fill drift decorative sizes="100vw" />
            </div>
            <div className={styles.bandPanel}>
              <span className={styles.index}>03</span>
              <h3 className={styles.featureTitle}>{bath.name}</h3>
              <p className={styles.summary}>{bath.summary}</p>
              <span className={styles.more}>
                Explore <ArrowUpRight />
              </span>
            </div>
          </Link>

          <Feature service={residential} index="04" className={styles.c} sizes="(max-width: 860px) 100vw, 44vw" />
          <Feature service={commercial} index="05" className={styles.d} sizes="(max-width: 860px) 100vw, 44vw" />
        </div>

        <aside className={styles.emergency} aria-labelledby="emergency-strip-title" data-reveal>
          <div>
            <span className={styles.index}>06</span>
            <h3 id="emergency-strip-title" className={styles.emergencyTitle}>
              {emergency.name}
            </h3>
            <p className={styles.emergencyText}>
              Burst pipe, no heat, or water where it shouldn&apos;t be? Shut off the main if you can,
              then call. We answer {company.availability}.
            </p>
          </div>
          <div className={styles.emergencyActions}>
            <TrackedLink href={company.phone.href} event="phone_click" placement="services-emergency" className="btn btn--gold">
              <PhoneIcon /> {company.phone.display}
            </TrackedLink>
            <Link href={`/services/${emergency.slug}`} className="btn btn--light">
              What to do first
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}
