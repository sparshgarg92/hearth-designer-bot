import { useState } from "react";
import { Link as LinkIcon, Sun, RotateCw, Mountain, Loader2 } from "lucide-react";
import { useRoomSession } from "@/lib/room-session";

const API_URL = "https://roomly-backend-seven.vercel.app";

function guessFurnitureType(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("sofa") || t.includes("couch") || t.includes("sectional")) return "sofa";
  if (t.includes("chair") || t.includes("recliner") || t.includes("armchair")) return "chair";
  if (t.includes("table") || t.includes("coffee table") || t.includes("dining table")) return "table";
  if (t.includes("desk")) return "desk";
  if (t.includes("bed") || t.includes("mattress") || t.includes("headboard")) return "bed";
  if (t.includes("lamp") || t.includes("light") || t.includes("chandelier")) return "lamp";
  if (t.includes("tv") || t.includes("television") || t.includes("monitor")) return "tv";
  if (t.includes("rug") || t.includes("carpet") || t.includes("mat")) return "rug";
  if (t.includes("plant") || t.includes("flower") || t.includes("succulent")) return "plant";
  if (t.includes("shelf") || t.includes("bookcase") || t.includes("bookshelf")) return "shelf";
  return "other";
}

function guessColor(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("white")) return "#F5F5F5";
  if (t.includes("black")) return "#1A1A1A";
  if (t.includes("grey") || t.includes("gray")) return "#808080";
  if (t.includes("brown") || t.includes("walnut") || t.includes("oak")) return "#8B6914";
  if (t.includes("beige") || t.includes("cream") || t.includes("ivory")) return "#E8DCC8";
  if (t.includes("navy") || t.includes("blue")) return "#1B3A6B";
  if (t.includes("green") || t.includes("sage") || t.includes("olive")) return "#4A7C59";
  if (t.includes("red") || t.includes("burgundy")) return "#8B1A1A";
  if (t.includes("pink") || t.includes("blush") || t.includes("rose")) return "#C48080";
  if (t.includes("teal") || t.includes("turquoise")) return "#2D8080";
  if (t.includes("purple") || t.includes("lavender")) return "#6B4C8B";
  if (t.includes("yellow") || t.includes("gold") || t.includes("mustard")) return "#B8860B";
  return "#8B6914";
}

// Fallback dimensions in inches by furniture type
const FALLBACK_DIMS: Record<string, { w: number; h: number; d: number }> = {
  sofa:  { w: 84, h: 34, d: 36 },
  chair: { w: 30, h: 34, d: 28 },
  table: { w: 48, h: 30, d: 28 },
  desk:  { w: 55, h: 30, d: 28 },
  bed:   { w: 63, h: 22, d: 80 },
  lamp:  { w: 14, h: 63, d: 14 },
  tv:    { w: 55, h: 32, d: 4  },
  rug:   { w: 96, h: 1,  d: 60 },
  plant: { w: 16, h: 32, d: 16 },
  shelf: { w: 36, h: 72, d: 14 },
  other: { w: 24, h: 24, d: 24 },
};

