import Image from "next/image";
import Link from "next/link";
import { projects } from "@/content/projects";
import { scopes } from "@/content/scopes";
import { getService } from "@/content/services";
import { CtaBand } from "@/components/ui/CtaBand";
import { ArrowUpRight } from "@/components/ui/Icon";
import { JsonLd } from "@/components/ui/JsonLd";
import { SiteImage } from "@/components/ui/SiteImage";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import styles from "./page.module.css";

export const metadata = pageMetadata({
  title: "Our Work | Plumbers on Call CORP",
  description:
    "The plumbing, heating and remodel work Plumbers on Call CORP takes on across Greater Boston, shown as a gallery that fills with project photographs as jobs are documented.",
  path: "/work",
});

export default function WorkPage() {
  const hasProjects = projects.length > 0;
  const total = hasProjects ? Math.min(projects.length, 6) : scopes.length;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Our Work", path: "/work" },
        ])}
      />

      <section className={styles.intro} aria-labelledby="work-title">
        <div className={`container ${styles.col}`}>
          <h1 id="work-title" className={styles.title}>
            Work worth putting <em>on the wall.</em>
          </h1>
          {hasProjects ? (
            <p className={styles.lede}>Selected projects, documented with photographs from the job.</p>
          ) : (
            <p className={styles.lede}>
              The kinds of work we are hired for. Each plate is an illustrative scene, not a completed
              project; photographs from our own jobs will take their place.
            </p>
          )}
        </div>
      </section>

      <ol className={styles.plates}>
        {hasProjects
          ? projects.slice(0, 6).map((p, i) => (
              <li key={p.slug} className={styles.plate} data-world-step={i}>
                <div className={`container ${styles.col}`}>
                  <article className={styles.card}>
                    <p className={styles.count}>
                      {String(i + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
                    </p>
                    <p className="caption">
                      {getService(p.category)?.name}
                      {p.location ? ` · ${p.location}` : ""}
                    </p>
                    <h2 className={styles.name}>{p.title}</h2>
                    <p className={styles.detail}>{p.challenge}</p>
                    <Link href={`/work/${p.slug}`} className="btn">
                      Read the project <ArrowUpRight />
                    </Link>
                    <div className={styles.fallback}>
                      <Image src={p.photos[0].src} alt={p.photos[0].alt} fill sizes="(max-width: 860px) 92vw, 44vw" style={{ objectFit: "cover" }} />
                    </div>
                  </article>
                </div>
              </li>
            ))
          : scopes.map((s, i) => (
              <li key={s.title} className={styles.plate} data-world-step={i}>
                <div className={`container ${styles.col}`}>
                  <article className={styles.card}>
                    <p className={styles.count}>
                      {String(i + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
                    </p>
                    <p className="caption">Scope of work · Illustrative image</p>
                    <h2 className={styles.name}>{s.title}</h2>
                    <p className={styles.detail}>{s.detail}</p>
                    <Link href={`/services/${s.service}`} className="btn">
                      {getService(s.service)?.name} <ArrowUpRight />
                    </Link>
                    <div className={styles.fallback}>
                      <SiteImage image={s.image} fill sizes="(max-width: 860px) 92vw, 44vw" />
                    </div>
                  </article>
                </div>
              </li>
            ))}
      </ol>

      <CtaBand
        placement="work"
        eyebrow="Your project"
        title="Planning something substantial?"
        text="A boiler replacement, a new bathroom, a commercial fit-out. Tell us about it and we’ll talk through what it involves."
      />
    </>
  );
}
