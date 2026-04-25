import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Video, ImagePlus, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/capture")({
  head: () => ({
    meta: [{ title: "Scan your room — Roomly" }],
  }),
  component: Capture,
});

function Capture() {
  const navigate = useNavigate();

  const start = () => navigate({ to: "/processing" });

  return (
    <main className="relative min-h-screen px-6 py-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <section className="mx-auto mt-20 flex max-w-2xl flex-col items-center text-center">
        <h1 className="animate-fade-in-up font-serif text-4xl tracking-tight sm:text-5xl">
          How would you like to capture it?
        </h1>
        <p
          className="animate-fade-in-up mt-3 max-w-md text-muted-foreground"
          style={{ animationDelay: "100ms" }}
        >
          Point your camera around the room. No tripod, no instructions. Just show
          us the space like you're on a FaceTime call.
        </p>

        <div
          className="animate-fade-in-up mt-12 grid w-full grid-cols-1 gap-4 sm:grid-cols-2"
          style={{ animationDelay: "200ms" }}
        >
          <button
            onClick={start}
            className="group flex flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card p-10 text-left shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background transition-transform group-hover:scale-110">
              <Video className="h-6 w-6" />
            </div>
            <div className="text-center">
              <div className="font-serif text-lg">Take a video</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Pan your phone slowly around the room — about 15 seconds.
              </div>
            </div>
          </button>

          <button
            onClick={start}
            className="group flex flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card p-10 text-left shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-foreground transition-transform group-hover:scale-110">
              <ImagePlus className="h-6 w-6" />
            </div>
            <div className="text-center">
              <div className="font-serif text-lg">Upload a photo</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Already have one? Drop it in.
              </div>
            </div>
          </button>
        </div>

        <p
          className="animate-fade-in-up mt-10 text-xs text-muted-foreground"
          style={{ animationDelay: "320ms" }}
        >
          Demo mode — we'll use a sample room for this preview.
        </p>
      </section>
    </main>
  );
}
