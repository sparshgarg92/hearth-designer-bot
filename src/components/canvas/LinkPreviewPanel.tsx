import { ExternalLink, Image as ImageIcon } from "lucide-react";
import { useRoomSession } from "@/lib/room-session";

export function LinkPreviewPanel() {
  const { linkPreview } = useRoomSession();

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-card/30 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Preview
        </span>
        {linkPreview && (
          <a
            href={linkPreview.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
          >
            Open <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {linkPreview ? (
        <div className="mt-3 flex min-h-0 flex-1 flex-col gap-3">
          <div className="relative flex-1 overflow-hidden rounded-xl border border-border bg-background">
            <img
              src={linkPreview.image}
              alt={linkPreview.title}
              className="h-full w-full object-cover"
            />
            <span className="absolute left-2 top-2 rounded-full bg-card/90 px-2 py-0.5 text-[10px] uppercase tracking-wider backdrop-blur">
              {linkPreview.kind}
            </span>
          </div>
          <div>
            <div className="truncate font-serif text-base">{linkPreview.title}</div>
            <div className="truncate text-xs text-muted-foreground">
              {linkPreview.url}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border p-6 text-center">
          <ImageIcon className="h-5 w-5 text-muted-foreground" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Paste an Amazon product or Airbnb listing on the left to preview it
            here.
          </p>
        </div>
      )}
    </div>
  );
}
