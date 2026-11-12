import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { projects } from "@/content/projects";
import { scopes } from "@/content/scopes";
import { getService } from "@/content/services";
import { PageHero } from "@/components/ui/PageHero";
import { CtaBand } from "@/components/ui/CtaBand";
import { SiteImage } from "@/components/ui/SiteImage";
import { pageMetadata } from "@/lib/seo";
import styles from "./page.module.css";

export const metadata = pageMetadata({
  title: "Our Work | Plumbers on Call CORP",
  description:
    "Plumbing, heating and remodel work by Plumbers on Call CORP across Greater Boston — documented project stories and the scope of work we take on.",
  path: "/work",
});

export default function WorkPage() {
  const hasProjects = projects.length > 0;

  return (
    <>
      <PageHero
        variant="plain"
        eyebrow="Our work"
        title="Work that holds up long after we leave."
        lede={
          hasProjects ? (
            <p>Selected projects, documented with photographs from the job.</p>
          ) : (
            <>
              <p>
                We are photographing and writing up completed projects so you can see the work itself — what
                the job required, what we did, and how it finished.
              </p>
              <p>
                Until those stories are published, here is the scope of work we are hired for. The images below
                are illustrative and do not show our completed projects.
              </p>
            </>
          )
        }
        crumbs={[{ name: "Our Work", path: "/work" }]}
      />

      {hasProjects ? (
        <section className="section section--paper" aria-label="Projects">
          <div className="container">
            <ul className={styles.projects}>
              {projects.map((p) => (
                <li key={p.slug}>
                  <Link href={`/work/${p.slug}`} className={styles.project}>
                    <div className={styles.media}>
                      <Image
                        src={p.photos[0].src}
                        alt={p.photos[0].alt}
                        fill
                        sizes="(max-width: 860px) 100vw, 50vw"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                    <p className="caption">
                      {getService(p.category)?.name}
                      {p.location ? ` · ${p.location}` : ""}
                    </p>
                    <h2 className={styles.title}>{p.title}</h2>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : (
        <section className="section section--paper" aria-labelledby="scopes-title">
          <div className="container">
            <h2 id="scopes-title" className="sr-only">
              Scope of work
            </h2>
            <ul className={styles.scopes}>
              {scopes.map((s, i) => (
                <li key={s.title} data-reveal style={{ "--reveal-i": i % 2 } as CSSProperties}>
                  <Link href={`/services/${s.service}`} className={styles.scope}>
                    <div className={styles.media}>
                      <SiteImage image={s.image} fill sizes="(max-width: 860px) 100vw, 50vw" />
                    </div>
                    <p className="caption">{getService(s.service)?.name}</p>
                    <h3 className={styles.title}>{s.title}</h3>
                    <p className={styles.detail}>{s.detail}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <CtaBand
        placement="work"
        eyebrow="Your project"
        title="Planning something substantial?"
        text="A boiler replacement, a new bathroom, a commercial fit-out — tell us about it and we’ll talk through what it involves."
      />
    </>
  );
}
