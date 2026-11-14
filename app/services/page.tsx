import Link from "next/link";
import { company } from "@/content/company";
import { getService } from "@/content/services";
import { CtaBand } from "@/components/ui/CtaBand";
import { ArrowDown, ArrowUpRight, PhoneIcon } from "@/components/ui/Icon";
import { JsonLd } from "@/components/ui/JsonLd";
import { SiteImage } from "@/components/ui/SiteImage";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { SECTION_ROOMS, roomTextSide } from "@/world/layout";
import { FloorRail } from "@/components/services/FloorRail";
import styles from "./page.module.css";

export const metadata = pageMetadata({
  title: "Plumbing Services in Greater Boston | Plumbers on Call CORP",
  description:
    "Boilers and heating, water heaters, bathroom remodel plumbing, residential and commercial plumbing, and 24/7 emergency service. Call (781) 299-5011.",
  path: "/services",
});

/* Where each service lives in the building, top to bottom. */
const levels = ["Top floor", "Living floor", "Street level", "Mechanical room", "Mechanical room", "At the main"];

export default function ServicesPage() {
  // The page follows the building from the roof down, so the order is physical.
  const rooms = SECTION_ROOMS.map((slug) => getService(slug)).filter((s) => s !== undefined);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
        ])}
      />

      <section className={styles.intro} aria-labelledby="services-title">
        <div className={`container ${styles.col}`}>
          <div className={`panel ${styles.opening}`}>
            <h1 id="services-title" className={styles.title}>
              One line runs through <em>every</em> building.
            </h1>
            <p className={styles.lede}>
              Follow it down. From the finished bathroom on the top floor to the boiler room and the main
              shut-off, this is the work we do at each level, for homes and for businesses across{" "}
              {company.region}.
            </p>
            <a href="#level-1" className={styles.descend}>
              <ArrowDown /> <span>Descend</span>
            </a>
          </div>
        </div>
      </section>

      <ol className={styles.levels}>
        {rooms.map((s, i) => {
          const emergency = s.slug === "emergency-plumbing";
          return (
            <li key={s.slug} id={`level-${i + 1}`} className={styles.level} data-world-step={i} data-side={roomTextSide(i)}>
              <div className={`container ${styles.col}`}>
                <article className={`panel ${styles.card}`} aria-labelledby={`svc-${s.slug}`}>
                  <p className={styles.where}>
                    <span>{String(i + 1).padStart(2, "0")}</span> {levels[i]}
                  </p>
                  <h2 id={`svc-${s.slug}`} className={styles.name}>
                    {s.name}
                  </h2>
                  <p className={styles.summary}>{s.summary}</p>
                  <ul className={styles.types}>
                    {s.projectTypes.slice(0, 3).map((t) => (
                      <li key={t.title}>{t.title}</li>
                    ))}
                  </ul>
                  <div className={styles.actions}>
                    <Link href={`/services/${s.slug}`} className="btn">
                      {emergency ? "What to do first" : "Explore the service"} <ArrowUpRight />
                    </Link>
                    {emergency ? (
                      <TrackedLink href={company.phone.href} event="phone_click" placement="services-emergency" className="btn btn--gold">
                        <PhoneIcon /> {company.phone.display}
                      </TrackedLink>
                    ) : null}
                  </div>
                  {/* Shown only when the 3D building is unavailable. */}
                  <div className={styles.fallback}>
                    <SiteImage image={s.image} fill decorative sizes="(max-width: 860px) 92vw, 40vw" />
                  </div>
                </article>
              </div>
            </li>
          );
        })}
      </ol>

      <FloorRail floors={rooms.map((s, i) => ({ id: `level-${i + 1}`, label: s.name }))} />

      <CtaBand placement="services" />
    </>
  );
}
