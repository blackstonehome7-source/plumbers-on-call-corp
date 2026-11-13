import Link from "next/link";
import Image from "next/image";
import type { CSSProperties } from "react";
import { projects } from "@/content/projects";
import { scopes } from "@/content/scopes";
import { SiteImage } from "@/components/ui/SiteImage";
import styles from "./WorkPreview.module.css";

/**
 * Selected work. Shows genuine projects as soon as content/projects.ts has
 * any; until then, presents the kinds of work undertaken — clearly labeled.
 */
export function WorkPreview() {
  const hasProjects = projects.length > 0;

  return (
    <section className={`section section--paper ${styles.work}`} aria-labelledby="work-title">
      <div className="container">
        <header className={styles.head}>
          <p className="eyebrow" data-reveal>
            {hasProjects ? "Selected projects" : "The work we take on"}
          </p>
          <h2 id="work-title" className="display-l" data-reveal style={{ "--reveal-i": 1 } as CSSProperties}>
            From a single fixture to the whole system.
          </h2>
          {!hasProjects && (
            <p className={`lede ${styles.note}`} data-reveal style={{ "--reveal-i": 2 } as CSSProperties}>
              We are documenting completed projects with photographs from the job. Until those stories
              are published, these illustrative scenes show the scope of work we are hired for.
            </p>
          )}
        </header>
      </div>

      <ul className={styles.rail}>
        {hasProjects
          ? projects.slice(0, 6).map((p) => (
              <li key={p.slug}><Link href={`/work/${p.slug}`} className={styles.card}>
                <div className={styles.media}>
                  <Image src={p.photos[0].src} alt={p.photos[0].alt} fill sizes="(max-width: 860px) 82vw, 34vw" style={{ objectFit: "cover" }} />
                </div>
                <p className="caption">{p.location ?? "Massachusetts"}</p>
                <h3 className={styles.cardTitle}>{p.title}</h3>
              </Link></li>
            ))
          : scopes.map((s, i) => (
              <li key={s.title}><Link href={`/services/${s.service}`} className={styles.card}>
                <div className={styles.media}>
                  <SiteImage image={s.image} fill decorative sizes="(max-width: 860px) 82vw, 34vw" />
                </div>
                <p className="caption">
                  {String(i + 1).padStart(2, "0")} · Scope of work
                </p>
                <h3 className={styles.cardTitle}>{s.title}</h3>
                <p className={styles.detail}>{s.detail}</p>
              </Link></li>
            ))}
      </ul>

      <div className={`container ${styles.foot}`}>
        <Link href="/work" className="text-link">
          {hasProjects ? "See all projects" : "How we document our work"}
          <span className="text-link__rule" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
