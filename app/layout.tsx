import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600"],
});

const sans = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://plumberoncallcorp.com"),
  title: "Plumbers on Call Corp | 24/7 Plumbing Service",
  description:
    "Reliable residential and commercial plumbing service, available 24/7. Call Plumbers on Call Corp at (781) 299-5011.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Plumbers on Call Corp | 24/7 Plumbing Service",
    description:
      "Residential and commercial plumbing service available 24/7. Call Plumbers on Call Corp at (781) 299-5011.",
    url: "/",
    siteName: "Plumbers on Call Corp",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#f3eee5",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${sans.variable}`}>{children}</body>
    </html>
  );
}
