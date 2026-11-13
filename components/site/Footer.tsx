import Link from "next/link";
import { company } from "@/content/company";
import { services } from "@/content/services";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { Logo } from "./Logo";
import styles from "./Footer.module.css";

// Fixed at build time on purpose: static pages should not change between requests.
const year = new Date().getFullYear();

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.top}>
          <div className={styles.brandCol}>
            <Link href="/" className={styles.mark} aria-label={`${company.name} — home`}>
              <Logo lazy />
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
              <li>
                <Link href="/work">Our Work</Link>
              </li>
              <li>
                <Link href="/about">About</Link>
              </li>
              <li>
                <Link href="/service-areas">Service Areas</Link>
              </li>
              <li>
                <Link href="/contact">Contact</Link>
              </li>
              <li>
                <Link href="/privacy">Privacy</Link>
              </li>
            </ul>
          </nav>

          <div className={styles.col}>
            <h2 className={styles.heading}>Reach us</h2>
            <ul>
              <li>
                <TrackedLink href={company.phone.href} event="phone_click" placement="footer" className={styles.phone}>
                  {company.phone.display}
                </TrackedLink>
              </li>
              {company.sms ? (
                <li>
                  <a href={company.sms}>Send a text</a>
                </li>
              ) : null}
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
          <p>Images marked “Illustrative” do not show completed company projects.</p>
        </div>
      </div>
    </footer>
  );
}
