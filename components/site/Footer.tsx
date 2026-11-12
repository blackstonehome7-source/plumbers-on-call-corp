import Link from "next/link";
import { company } from "@/content/company";
import { primaryNav } from "@/content/navigation";
import { services } from "@/content/services";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { Wordmark } from "./Wordmark";
import styles from "./Footer.module.css";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.top}>
          <div className={styles.brandCol}>
            <Link href="/" className={styles.mark} aria-label={`${company.name} — home`}>
              <Wordmark />
            </Link>
            <p className={styles.tagline}>Professional plumbing. Exceptional workmanship. Built on trust.</p>
            <p className={styles.meta}>
              Residential &amp; commercial · Available {company.availability}
              <br />
              Serving {company.region} and {company.state}
            </p>
          </div>

          <nav className={styles.col} aria-label="Services">
            <h2 className={styles.heading}>Services</h2>
            <ul>
              {services.map((s) => (
                <li key={s.slug}>
                  <Link href={`/services/${s.slug}`}>{s.name}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className={styles.col} aria-label="Company">
            <h2 className={styles.heading}>Company</h2>
            <ul>
              {primaryNav
                .filter((n) => n.href !== "/services")
                .map((n) => (
                  <li key={n.href}>
                    <Link href={n.href}>{n.label}</Link>
                  </li>
                ))}
              <li>
                <Link href="/privacy">Privacy</Link>
              </li>
            </ul>
          </nav>

          <div className={styles.col}>
            <h2 className={styles.heading}>Contact</h2>
            <ul>
              <li>
                <TrackedLink href={company.phone.href} event="phone_click" placement="footer" className={styles.phone}>
                  {company.phone.display}
                </TrackedLink>
              </li>
              <li>
                <a href={`mailto:${company.email}`}>{company.email}</a>
              </li>
              <li>
                <TrackedLink href="/contact" event="request_service_click" placement="footer">
                  Request service
                </TrackedLink>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>
            © {year} {company.name}. All rights reserved.
          </p>
          <p>Imagery marked “Illustrative” does not depict completed company projects.</p>
        </div>
      </div>
    </footer>
  );
}
