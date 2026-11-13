"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * One shared IntersectionObserver for every [data-reveal] element.
 * Elements render visible on the server; the inline head script adds
 * html.js so unseen ones start hidden, and this marks them revealed.
 */
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.revealReady = "1";
    const items = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-revealed])"),
    );
    if (!("IntersectionObserver" in window)) {
      items.forEach((el) => el.setAttribute("data-revealed", ""));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-revealed", "");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0 },
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  return null;
}
