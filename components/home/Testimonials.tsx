import { testimonials } from "@/content/testimonials";
import styles from "./Testimonials.module.css";

/** Editorial quotes from verified public reviews. Renders nothing until real ones exist. */
export function Testimonials() {
  if (testimonials.length === 0) return null;
  const [lead, ...rest] = testimonials;
  return (
    <section className={`section section--paper ${styles.t}`} aria-labelledby="testimonials-title">
      <div className="container">
        <p className="eyebrow">In our clients’ words</p>
        <h2 id="testimonials-title" className="sr-only">
          Customer reviews
        </h2>
        <figure className={styles.lead} data-reveal>
          <blockquote>
            <p>“{lead.quote}”</p>
          </blockquote>
          <figcaption>
            {lead.name}
            {lead.context ? ` · ${lead.context}` : ""} ·{" "}
            <a href={lead.sourceUrl} rel="noopener" target="_blank">
              {lead.source}
            </a>
          </figcaption>
        </figure>
        {rest.length > 0 && (
          <div className={styles.grid}>
            {rest.slice(0, 3).map((t) => (
              <figure key={t.quote} className={styles.small} data-reveal>
                <blockquote>
                  <p>“{t.quote}”</p>
                </blockquote>
                <figcaption>
                  {t.name} ·{" "}
                  <a href={t.sourceUrl} rel="noopener" target="_blank">
                    {t.source}
                  </a>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
