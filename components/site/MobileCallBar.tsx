import { company } from "@/content/company";
import { PhoneIcon } from "@/components/ui/Icon";
import { TrackedLink } from "@/components/ui/TrackedLink";
import styles from "./MobileCallBar.module.css";

/** Persistent mobile conversion bar: one-tap call plus request service. */
export function MobileCallBar() {
  return (
    <div className={styles.bar} role="region" aria-label="Quick contact">
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
