import { Link } from "@tanstack/react-router";
import { Share2, ArrowLeft, Microscope } from "lucide-react";
import { useMemo, useState } from "react";
import { useRoomSession, VIEWPOINTS } from "@/lib/room-session";
import { RoomStage } from "./RoomStage";
import { ItemSidebar } from "./ItemSidebar";
import { AnalysisSidebar } from "./AnalysisSidebar";
import { ChatPanel } from "./ChatPanel";
import { HistoryStrip } from "./HistoryStrip";
import { ViewpointSwitcher } from "./ViewpointSwitcher";
import { LinkPreviewPanel } from "./LinkPreviewPanel";

export function CanvasView() {
  const { versions, currentVersionId, analysisOpen, setAnalysisOpen } = useRoomSession();
  const [shareOpen, setShareOpen] = useState(false);

  const currentVersion = useMemo(
    () => versions.find((v) => v.id === currentVersionId) ?? versions[0],
    [versions, currentVersionId],
  );

  return (
    <main className="flex h-screen flex-col overflow-hidden">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/60 px-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
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
          <button className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition">
            <Sparkles className="h-3.5 w-3.5" /> {INITIAL_ITEMS.length} items detected
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
        <ItemSidebar />

        <section className="flex min-w-0 flex-1 flex-col">
          <div className="relative flex-1 overflow-hidden p-4 sm:p-6">
            <RoomStage />
          </div>

          {/* Bottom strip: viewpoints + history */}
          <div className="shrink-0 border-t border-border bg-card/60 backdrop-blur">
            <ViewpointSwitcher />
            <HistoryStrip />
          </div>
        </section>

        {/* Right column: top half preview, bottom half chat */}
        <aside className="hidden w-[360px] shrink-0 flex-col border-l border-border lg:flex">
          <div className="h-1/2 min-h-0 border-b border-border">
            <LinkPreviewPanel />
          </div>
          <div className="h-1/2 min-h-0">
            <ChatPanel />
          </div>
        </aside>
      </div>

      {/* Share modal */}
      {shareOpen && <ShareModal onClose={() => setShareOpen(false)} />}
    </main>
  );
}

function ShareModal({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const link = `${typeof window !== "undefined" ? window.location.origin : ""}/share/r-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-scale-in w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-elevated)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-serif text-2xl tracking-tight">Share this room</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Anyone with the link can navigate the space, see your edits, and shop the
          furniture you placed.
        </p>
        <div className="mt-5 flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2">
          <span className="flex-1 truncate text-sm text-muted-foreground">{link}</span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(link);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="rounded-md bg-foreground px-3 py-1.5 text-xs text-background"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <button
          onClick={onClose}
          className="mt-5 w-full rounded-lg border border-border py-2 text-sm hover:bg-secondary"
        >
          Done
        </button>
      </div>
    </div>
  );
}

// Viewpoints helper export to avoid unused warning
export { VIEWPOINTS };
