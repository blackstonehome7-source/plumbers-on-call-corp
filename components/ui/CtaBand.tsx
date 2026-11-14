import Link from "next/link";
import type { ReactNode } from "react";
import { company } from "@/content/company";
import { ArrowUpRight, PhoneIcon } from "@/components/ui/Icon";
import { TrackedLink } from "@/components/ui/TrackedLink";
import styles from "./CtaBand.module.css";

type Props = {
  /** Still accepted so existing callers compile; no longer shown (DESIGN.md rule 6: no kicker above a heading). */
  eyebrow?: string;
  /** Mark one word with <em> to set it in gold italic. */
  title?: ReactNode;
  text?: string;
  placement: string;
};

/** Closing conversion section shared by every page. */
export function CtaBand({
  title = (
    <>
      Let’s build something that <em>lasts.</em>
    </>
  ),
  text = "Tell us about the project or the problem. We’ll explain the options plainly and give you a clear next step.",
  placement,
}: Props) {
  return (
    <section className={styles.cta} aria-labelledby={`cta-${placement}`}>
      <div className={`container ${styles.inner}`}>
        <h2 id={`cta-${placement}`} className={`display-xl ${styles.title}`} data-reveal>
          {title}
        </h2>
        <p className={styles.text} data-reveal>
          {text}
        </p>
        <div className={styles.actions} data-reveal>
          <TrackedLink href="/contact" event="request_service_click" placement={`cta-${placement}`} className="btn btn--gold">
            Request Service <ArrowUpRight />
          </TrackedLink>
          <TrackedLink href={company.phone.href} event="phone_click" placement={`cta-${placement}`} className="btn btn--light">
            <PhoneIcon /> Call {company.phone.display}
          </TrackedLink>
          {company.bookingUrl ? (
            <TrackedLink
              href={company.bookingUrl}
              event="booking_click"
              placement={`cta-${placement}`}
              className="btn btn--light"
              target="_blank"
              rel="noopener"
            >
              Book online
            </TrackedLink>
          ) : null}
        </div>
        <p className={styles.small}>
          Prefer email? <Link href="/contact">Contact the company</Link> or write to{" "}
          <a href={`mailto:${company.email}`}>{company.email}</a>.
        </p>
      </div>
    </section>
  );
}
