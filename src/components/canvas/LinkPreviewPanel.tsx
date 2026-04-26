import { ExternalLink, ImageIcon, Plus } from "lucide-react";
import { useRoomSession } from "@/lib/room-session";

interface Props {
  onAddToCanvas: () => void;
}

export function LinkPreviewPanel({ onAddToCanvas }: Props) {
  const { linkPreview, setLinkPreview } = useRoomSession();

  const handleAdd = () => {
    onAddToCanvas();
    // re-trigger RoomStage placement by toggling linkPreview
    const saved = { ...linkPreview } as any;
    setLinkPreview(null);
    setTimeout(() => setLinkPreview(saved), 50);
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Preview</span>
        {linkPreview && (
          <a href={linkPreview.url} target="_blank" rel="noreferrer"
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
            Open <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {linkPreview ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="relative min-h-0 flex-1 overflow-hidden bg-white">
            {linkPreview.image ? (
              <img src={linkPreview.image} alt={linkPreview.title}
                className="h-full w-full object-contain p-4"
                onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/400x300/f5f0e8/2d2416?text=Product"; }} />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No image available</div>
            )}
            <span className="absolute left-2 top-2 rounded-full bg-black/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-black/60">
              {linkPreview.kind}
            </span>
          </div>
          <div className="shrink-0 border-t border-border bg-card/60 px-4 py-3">
            <div className="line-clamp-2 text-sm font-medium leading-snug">{linkPreview.title}</div>
            {(linkPreview as any).price && (
              <div className="mt-0.5 text-xs text-muted-foreground">{(linkPreview as any).price}</div>
            )}
            <button onClick={handleAdd}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-foreground px-3 py-2.5 text-xs font-medium text-background transition hover:scale-[1.01]">
              <Plus className="h-3.5 w-3.5" /> Add to canvas
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <div className="rounded-xl border border-dashed border-border p-6">
            <ImageIcon className="mx-auto h-7 w-7 text-muted-foreground/40" />
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Paste an Amazon link on the left to preview it here.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
