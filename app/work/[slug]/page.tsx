import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, projects } from "@/content/projects";
import { getService } from "@/content/services";
import { PageHero } from "@/components/ui/PageHero";
import { CtaBand } from "@/components/ui/CtaBand";
import { pageMetadata } from "@/lib/seo";
import styles from "./page.module.css";

type Params = { slug: string };

// Only real, documented projects get a page.
export const dynamicParams = false;

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
  const project = getProject(slug);
  if (!project) notFound();
  const service = getService(project.category);
  const [cover, ...gallery] = project.photos;

  return (
    <>
      <PageHero
        variant="plain"
        eyebrow={[service?.name, project.location, project.year].filter(Boolean).join(" · ")}
        title={project.title}
        crumbs={[
          { name: "Our Work", path: "/work" },
          { name: project.title, path: `/work/${project.slug}` },
        ]}
      />

      {cover && (
        <div className={styles.cover}>
          <Image src={cover.src} alt={cover.alt} fill priority sizes="100vw" style={{ objectFit: "cover" }} />
        </div>
      )}

      <section className="section">
        <div className={`container ${styles.story}`}>
          <div>
            <h2 className="eyebrow">The requirement</h2>
            <p className={styles.lead}>{project.challenge}</p>
          </div>
          <div>
            <h2 className="eyebrow">Work performed</h2>
            <ul className={styles.work}>
              {project.work.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
            {project.outcome && (
              <>
                <h2 className="eyebrow" style={{ marginTop: "2.5rem" }}>
                  Outcome
                </h2>
                <p className="prose">{project.outcome}</p>
              </>
            )}
            {service && (
              <p className={styles.related}>
                Related service: <Link href={`/services/${service.slug}`}>{service.name}</Link>
              </p>
            )}
          </div>
        </div>
      </section>

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
