import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, projects } from "@/content/projects";
import { getService } from "@/content/services";
import { CtaBand } from "@/components/ui/CtaBand";
import { ArrowUpRight } from "@/components/ui/Icon";
import { JsonLd } from "@/components/ui/JsonLd";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import styles from "./page.module.css";

type Params = { slug: string };

// Only real, documented projects get a page.
export const dynamicParams = false;

/** The wall hangs the first six projects: the same six the 3D world loads (components/world/WorldCanvas.tsx). */
const WALL_PLATES = 6;

export function generateStaticParams(): Params[] {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) return {};
  return pageMetadata({
    title: `${p.title} | Our Work | Plumbers on Call CORP`,
    description: p.challenge.slice(0, 155),
    path: `/work/${p.slug}`,
    image: p.photos[0]?.src,
  });
}

export default async function ProjectPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const index = projects.findIndex((p) => p.slug === slug);
  if (index < 0) notFound();
  const project = projects[index];
  const service = getService(project.category);
  const [cover, ...gallery] = project.photos;
  // A project on the wall has its own plate in the 3D world; the camera faces it while the page is read.
  const onWall = index < WALL_PLATES;
  const facts = [service?.name, project.location, project.year].filter(Boolean).join(" · ");

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Our Work", path: "/work" },
          { name: project.title, path: `/work/${project.slug}` },
        ])}
      />

      <article className={`${styles.project} ${onWall ? styles.faced : ""}`} aria-labelledby="project-title">
        {/* Pinned to the top of the page so the world keeps this project's plate in focus at every scroll position. */}
        {onWall ? <span className={styles.mark} data-world-step={index} aria-hidden="true" /> : null}
        <div className={`container ${styles.piece}`}>
          {cover ? (
            // The plate is the cover; this picture stands in when the 3D gallery, or a plate for this project, is missing.
            <div className={`${styles.picture} ${onWall ? styles.onWall : ""}`}>
              <div className={styles.frame}>
                <Image src={cover.src} alt={cover.alt} fill sizes="(orientation: portrait) 92vw, 60vw" style={{ objectFit: "cover" }} />
              </div>
            </div>
          ) : null}

          <div className={`panel ${styles.column}`}>
            <h1 id="project-title" className={styles.title}>
              {project.title}
            </h1>
            {facts ? <p className={styles.facts}>{facts}</p> : null}
            <p className={styles.lead}>{project.challenge}</p>

            <h2 className={styles.heading}>Work performed</h2>
            <ul className={styles.work}>
              {project.work.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>

            {project.outcome ? (
              <>
                <h2 className={styles.heading}>Outcome</h2>
                <p className={styles.body}>{project.outcome}</p>
              </>
            ) : null}

            <div className={styles.actions}>
              {service ? (
                <Link href={`/services/${service.slug}`} className={`btn ${styles.action}`}>
                  {service.name} <ArrowUpRight />
                </Link>
              ) : null}
              <Link href="/work" className="text-link">
                All work <span className="text-link__rule" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </article>

      {gallery.length > 0 && (
        <section className="section section--paper" aria-label="Project photographs">
          <div className={`container ${styles.gallery}`}>
            {gallery.map((ph) => (
              <figure key={ph.src} className={styles.photo}>
                <Image src={ph.src} alt={ph.alt} width={ph.width} height={ph.height} sizes="(max-width: 860px) 100vw, 50vw" />
              </figure>
            ))}
          </div>
        </section>
      )}

      <CtaBand placement={`project-${project.slug}`} title="Have a similar project?" />
    </>
  );
}
