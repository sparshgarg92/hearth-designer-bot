import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import roomMain from "@/assets/room-main.jpg";
import { INITIAL_ITEMS } from "@/lib/room-session";

export const Route = createFileRoute("/processing")({
  head: () => ({ meta: [{ title: "Understanding your room…" }] }),
  component: Processing,
});

const STYLE_TAGS = ["Scandinavian style", "West-facing window", "Natural light"];

function Processing() {
  const navigate = useNavigate();
  const [shownItems, setShownItems] = useState<number>(0);
  const [shownStyle, setShownStyle] = useState<number>(0);

  useEffect(() => {
    const itemTimers = INITIAL_ITEMS.map((_, i) =>
      setTimeout(() => setShownItems((c) => c + 1), 600 + i * 700),
    );
    const styleTimers = STYLE_TAGS.map((_, i) =>
      setTimeout(() => setShownStyle((c) => c + 1), 1500 + i * 600),
    );
    const done = setTimeout(() => navigate({ to: "/canvas" }), 600 + INITIAL_ITEMS.length * 700 + 1200);
    return () => {
      [...itemTimers, ...styleTimers, done].forEach(clearTimeout);
    };
  }, [navigate]);

  const totalDetected = shownItems + shownStyle;

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="grid w-full max-w-5xl grid-cols-1 items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
        {/* Image w/ floating tags */}
        <div className="relative aspect-[3/2] overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-elevated)]">
          <img
            src={roomMain}
            alt="Your room"
            className="h-full w-full object-cover"
            style={{ filter: "saturate(0.95)" }}
          />
          {/* Scanning shimmer */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(110deg, transparent 30%, oklch(1 0 0 / 0.35) 50%, transparent 70%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 2.4s linear infinite",
              mixBlendMode: "overlay",
            }}
          />
          {/* Item tags */}
          {INITIAL_ITEMS.slice(0, shownItems).map((item) => (
            <div
              key={item.id}
              className="animate-tag-pop absolute"
              style={{ left: `${item.x}%`, top: `${item.y}%`, transform: "translate(-50%, -50%)" }}
            >
              <div className="relative">
                <div
                  className="absolute inset-0 rounded-full bg-foreground/40"
                  style={{ animation: "pulse-ring 1.5s ease-out infinite" }}
                />
                <div className="relative flex items-center gap-2 rounded-full bg-foreground px-3 py-1.5 text-xs text-background shadow-[var(--shadow-soft)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-background" />
                  {item.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Detection list */}
        <div>
          <div className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {totalDetected === 0 ? "Looking at your room…" : "Found in your room"}
          </div>
          <h2 className="font-serif text-3xl tracking-tight">
            {totalDetected < INITIAL_ITEMS.length + STYLE_TAGS.length
              ? "Understanding the space"
              : "Ready"}
          </h2>

          <ul className="mt-6 space-y-2">
            {INITIAL_ITEMS.slice(0, shownItems).map((item) => (
              <li
                key={item.id}
                className="animate-fade-in-up flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5 text-sm shadow-[var(--shadow-soft)]"
              >
                <span className="h-2 w-2 rounded-full" style={{ background: "var(--sage)" }} />
                {item.label}
              </li>
            ))}
            {STYLE_TAGS.slice(0, shownStyle).map((tag) => (
              <li
                key={tag}
                className="animate-fade-in-up flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5 text-sm shadow-[var(--shadow-soft)]"
              >
                <span className="h-2 w-2 rounded-full" style={{ background: "var(--terracotta)" }} />
                {tag}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-foreground" />
            Building a navigable model of the space…
          </div>
        </div>
      </div>
    </main>
  );
}
