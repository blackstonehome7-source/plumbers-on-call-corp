import Link from "next/link";
import type { CSSProperties } from "react";
import { services } from "@/content/services";
import { company } from "@/content/company";
import { PageHero } from "@/components/ui/PageHero";
import { CtaBand } from "@/components/ui/CtaBand";
import { SiteImage } from "@/components/ui/SiteImage";
import { ArrowUpRight } from "@/components/ui/Icon";
import { pageMetadata } from "@/lib/seo";
import styles from "./page.module.css";

export const metadata = pageMetadata({
  title: "Plumbing Services in Greater Boston | Plumbers on Call CORP",
  description:
    "Boilers and heating, water heaters, bathroom remodel plumbing, residential and commercial plumbing, and 24/7 emergency service. Call (781) 299-5011.",
  path: "/services",
});

export default function ServicesPage() {
  return (
    <>
      <PageHero
        variant="banner"
        eyebrow="Services"
        title="Plumbing and heating, from the boiler room to the finished bath."
        lede={
          <p>
            We concentrate on the work that matters most to a building — heating plants, water heaters,
            remodels and commercial installations — and we answer {company.availability} when something
            can&apos;t wait.
          </p>
        }
        crumbs={[{ name: "Services", path: "/services" }]}
        image="mechanicalRoom"
      />

      <section className="section" aria-label="All services">
        <div className="container">
          <ol className={styles.index}>
            {services.map((s, i) => (
              <li key={s.slug} className={styles.row} data-reveal style={{ "--reveal-i": 0 } as CSSProperties}>
                <Link href={`/services/${s.slug}`} className={styles.link}>
                  <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
                  <div className={styles.text}>
                    <h2 className={styles.name}>{s.name}</h2>
                    <p className={styles.summary}>{s.summary}</p>
                    <span className={styles.more}>
                      {s.slug === "emergency-plumbing" ? "What to do first" : "Explore the service"} <ArrowUpRight />
                    </span>
                  </div>
                  <div className={styles.media}>
                    <SiteImage image={s.image} fill decorative sizes="(max-width: 860px) 100vw, 34vw" />
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <CtaBand placement="services" />
    </>
  );
}
