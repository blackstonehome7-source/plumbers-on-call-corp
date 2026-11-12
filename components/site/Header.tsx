"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { company } from "@/content/company";
import { primaryNav } from "@/content/navigation";
import { CloseIcon, MenuIcon, PhoneIcon } from "@/components/ui/Icon";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { Wordmark } from "./Wordmark";
import styles from "./Header.module.css";

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the menu on navigation.
  useEffect(() => {
    dialogRef.current?.close();
  }, [pathname]);

  const openMenu = () => dialogRef.current?.showModal();
  const closeMenu = () => dialogRef.current?.close();

  const overHero = isHome && !scrolled;
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className={styles.header} data-over-hero={overHero ? "" : undefined}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} aria-label={`${company.name} — home`}>
          <span className={styles.region} aria-hidden={!overHero}>
            {company.region}
          </span>
          <span className={styles.mark} aria-hidden={overHero}>
            <Wordmark />
          </span>
        </Link>

        <nav className={styles.nav} aria-label="Primary">
          <ul>
            {primaryNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={styles.navLink}
                  aria-current={isActive(item.href) ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <TrackedLink
          href={company.phone.href}
          event="phone_click"
          placement="header"
          className={styles.call}
          aria-label={`Call ${company.name} at ${company.phone.display}, available ${company.availability}`}
        >
          <PhoneIcon />
          <span className={styles.callLabel}>
            <span className={styles.callFull}>Call {company.phone.compact}</span>
            <span className={styles.callShort}>Call</span>
          </span>
        </TrackedLink>

        <button
          type="button"
          className={styles.menuButton}
          onClick={openMenu}
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
          aria-controls="site-menu"
        >
          <MenuIcon />
          <span className="sr-only">Open menu</span>
        </button>
      </div>

      <dialog
        id="site-menu"
        ref={dialogRef}
        className={styles.sheet}
        aria-label="Site menu"
        onClose={() => setMenuOpen(false)}
        onCancel={() => setMenuOpen(false)}
        // showModal() is called imperatively; sync the expanded state.
        onToggle={(e) => setMenuOpen((e.currentTarget as HTMLDialogElement).open)}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeMenu();
        }}
      >
        <div className={styles.sheetInner}>
          <div className={styles.sheetTop}>
            <span className={styles.sheetMark}>
              <Wordmark />
            </span>
            <button type="button" className={styles.closeButton} onClick={closeMenu} autoFocus>
              <CloseIcon />
              <span className="sr-only">Close menu</span>
            </button>
          </div>
          <nav aria-label="Mobile">
            <ul className={styles.sheetList}>
              <li>
                <Link href="/" className={styles.sheetLink} aria-current={isHome ? "page" : undefined}>
                  Home
                </Link>
              </li>
              {primaryNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={styles.sheetLink}
                    aria-current={isActive(item.href) ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className={styles.sheetFoot}>
            <p className="caption">Available {company.availability} · {company.region}</p>
            <TrackedLink
              href={company.phone.href}
              event="phone_click"
              placement="mobile-menu"
              className="btn btn--dark"
            >
              <PhoneIcon /> Call {company.phone.display}
            </TrackedLink>
            <TrackedLink
              href="/contact"
              event="request_service_click"
              placement="mobile-menu"
              className="btn"
            >
              Request Service
            </TrackedLink>
          </div>
        </div>
      </dialog>
    </header>
  );
}
