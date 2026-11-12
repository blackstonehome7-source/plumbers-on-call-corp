"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { company } from "@/content/company";
import { PhoneIcon } from "@/components/ui/Icon";
import { TrackedLink } from "@/components/ui/TrackedLink";
import styles from "./MobileCallBar.module.css";

/**
 * Persistent mobile conversion bar: one-tap call plus request service.
 * On the homepage it waits until the hero (which has the same actions) has
 * scrolled away; everywhere else it is always present.
 */
export function MobileCallBar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [pastHero, setPastHero] = useState(false);

  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => setPastHero(window.scrollY > window.innerHeight * 0.55);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  const hidden = isHome && !pastHero;

  return (
    <div className={styles.bar} role="region" aria-label="Quick contact" data-hidden={hidden ? "" : undefined} inert={hidden}>
      <TrackedLink href={company.phone.href} event="phone_click" placement="mobile-bar" className={styles.call}>
        <PhoneIcon />
        <span>
          <small>Call {company.availability}</small>
          {company.phone.display}
        </span>
      </TrackedLink>
      <TrackedLink href="/contact" event="request_service_click" placement="mobile-bar" className={styles.request}>
        Request Service
      </TrackedLink>
    </div>
  );
}
