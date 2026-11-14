import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { company } from "@/content/company";
import { PhoneIcon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { TrackedLink } from "@/components/ui/TrackedLink";

export const metadata: Metadata = {
  title: { absolute: "Page not found | Plumbers on Call CORP" },
  robots: { index: false, follow: true },
};

// Layout-only styles; everything visual comes from the reading template and the global classes.
const links: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.85rem",
};

export default function NotFound() {
  return (
    <PageHero
      variant="reading"
      title={
        <>
          This page isn&rsquo;t <em>here.</em>
        </>
      }
      lede={<p>The link may be out of date, or the page may have moved. These will get you back on track.</p>}
      crumbs={[]}
    >
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
      <p style={{ marginTop: "2rem", color: "var(--text-soft)" }}>
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
    </PageHero>
  );
}
