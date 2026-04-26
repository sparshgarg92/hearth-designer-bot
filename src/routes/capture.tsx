import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ImagePlus, ArrowLeft, Loader2 } from "lucide-react";
import { useRef, useState } from "react";

export const Route = createFileRoute("/capture")({
  head: () => ({
    meta: [{ title: "Scan your room — Matterport" }],
  }),
  component: Capture,
});

function Capture() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (file: File) => {
    setLoading(true);
    // No API call — just store a placeholder and navigate
    sessionStorage.setItem("roomData", JSON.stringify({
      rooms: [
        { id: "living",  name: "Living Room",  wallColor: "#E8DDD0" },
        { id: "kitchen", name: "Kitchen",       wallColor: "#E5E0D5" },
        { id: "bedroom", name: "Bed Room",      wallColor: "#D8E0E8" },
        { id: "toilet",  name: "Toilet",        wallColor: "#E0EEEE" },
        { id: "shop1",   name: "Shop 1",        wallColor: "#E5DDD5" },
        { id: "shop2",   name: "Shop 2",        wallColor: "#E5DDD5" },
        { id: "sitout",  name: "Sitout",        wallColor: "#EDE8E0" },
      ]
    }));
    navigate({ to: "/processing" });
  };

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
          Upload your floor plan
        </h1>
        <p className="animate-fade-in-up mt-3 max-w-md text-muted-foreground">
          Upload a floor plan image and we'll generate a 3D model of your space.
        </p>

        <div className="animate-fade-in-up mt-12 w-full" style={{ animationDelay: "200ms" }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="group flex w-full flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card p-16 shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]"
          >
            {loading ? (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                <div className="font-serif text-lg">Analyzing your floor plan...</div>
              </>
            ) : (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background transition-transform group-hover:scale-110">
                  <ImagePlus className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <div className="font-serif text-lg">Upload a floor plan</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Click to browse or drag and drop an image
                  </div>
                </div>
              </>
            )}
          </button>
        </div>
      </section>
    </main>
  );
}
