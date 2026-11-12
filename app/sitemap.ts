import type { MetadataRoute } from "next";
import { company } from "@/content/company";
import { services } from "@/content/services";
import { projects } from "@/content/projects";

export default function sitemap(): MetadataRoute.Sitemap {
  const url = (path: string) => `${company.url}${path}`;
  const lastModified = new Date();
  return [
    { url: url("/"), lastModified, changeFrequency: "monthly", priority: 1 },
    { url: url("/services"), lastModified, changeFrequency: "monthly", priority: 0.9 },
    ...services.map((s) => ({
      url: url(`/services/${s.slug}`),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: s.slug === "emergency-plumbing" ? 0.9 : 0.8,
    })),
    { url: url("/work"), lastModified, changeFrequency: "monthly", priority: 0.7 },
    ...projects.map((p) => ({ url: url(`/work/${p.slug}`), lastModified, changeFrequency: "yearly" as const, priority: 0.6 })),
    { url: url("/about"), lastModified, changeFrequency: "yearly", priority: 0.6 },
    { url: url("/service-areas"), lastModified, changeFrequency: "yearly", priority: 0.7 },
    { url: url("/contact"), lastModified, changeFrequency: "yearly", priority: 0.8 },
    { url: url("/privacy"), lastModified, changeFrequency: "yearly", priority: 0.2 },
  ];
}
