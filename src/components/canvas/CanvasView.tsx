import { Link } from "@tanstack/react-router";
import { Share2, ArrowLeft, Microscope } from "lucide-react";
import { useMemo, useState } from "react";
import { useRoomSession, VIEWPOINTS } from "@/lib/room-session";
import { RoomStage } from "./RoomStage";
import { ItemSidebar } from "./ItemSidebar";
import { AnalysisSidebar } from "./AnalysisSidebar";
import { ChatPanel } from "./ChatPanel";
import { ViewpointSwitcher } from "./ViewpointSwitcher";
import { LinkPreviewPanel } from "./LinkPreviewPanel";

export function CanvasView() {
  const { versions, currentVersionId, analysisOpen, setAnalysisOpen } = useRoomSession();
  const [shareOpen, setShareOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [placedItems, setPlacedItems] = useState<{ title: string; price: string; image: string }[]>([]);

  const { linkPreview } = useRoomSession();

  const currentVersion = useMemo(
    () => versions.find((v) => v.id === currentVersionId) ?? versions[0],
    [versions, currentVersionId],
  );

  const handleAddToCanvas = () => {
    if (!linkPreview) return;
    setPlacedItems((prev) => [
      ...prev,
      {
        title: linkPreview.title,
        price: (linkPreview as any).price || "",
        image: linkPreview.image || "",
      },
    ]);
  };

  return (
    <main className="flex h-screen flex-col overflow-hidden">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/60 px-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="h-5 w-px bg-border" />
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-foreground" />
            <span className="font-serif text-sm tracking-tight">Living room</span>
            <span className="text-xs text-muted-foreground">· {currentVersion.label}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAnalysisOpen(!analysisOpen)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
              analysisOpen
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            <Microscope className="h-3.5 w-3.5" /> In-depth analysis
          </button>
          <button
            onClick={() => setShareOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-1.5 text-xs text-background shadow-[var(--shadow-soft)] transition hover:scale-[1.02]"
          >
            <Share2 className="h-3.5 w-3.5" /> Share
          </button>
        </div>
      </header>

      {/* 3-col layout */}
      <div className="flex min-h-0 flex-1">
        {/* Left sidebar */}
        {analysisOpen ? <AnalysisSidebar /> : <ItemSidebar />}

        {/* Center canvas */}
        <section className="flex min-w-0 flex-1 flex-col">
          <div className="relative flex-1 overflow-hidden p-3">
            <RoomStage
              selectedRoomId={selectedRoomId}
              onRoomSelect={setSelectedRoomId}
              onItemPlaced={handleAddToCanvas}
            />
          </div>
          <div className="shrink-0 border-t border-border bg-card/60 backdrop-blur">
            <ViewpointSwitcher
              selectedRoomId={selectedRoomId}
              onSelect={setSelectedRoomId}
            />
            {/* Items Added strip */}
            <div className="flex items-center gap-3 overflow-x-auto px-4 py-2.5 min-h-[56px]">
              <span className="shrink-0 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Items Added
              </span>
              {placedItems.length === 0 ? (
                <span className="text-xs text-muted-foreground/50">No items yet — paste an Amazon link and click Add to canvas</span>
              ) : (
                placedItems.map((item, i) => (
                  <div key={i} className="flex shrink-0 items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5">
                    {item.image && (
                      <img src={item.image} alt={item.title} className="h-8 w-8 rounded object-contain bg-white" />
                    )}
                    <div className="flex flex-col">
                      <span className="max-w-[140px] truncate text-[11px] font-medium">{item.title}</span>
                      {item.price && <span className="text-[10px] text-muted-foreground">{item.price}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Right column */}
        <aside className="hidden w-[420px] shrink-0 flex-col border-l border-border lg:flex">
          <div className="min-h-0 border-b border-border" style={{ height: "65%" }}>
            <LinkPreviewPanel onAddToCanvas={handleAddToCanvas} />
          </div>
          <div className="min-h-0" style={{ height: "40%" }}>
            <ChatPanel />
          </div>
        </aside>
      </div>

      {shareOpen && <ShareModal onClose={() => setShareOpen(false)} />}
    </main>
  );
}

function ShareModal({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const link = `${typeof window !== "undefined" ? window.location.origin : ""}/share/r-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm" onClick={onClose}>
      <div className="animate-scale-in w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-elevated)]" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-serif text-2xl tracking-tight">Share this room</h3>
        <p className="mt-1 text-sm text-muted-foreground">Anyone with the link can navigate the space and shop the furniture.</p>
        <div className="mt-5 flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2">
          <span className="flex-1 truncate text-sm text-muted-foreground">{link}</span>
          <button onClick={() => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            className="rounded-md bg-foreground px-3 py-1.5 text-xs text-background">
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <button onClick={onClose} className="mt-5 w-full rounded-lg border border-border py-2 text-sm hover:bg-secondary">Done</button>
      </div>
    </div>
  );
}

export { VIEWPOINTS };
