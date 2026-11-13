"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { projects } from "@/content/projects";
import { scopes } from "@/content/scopes";
import type { World } from "@/world/engine";
import styles from "./WorldCanvas.module.css";

type Tier = "full" | "lite" | "static";

/** Custom event pages use to talk to the world, e.g. opening the valve on Contact. */
export type WorldSignal = { name: "valve" | "plumb"; value: number };
export const signalWorld = (detail: WorldSignal) => window.dispatchEvent(new CustomEvent("poc:signal", { detail }));

function pickTier(): Tier {
  if (/[?&]world=off\b/.test(location.search)) return "static";
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return "static";
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  if (nav.connection?.saveData) return "static";
  try {
    const probe = document.createElement("canvas");
    if (!(probe.getContext("webgl2") || probe.getContext("webgl"))) return "static";
  } catch {
    return "static";
  }
  const small = matchMedia("(max-width: 860px), (pointer: coarse)").matches;
  const weak = (nav.deviceMemory ?? 8) <= 4 || (navigator.hardwareConcurrency ?? 8) <= 4;
  return small || weak ? "lite" : "full";
}

// Photographs for the plates: genuine projects once they exist, otherwise the labelled scopes.
const plates =
  projects.length > 0
    ? projects.slice(0, 6).map((p) => ({ src: p.photos[0].src, aspect: p.photos[0].width / p.photos[0].height }))
    : scopes.map((s) => ({ src: `/world/plates/${s.image}.webp`, aspect: 1280 / 900 }));

/**
 * The persistent 3D world behind every page. It loads after first paint, so
 * text never waits for it, and it is purely decorative (aria-hidden): every
 * word on the site is ordinary HTML above it.
 */
export function WorldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<World | null>(null);
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  const router = useRouter();

  // Arrive: the route changed (link, back/forward).
  useEffect(() => {
    pathRef.current = pathname;
    const root = document.documentElement;
    worldRef.current?.setRoute(pathname);
    if ("leaving" in root.dataset) {
      delete root.dataset.leaving;
      root.dataset.arriving = "";
      const t = window.setTimeout(() => delete root.dataset.arriving, 1700);
      return () => window.clearTimeout(t);
    }
  }, [pathname]);

  useEffect(() => {
    const root = document.documentElement;
    const tier = pickTier();
    root.dataset.tier = tier;
    if (tier === "static") {
      delete root.dataset.intro;
      return;
    }

    let disposed = false;
    let world: World | null = null;
    import("@/world/engine")
      .then(({ createWorld }) => {
        if (disposed || !canvasRef.current) return;
        world = createWorld(canvasRef.current, {
          tier,
          plates,
          onFirstFrame: () => {
            root.dataset.world = "on";
          },
        });
        worldRef.current = world;
        world.setRoute(pathRef.current, true);
        if (root.dataset.intro === "playing") {
          try {
            sessionStorage.setItem("poc-intro", "1");
          } catch {}
          world.startIntro(
            () => {
              root.dataset.intro = "reveal";
            },
            () => {
              window.setTimeout(() => delete root.dataset.intro, 1400);
            },
          );
        }
      })
      .catch(() => {
        root.dataset.tier = "static";
        delete root.dataset.intro;
      });

    const onSignal = (e: Event) => {
      const { name, value } = (e as CustomEvent<WorldSignal>).detail;
      worldRef.current?.signal(name, value);
    };
    window.addEventListener("poc:signal", onSignal);

    // Depart: start the camera on its way, clear the words, then navigate.
    const onClick = (e: MouseEvent) => {
      if (!worldRef.current || e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname.startsWith("/api/")) return;
      if (url.pathname === location.pathname) return;
      e.preventDefault();
      root.dataset.leaving = "";
      worldRef.current.setRoute(url.pathname);
      window.setTimeout(() => router.push(url.pathname + url.search + url.hash), 360);
    };
    window.addEventListener("click", onClick, true);

    return () => {
      disposed = true;
      window.removeEventListener("poc:signal", onSignal);
      window.removeEventListener("click", onClick, true);
      world?.dispose();
      worldRef.current = null;
      delete root.dataset.world;
    };
    // The world is created once for the lifetime of the app shell.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className={styles.backdrop} aria-hidden="true" />
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" tabIndex={-1} />
      <div className={styles.vignette} aria-hidden="true" />
      <button type="button" className={styles.skip} onClick={() => worldRef.current?.skipIntro()}>
        Skip intro
      </button>
    </>
  );
}

/** Inline, render-blocking boot: reveal-on-scroll flag and the once-per-visit intro flag. */
export const bootScript = `(function(){var r=document.documentElement;r.classList.add('js');setTimeout(function(){if(!r.dataset.revealReady){r.classList.remove('js')}},3500);try{if(location.pathname==='/'&&!location.hash&&!/[?&]world=off/.test(location.search)&&!sessionStorage.getItem('poc-intro')&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&window.WebGLRenderingContext){r.dataset.intro='playing';setTimeout(function(){if(r.dataset.intro==='playing'&&!r.dataset.world){delete r.dataset.intro}},5000)}}catch(e){}})()`;
