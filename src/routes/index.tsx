import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Matterport — Redesign any room. From your phone." },
      {
        name: "description",
        content:
          "Scan your room with your phone. Then have a conversation with it — remove things, add furniture, restyle the whole space, and shop what you see.",
      },
      { property: "og:title", content: "Matterport — Redesign any room. From your phone." },
      {
        property: "og:description",
        content:
          "Scan your room. Then have a conversation with it. Remove, add, restyle — and shop what you see.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-spotlight)" }} />

      {/* Header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-foreground" />
          <span className="font-serif text-lg tracking-tight">Matterport</span>
        </div>
        <nav className="hidden gap-8 text-sm text-muted-foreground sm:flex">
          <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto flex max-w-3xl flex-col items-center px-6 pt-20 pb-32 text-center sm:pt-32">
        <span className="animate-fade-in mb-6 rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs tracking-wide text-muted-foreground backdrop-blur">
          A new way to see your space
        </span>

        <h1 className="animate-fade-in-up font-serif text-5xl leading-[1.05] tracking-tight text-foreground sm:text-7xl">
          Redesign any room.<br />
          <span className="text-muted-foreground">From your phone.</span>
        </h1>

        <p
          className="animate-fade-in-up mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          style={{ animationDelay: "120ms" }}
        >
          Point your camera around your room. Then have a conversation with it —
          remove the coffee table, add a marble one, restyle the whole space.
        </p>

        <div className="animate-fade-in-up mt-10" style={{ animationDelay: "240ms" }}>
          <Link
            to="/capture"
            className="group inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-4 text-base font-medium text-background shadow-[var(--shadow-elevated)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_24px_60px_-20px_oklch(0.2_0.02_60_/_0.3)]"
          >
            Scan your room
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <p className="mt-3 text-xs text-muted-foreground">No signup. Takes 30 seconds.</p>
        </div>
      </section>

      <footer className="absolute bottom-6 left-0 right-0 text-center text-xs text-muted-foreground">
        Built for anyone who's ever wished they could see it before they bought it.
      </footer>
    </main>
  );
}
