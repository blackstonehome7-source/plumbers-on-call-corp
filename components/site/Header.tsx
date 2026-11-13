"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { company } from "@/content/company";
import { primaryNav } from "@/content/navigation";
import { CloseIcon, MenuIcon, PhoneIcon } from "@/components/ui/Icon";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { Logo } from "./Logo";
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

  const openMenu = () => {
    dialogRef.current?.showModal();
    setMenuOpen(true);
  };
  const closeMenu = () => dialogRef.current?.close();

  // On the home hero the big slab carries the logo, so the header shows the region instead.
  const overHero = isHome && !scrolled;
  const current = (href: string) => {
    if (href === "/") return isHome ? ("page" as const) : undefined;
    if (pathname === href) return "page" as const;
    return pathname.startsWith(`${href}/`) ? ("true" as const) : undefined;
  };

  return (
    <header className={styles.header} data-over-hero={overHero ? "" : undefined} data-scrolled={scrolled ? "" : undefined}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} aria-label={`${company.name} — home`}>
          <span className={styles.region} aria-hidden={!overHero}>
            {company.region}
          </span>
          <span className={styles.mark} aria-hidden={overHero}>
            <Logo />
          </span>
        </Link>

        <nav className={styles.nav} aria-label="Primary">
          <ul>
            {primaryNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={styles.navLink} aria-current={current(item.href)}>
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
          <span className={styles.callFull}>{company.phone.display}</span>
          <span className={styles.callShort}>Call</span>
        </TrackedLink>

        <TrackedLink href="/contact" event="request_service_click" placement="header" className={`btn ${styles.request}`}>
          Request Service
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
        // Fires for Escape, the close button, backdrop clicks and route changes.
        onClose={() => setMenuOpen(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeMenu();
        }}
      >
        <div className={styles.sheetInner}>
          <div className={styles.sheetTop}>
            <span className={styles.sheetMark}>
              <Logo lazy />
            </span>
            <button type="button" className={styles.closeButton} onClick={closeMenu} autoFocus>
              <CloseIcon />
              <span className="sr-only">Close menu</span>
            </button>
          </div>
          <nav aria-label="Mobile">
            <ol className={styles.sheetList}>
              {primaryNav.map((item, i) => (
                <li key={item.href}>
                  <Link href={item.href} className={styles.sheetLink} aria-current={current(item.href)} onClick={closeMenu}>
                    <span className={styles.sheetNum}>{String(i + 1).padStart(2, "0")}</span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
          <div className={styles.sheetFoot}>
            <p className="caption">
              Available {company.availability} · {company.region}
            </p>
            <TrackedLink href={company.phone.href} event="phone_click" placement="mobile-menu" className="btn btn--gold">
              <PhoneIcon /> Call {company.phone.display}
            </TrackedLink>
            <TrackedLink
              href="/contact"
              event="request_service_click"
              placement="mobile-menu"
              className="btn"
              onClick={closeMenu}
            >
              Request Service
            </TrackedLink>
          </div>
        </div>
      </dialog>
    </header>
  );
}
