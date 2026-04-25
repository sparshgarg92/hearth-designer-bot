import { useState } from "react";
import { Link as LinkIcon, Sun, RotateCw, Mountain, Loader2 } from "lucide-react";
import { useRoomSession } from "@/lib/room-session";

const API_URL = "https://roomly-backend-seven.vercel.app";

export function ItemSidebar() {
  const { setLinkPreview, imageAdjust, setImageAdjust, aiDirection, setAiDirection } =
    useRoomSession();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submitLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    setLoading(true);
    setError("");

    try {
      const isAirbnb = /airbnb\./i.test(trimmed);

      // Fetch real image + title directly from the URL
      const imgRes = await fetch(`${API_URL}/api/fetch-product-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const imgData = await imgRes.json();

      // Fallback title from Amazon URL path if og:title not found
      let productName = imgData.title || "";
      if (!productName) {
        const pathParts = new URL(trimmed).pathname.split("/").filter(Boolean);
        const dpIndex = pathParts.indexOf("dp");
        productName = dpIndex > 0
          ? pathParts[dpIndex - 1].replace(/-/g, " ")
          : pathParts[0]?.replace(/-/g, " ") || "Product";
      }

      setLinkPreview({
        url: trimmed,
        kind: isAirbnb ? "airbnb" : "product",
        title: productName,
        price: "",
        image: imgData.image || "",
      });
      setUrl("");
    } catch {
      setError("Couldn't fetch that. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-card/40 p-4 lg:flex overflow-y-auto">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Add by link
        </div>
        <form onSubmit={submitLink} className="mt-2 flex flex-col gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-2">
            <LinkIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Amazon or Airbnb link…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="flex items-center justify-center gap-2 rounded-lg bg-foreground px-3 py-1.5 text-xs text-background shadow-[var(--shadow-soft)] hover:scale-[1.01] transition disabled:opacity-50"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {loading ? "Fetching…" : "Add to room"}
          </button>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </form>
      </div>

      <div className="mt-6">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Image adjustments
        </div>
        <div className="mt-3 flex flex-col gap-3">
          <SliderRow icon={<Sun className="h-3.5 w-3.5" />} label="Brightness"
            value={imageAdjust.brightness} min={50} max={150} unit="%"
            onChange={(v) => setImageAdjust({ ...imageAdjust, brightness: v })} />
          <SliderRow icon={<RotateCw className="h-3.5 w-3.5" />} label="Rotation"
            value={imageAdjust.rotation} min={-15} max={15} unit="°"
            onChange={(v) => setImageAdjust({ ...imageAdjust, rotation: v })} />
          <SliderRow icon={<Mountain className="h-3.5 w-3.5" />} label="Elevation"
            value={imageAdjust.elevation} min={-20} max={20} unit=""
            onChange={(v) => setImageAdjust({ ...imageAdjust, elevation: v })} />
        </div>
      </div>

      <div className="mt-6">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          AI direction
        </div>
        <div className="mt-3 flex flex-col gap-2">
          <FieldRow label="Wall colour" value={aiDirection.wallColour}
            onChange={(v) => setAiDirection({ ...aiDirection, wallColour: v })} placeholder="warm beige" />
          <FieldRow label="Wall material" value={aiDirection.wallMaterial}
            onChange={(v) => setAiDirection({ ...aiDirection, wallMaterial: v })} placeholder="lime plaster" />
          <FieldRow label="Floor colour" value={aiDirection.floorColour}
            onChange={(v) => setAiDirection({ ...aiDirection, floorColour: v })} placeholder="natural oak" />
          <FieldRow label="Floor material" value={aiDirection.floorMaterial}
            onChange={(v) => setAiDirection({ ...aiDirection, floorMaterial: v })} placeholder="wide-plank wood" />
        </div>
      </div>
    </aside>
  );
}

function SliderRow({ icon, label, value, min, max, unit, onChange }: {
  icon: React.ReactNode; label: string; value: number;
  min: number; max: number; unit: string; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">{icon}{label}</span>
        <span className="tabular-nums text-foreground/70">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 w-full accent-foreground" />
    </div>
  );
}

function FieldRow({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] text-muted-foreground">{label}:</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-foreground/40" />
    </label>
  );
}
