"use client";

import { useRef } from "react";
import { company } from "@/content/company";
import { ArrowUpRight } from "@/components/ui/Icon";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { signalWorld } from "@/components/world/WorldCanvas";
import styles from "./ContactActions.module.css";

/**
 * The four ways to reach the company, as large plain links. Pointing at or
 * focusing one opens the valve in the 3D world behind (a decorative echo;
 * the links work identically without it). The list as a whole holds the valve:
 * it stays open, without a flicker, while the pointer or the keyboard moves from
 * one link to the next, and closes only when both have left.
 */
export function ContactActions({ formAvailable }: { formAvailable: boolean }) {
  const held = useRef({ pointer: false, focus: false });
  const hold = (patch: Partial<{ pointer: boolean; focus: boolean }>) => {
    Object.assign(held.current, patch);
    signalWorld({ name: "valve", value: held.current.pointer || held.current.focus ? 1 : 0 });
  };

  return (
    <ul
      className={styles.actions}
      onPointerEnter={() => hold({ pointer: true })}
      onPointerLeave={() => hold({ pointer: false })}
      // Keyboard focus only: a link that was clicked keeps focus, and should not pin the valve open.
      onFocus={(e) => hold({ focus: e.target.matches(":focus-visible") })}
      onBlur={() => hold({ focus: false })}
    >
      <li>
        <TrackedLink href={company.phone.href} event="phone_click" placement="contact-page" className={styles.action}>
          <span className={styles.label}>Call · {company.availability}</span>
          <span className={styles.value}>{company.phone.display}</span>
          <ArrowUpRight className={styles.arrow} />
        </TrackedLink>
      </li>
      {company.sms ? (
        <li>
          <TrackedLink href={company.sms} event="phone_click" placement="contact-page-text" className={styles.action}>
            <span className={styles.label}>Text</span>
            <span className={styles.value}>Send a message</span>
            <ArrowUpRight className={styles.arrow} />
          </TrackedLink>
        </li>
      ) : null}
      <li>
        <a href={`mailto:${company.email}`} className={styles.action}>
          <span className={styles.label}>Email</span>
          <span className={`${styles.value} ${styles.email}`}>{company.email}</span>
          <ArrowUpRight className={styles.arrow} />
        </a>
      </li>
      <li>
        <TrackedLink
          href={company.bookingUrl ?? "#request"}
          event={company.bookingUrl ? "booking_click" : "request_service_click"}
          placement="contact-page"
          className={styles.action}
          {...(company.bookingUrl ? { target: "_blank", rel: "noopener" } : {})}
        >
          <span className={styles.label}>{company.bookingUrl ? "Book online" : "Request service"}</span>
          <span className={styles.value}>
            {company.bookingUrl ? "Choose a time" : formAvailable ? "Tell us about the job" : "How requests work"}
          </span>
          <ArrowUpRight className={styles.arrow} />
        </TrackedLink>
      </li>
    </ul>
  );
}
