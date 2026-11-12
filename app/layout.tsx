import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { ViewTransition } from "react";
import { company } from "@/content/company";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { MobileCallBar } from "@/components/site/MobileCallBar";
import { RevealObserver, revealBootScript } from "@/components/ui/RevealObserver";
import { JsonLd } from "@/components/ui/JsonLd";
import { businessJsonLd, pageMetadata } from "@/lib/seo";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const sans = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(company.url),
  applicationName: company.name,
  robots: { index: true, follow: true },
  formatDetection: { telephone: true, email: true, address: false },
  ...pageMetadata({
    title: "Plumbers on Call CORP | Residential & Commercial Plumbing, Greater Boston",
    description:
      "Boilers, water heaters, bathroom plumbing and commercial work across Greater Boston, with 24/7 emergency service. Call (781) 299-5011.",
    path: "/",
  }),
};

export const viewport: Viewport = {
  themeColor: "#f6f2ea",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // The inline boot script adds the `js` class before hydration.
    <html lang="en-US" className={`${display.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: revealBootScript }} />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Header />
        <ViewTransition>
          <main id="main" tabIndex={-1}>
            {children}
          </main>
        </ViewTransition>
        <Footer />
        <MobileCallBar />
        <RevealObserver />
        <JsonLd data={businessJsonLd()} />
      </body>
    </html>
  );
}
