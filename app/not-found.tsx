import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { company } from "@/content/company";
import { PhoneIcon } from "@/components/ui/Icon";
import { TrackedLink } from "@/components/ui/TrackedLink";

export const metadata: Metadata = {
  title: { absolute: "Page not found | Plumbers on Call CORP" },
  robots: { index: false, follow: true },
};

// Layout-only styles; everything visual comes from the global design tokens/classes.
const wrap: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  paddingTop: "calc(var(--header-h) + clamp(3rem, 8vw, 7rem))",
  paddingBottom: "var(--section)",
  background: "var(--bg)",
  textAlign: "center",
};
const links: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: "0.85rem",
  marginTop: "2.5rem",
};

export default function NotFound() {
  return (
    <section style={wrap} aria-labelledby="not-found-title">
      <div className="container" style={{ display: "grid", justifyItems: "center" }}>
        <p className="eyebrow">404</p>
        <h1 id="not-found-title" className="display-l" style={{ maxWidth: "18ch" }}>
          This page isn&rsquo;t here.
        </h1>
        <p className="lede" style={{ marginTop: "1.5rem" }}>
          The link may be out of date, or the page may have moved. These will get you back on track.
        </p>
        <nav aria-label="Helpful links" style={links}>
          <Link href="/" className="btn btn--dark">
            Home
          </Link>
          <Link href="/services" className="btn">
            Services
          </Link>
          <Link href="/contact" className="btn">
            Contact
          </Link>
        </nav>
        <p style={{ marginTop: "2rem", color: "var(--text-muted)" }}>
          Need a plumber now?{" "}
          <TrackedLink
            href={company.phone.href}
            event="phone_click"
            placement="404"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              minHeight: "44px",
              color: "var(--text)",
              fontWeight: 600,
            }}
          >
            <PhoneIcon width={16} height={16} /> {company.phone.display}
          </TrackedLink>
        </p>
      </div>
    </section>
  );
}
