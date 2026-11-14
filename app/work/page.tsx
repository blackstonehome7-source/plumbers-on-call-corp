import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { company } from "@/content/company";
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

/** The wall hangs the first six projects: the same six the 3D world loads (components/world/WorldCanvas.tsx). */
const WALL_PLATES = 6;
/** Sized for the no-3D picture: about 60% of a desktop viewport, the full column on a phone. */
const PICTURE_SIZES = "(max-width: 860px) 92vw, 60vw";

/** One plate on the wall: a documented project once there are any, a scope of work until then. */
type Plate = {
  key: string;
  title: string;
  /** What the picture is, set under the title the way a gallery label names the medium. */
  label: string;
  detail: string;
  href: string;
  action: string;
  /** The HTML picture, shown only when the 3D gallery is unavailable. */
  picture: ReactNode;
};

const two = (n: number) => String(n).padStart(2, "0");

export default function WorkPage() {
  const hasProjects = projects.length > 0;

  const plates: Plate[] = hasProjects
    ? projects.slice(0, WALL_PLATES).map((p) => ({
        key: p.slug,
        title: p.title,
        label: [getService(p.category)?.name, p.location].filter(Boolean).join(" · "),
        detail: p.challenge,
        href: `/work/${p.slug}`,
        action: "Read the project",
        picture: <Image src={p.photos[0].src} alt={p.photos[0].alt} fill sizes={PICTURE_SIZES} style={{ objectFit: "cover" }} />,
      }))
    : scopes.map((s) => ({
        key: s.title,
        title: s.title,
        label: "Scope of work · Illustrative",
        detail: s.detail,
        href: `/services/${s.service}`,
        action: getService(s.service)?.name ?? "The service",
        picture: <SiteImage image={s.image} fill sizes={PICTURE_SIZES} />,
      }));

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
            Work worth putting on the <em>wall.</em>
          </h1>
          <p className={styles.lede}>
            {hasProjects
              ? "Selected projects, documented with photographs from the job."
              : `Each plate is a scope of work we take on across ${company.region}, shown with an illustrative image.`}
          </p>
        </div>
      </section>

      <ol className={styles.plates}>
        {plates.map((plate, i) => (
          <li key={plate.key} className={styles.scene} data-world-step={i}>
            <article className={`container ${styles.piece}`} aria-labelledby={`plate-${i + 1}`}>
              {/* Shown only when the 3D gallery is unavailable: the photograph on its ivory mat. */}
              <div className={styles.picture}>
                <div className={styles.frame}>{plate.picture}</div>
              </div>
              <div className={`panel ${styles.card}`}>
                <p className={styles.count}>
                  <span aria-hidden="true">
                    {two(i + 1)} / {two(plates.length)}
                  </span>
                  <span className="sr-only">
                    Plate {i + 1} of {plates.length}
                  </span>
                </p>
                <h2 id={`plate-${i + 1}`} className={styles.name}>
                  {plate.title}
                </h2>
                {plate.label ? <p className={styles.label}>{plate.label}</p> : null}
                <p className={styles.detail}>{plate.detail}</p>
                <Link href={plate.href} className={`btn ${styles.action}`}>
                  {plate.action} <ArrowUpRight />
                </Link>
              </div>
            </article>
          </li>
        ))}
      </ol>

      <CtaBand
        placement="work"
        title="Planning something substantial?"
        text="A boiler replacement, a new bathroom, a commercial fit-out. Tell us about it and we’ll talk through what it involves."
      />
    </>
  );
}
