import Link from "next/link";
import type { ReactNode } from "react";
import type { ImageKey } from "@/content/types";
import { SiteImage } from "./SiteImage";
import { JsonLd } from "./JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";
import styles from "./PageHero.module.css";

type Crumb = { name: string; path: string };

type Props = {
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  /** Trail after Home; the last item is the current page. */
  crumbs: Crumb[];
  image?: ImageKey;
  /** "split": text beside a tall image. "banner": text over a wide image band below. */
  variant?: "split" | "banner" | "plain";
  actions?: ReactNode;
};

export function PageHero({ eyebrow, title, lede, crumbs, image, variant = "split", actions }: Props) {
  const trail = [{ name: "Home", path: "/" }, ...crumbs];
  return (
    <section className={`${styles.hero} ${styles[variant]}`}>
      <JsonLd data={breadcrumbJsonLd(trail)} />
      <div className={`container ${styles.layout}`}>
        <div className={styles.copy}>
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
          <p className="eyebrow">{eyebrow}</p>
          <h1 className={`display-l ${styles.title}`}>{title}</h1>
          {lede ? <div className={`lede ${styles.lede}`}>{lede}</div> : null}
          {actions ? <div className={styles.actions}>{actions}</div> : null}
        </div>
        {image && variant === "split" ? (
          <div className={styles.media}>
            <SiteImage image={image} fill priority sizes="(max-width: 860px) 100vw, 46vw" />
          </div>
        ) : null}
      </div>
      {image && variant === "banner" ? (
        <div className={styles.band}>
          <SiteImage image={image} fill priority drift sizes="100vw" />
        </div>
      ) : null}
    </section>
  );
}
