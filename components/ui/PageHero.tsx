import Link from "next/link";
import type { ReactNode } from "react";
import type { ImageKey } from "@/content/types";
import { SiteImage } from "./SiteImage";
import { JsonLd } from "./JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";
import styles from "./PageHero.module.css";

type Crumb = { name: string; path: string };

type Props = {
  /** Still accepted so existing callers compile; no longer shown (DESIGN.md rule 6: no kicker above a heading). */
  eyebrow?: string;
  /** Mark one word with <em> to set it in gold italic. */
  title: ReactNode;
  lede?: ReactNode;
  /** Trail after Home; the last item is the current page. Empty: no breadcrumb (the 404 page). */
  crumbs: Crumb[];
  image?: ImageKey;
  /**
   * "split": text beside a tall image. "plain": text only.
   * "reading": the reading template (Service Areas, Privacy, 404). Title, lede and
   * the page body (`children`) share one smoked-glass column over the world.
   */
  variant?: "split" | "plain" | "reading";
  actions?: ReactNode;
  /**
   * The 3D world shows this page's subject behind the hero, so the hero image
   * is only a fallback for when the world is unavailable.
   */
  worldBacked?: boolean;
  /** The page body, set under the title inside the same column. Meant for "reading". */
  children?: ReactNode;
};

export function PageHero({ title, lede, crumbs, image, variant = "split", actions, worldBacked, children }: Props) {
  const trail = [{ name: "Home", path: "/" }, ...crumbs];
  const copy = (
    <div className={styles.copy}>
      {crumbs.length > 0 ? (
        <nav aria-label="Breadcrumb" className={styles.crumbs}>
          <ol>
            {trail.map((c, i) => (
              <li key={c.path}>
                {i < trail.length - 1 ? (
                  <Link href={c.path}>{c.name}</Link>
                ) : (
                  <span aria-current="page">{c.name}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      ) : null}
      <h1 className={`display-l ${styles.title}`}>{title}</h1>
      {lede ? <div className={`lede ${styles.lede}`}>{lede}</div> : null}
      {actions ? <div className={styles.actions}>{actions}</div> : null}
      {children ? <div className={styles.body}>{children}</div> : null}
    </div>
  );

  return (
    <section className={`${styles.hero} ${styles[variant]} ${worldBacked ? styles.worldBacked : ""}`}>
      {crumbs.length > 0 ? <JsonLd data={breadcrumbJsonLd(trail)} /> : null}
      <div className={`container ${styles.layout}`}>
        {variant === "reading" ? <div className={`panel ${styles.column}`}>{copy}</div> : copy}
        {image && variant === "split" ? (
          <div className={styles.media}>
            <SiteImage image={image} fill preload sizes="(max-width: 860px) 100vw, 46vw" />
          </div>
        ) : null}
      </div>
    </section>
  );
}
