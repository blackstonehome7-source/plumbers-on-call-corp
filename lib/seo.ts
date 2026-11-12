import type { Metadata } from "next";
import { company } from "@/content/company";

type PageMeta = {
  title: string;
  description: string;
  path: string;
  image?: string;
};

/** Per-page metadata with canonical + Open Graph, sharing one shape everywhere. */
export function pageMetadata({ title, description, path, image }: PageMeta): Metadata {
  const ogImage = image ?? "/og.jpg";
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: company.name,
      type: "website",
      locale: "en_US",
      images: [{ url: ogImage, width: 1200, height: 630, alt: company.name }],
    },
    twitter: { card: "summary_large_image", title, description, images: [ogImage] },
  };
}

/** LocalBusiness/Plumber entity — verified facts only (no address: no office is verified). */
export function businessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Plumber",
    "@id": `${company.url}/#business`,
    name: company.name,
    url: company.url,
    telephone: company.phone.e164,
    email: company.email,
    image: `${company.url}/og.jpg`,
    logo: `${company.url}/brand/wordmark.webp`,
    founder: { "@type": "Person", name: company.owner.name, jobTitle: company.owner.title },
    areaServed: [
      { "@type": "AdministrativeArea", name: "Greater Boston, Massachusetts" },
      { "@type": "State", name: company.state },
    ],
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: "00:00",
        closes: "23:59",
      },
    ],
    ...(company.reviewUrl ? { sameAs: [company.reviewUrl] } : {}),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${company.url}${item.path}`,
    })),
  };
}

export function serviceJsonLd(s: { name: string; description: string; path: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: s.name,
    name: s.name,
    description: s.description,
    url: `${company.url}${s.path}`,
    provider: { "@id": `${company.url}/#business` },
    areaServed: { "@type": "State", name: company.state },
  };
}
