import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { company } from "@/content/company";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { MobileCallBar } from "@/components/site/MobileCallBar";
import { RevealObserver } from "@/components/ui/RevealObserver";
import { JsonLd } from "@/components/ui/JsonLd";
import { WorldCanvas, bootScript } from "@/components/world/WorldCanvas";
import { businessJsonLd } from "@/lib/seo";
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
  weight: ["400", "600", "700"],
  display: "swap",
});

// Page-specific titles, descriptions and canonicals live with each page.
export const metadata: Metadata = {
  metadataBase: new URL(company.url),
  applicationName: company.name,
  title: company.name,
  robots: { index: true, follow: true },
  formatDetection: { telephone: true, email: true, address: false },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // The inline boot script sets classes/data attributes before hydration.
    <html lang="en-US" className={`${display.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <WorldCanvas />
        <Header />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <Footer />
        <MobileCallBar />
        <RevealObserver />
        <JsonLd data={businessJsonLd()} />
      </body>
    </html>
  );
}
