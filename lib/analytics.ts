/**
 * Thin event forwarder. No vendor script is loaded here: events go to whatever
 * the owner installs later (Google Tag Manager's dataLayer and/or Vercel
 * Analytics' `window.va`). Without either, this is a no-op.
 */
export type AnalyticsEvent =
  | "phone_click"
  | "request_service_click"
  | "booking_click"
  | "inquiry_submitted"
  | "inquiry_failed";

declare global {
  interface Window {
    dataLayer?: unknown[];
    // Same signature as @vercel/analytics declares, so the two merge cleanly if it is installed.
    va?: (event: "beforeSend" | "event" | "pageview", properties?: unknown) => void;
  }
}

export function track(event: AnalyticsEvent, props?: Record<string, string>): void {
  if (typeof window === "undefined") return;
  try {
    window.dataLayer?.push({ event, ...props });
    window.va?.("event", { name: event, data: props });
  } catch {
    // Analytics must never break the page.
  }
}