function parseDimensions(text: string): { w?: number; h?: number; d?: number } {
  // Matches: 72"W x 34"D x 28"H  OR  72W x 34D x 28H  OR  72 x 34 x 28 inches
  const m3 = text.match(/(\d+\.?\d*)["\s]*W["\s]*\s*[xX×]\s*(\d+\.?\d*)["\s]*D["\s]*\s*[xX×]\s*(\d+\.?\d*)["\s]*H/i);
  if (m3) return { w: parseFloat(m3[1]), d: parseFloat(m3[2]), h: parseFloat(m3[3]) };

  // Matches: L x W x H with inches
  const m3b = text.match(/(\d+\.?\d*)\s*[xX×]\s*(\d+\.?\d*)\s*[xX×]\s*(\d+\.?\d*)\s*(?:inches|in|")/i);
  if (m3b) return { w: parseFloat(m3b[1]), d: parseFloat(m3b[2]), h: parseFloat(m3b[3]) };

  // Matches: W x D only
  const m2 = text.match(/(\d+\.?\d*)\s*[xX×]\s*(\d+\.?\d*)\s*(?:inches|in|")/i);
  if (m2) return { w: parseFloat(m2[1]), d: parseFloat(m2[2]) };

  return {};
}

export function ItemSidebar() {
  const { setLinkPreview, imageAdjust, setImageAdjust, aiDirection, setAiDirection } = useRoomSession();
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
      const imgRes = await fetch(`${API_URL}/api/fetch-product-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const imgData = await imgRes.json();

      let productName = imgData.title || "";
      if (!productName) {
        try {
          const pathParts = new URL(trimmed).pathname.split("/").filter(Boolean);
          const dpIndex = pathParts.indexOf("dp");
          productName = dpIndex > 0
            ? pathParts[dpIndex - 1].replace(/-/g, " ")
            : pathParts[0]?.replace(/-/g, " ") || "Product";
        } catch { productName = "Product"; }
      }
      productName = productName
        .replace(/\s*[-|]\s*(Amazon\.com|Amazon|Walmart\.com|Target).*$/i, "")
        .trim();

      const type = guessFurnitureType(productName);
      const fb = FALLBACK_DIMS[type] || FALLBACK_DIMS.other;

      // Try to get dimensions: backend first, then parse from title+description
      let width  = imgData.width  ? parseFloat(imgData.width)  : undefined;
      let height = imgData.height ? parseFloat(imgData.height) : undefined;
      let depth  = imgData.depth  ? parseFloat(imgData.depth)  : undefined;

      if (!width || !height) {
        const searchText = `${productName} ${imgData.description || ""} ${imgData.dimensions || ""}`;
        const parsed = parseDimensions(searchText);
        if (parsed.w) width  = parsed.w;
        if (parsed.h) height = parsed.h;
        if (parsed.d) depth  = parsed.d;
      }

      // Fall back to type-based defaults if still nothing
      width  = width  ?? fb.w;
      height = height ?? fb.h;
      depth  = depth  ?? fb.d;

      setLinkPreview({
        url: trimmed,
        kind: isAirbnb ? "airbnb" : "product",
        title: productName,
        price: imgData.price || "",
        image: imgData.image || "",
        type,
        color: guessColor(productName),
        width,
        height,
        depth,
      });
      setUrl("");
    } catch {
      setError("Couldn't fetch that. Check the URL and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-card/40 p-4 lg:flex overflow-y-auto">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Add by link</div>
        <form onSubmit={submitLink} className="mt-2 flex flex-col gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-2">
            <LinkIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Amazon link…"
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
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
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Image adjustments</div>
        <div className="mt-3 flex flex-col gap-3">
          <SliderRow icon={<Sun className="h-3.5 w-3.5" />} label="Brightness" value={imageAdjust.brightness} min={50} max={150} unit="%" onChange={(v) => setImageAdjust({ ...imageAdjust, brightness: v })} />
          <SliderRow icon={<RotateCw className="h-3.5 w-3.5" />} label="Rotation" value={imageAdjust.rotation} min={-15} max={15} unit="°" onChange={(v) => setImageAdjust({ ...imageAdjust, rotation: v })} />
          <SliderRow icon={<Mountain className="h-3.5 w-3.5" />} label="Elevation" value={imageAdjust.elevation} min={-20} max={20} unit="" onChange={(v) => setImageAdjust({ ...imageAdjust, elevation: v })} />
        </div>
      </div>

      <div className="mt-6">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">AI direction</div>
        <div className="mt-3 flex flex-col gap-2">
          <FieldRow label="Wall colour" value={aiDirection.wallColour} onChange={(v) => setAiDirection({ ...aiDirection, wallColour: v })} placeholder="warm beige" />
          <FieldRow label="Wall material" value={aiDirection.wallMaterial} onChange={(v) => setAiDirection({ ...aiDirection, wallMaterial: v })} placeholder="lime plaster" />
          <FieldRow label="Floor colour" value={aiDirection.floorColour} onChange={(v) => setAiDirection({ ...aiDirection, floorColour: v })} placeholder="natural oak" />
          <FieldRow label="Floor material" value={aiDirection.floorMaterial} onChange={(v) => setAiDirection({ ...aiDirection, floorMaterial: v })} placeholder="wide-plank wood" />
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
        className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:border-foreground/40" />
    </label>
  );
}