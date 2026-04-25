import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/processing")({
  head: () => ({ meta: [{ title: "Understanding your room…" }] }),
  component: Processing,
});

function Processing() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<any[]>([]);
  const [shownItems, setShownItems] = useState(0);

  useEffect(() => {
    const raw = sessionStorage.getItem("roomData");
    if (raw) {
      const data = JSON.parse(raw);
      setRooms(data.rooms || []);
    }
  }, []);

  useEffect(() => {
    if (rooms.length === 0) return;
    const timers = rooms.map((_, i) =>
      setTimeout(() => setShownItems((c) => c + 1), 600 + i * 700)
    );
    const done = setTimeout(
      () => navigate({ to: "/canvas" }),
      600 + rooms.length * 700 + 1200
    );
    return () => {
      [...timers, done].forEach(clearTimeout);
    };
  }, [rooms, navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="grid w-full max-w-5xl grid-cols-1 items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
        {/* Left: animated placeholder */}
        <div className="relative aspect-[3/2] overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-elevated)] flex items-center justify-center">
          <div className="text-muted-foreground text-sm">Generating 3D model…</div>
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
        </div>

        {/* Right: room list */}
        <div>
          <div className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {shownItems === 0 ? "Analyzing your floor plan…" : "Found in your space"}
          </div>
          <h2 className="font-serif text-3xl tracking-tight">
            {shownItems < rooms.length ? "Understanding the space" : "Ready"}
          </h2>

          <ul className="mt-6 space-y-2">
            {rooms.slice(0, shownItems).map((room) => (
              <li
                key={room.id}
                className="animate-fade-in-up flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5 text-sm shadow-[var(--shadow-soft)]"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: room.wallColor || "#a3b18a" }}
                />
                {room.name}
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