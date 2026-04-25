import { useRoomSession } from "@/lib/room-session";
import roomMain from "@/assets/room-main.jpg";

export function HistoryStrip() {
  const { versions, currentVersionId, setCurrentVersionId } = useRoomSession();

  return (
    <div className="flex items-center gap-2 overflow-x-auto px-4 py-3">
      <span className="shrink-0 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        History
      </span>
      <div className="flex items-center gap-2">
        {versions.map((v, i) => {
          const active = v.id === currentVersionId;
          return (
            <button
              key={v.id}
              onClick={() => setCurrentVersionId(v.id)}
              className={`group relative shrink-0 overflow-hidden rounded-md border transition-all ${
                active
                  ? "border-foreground shadow-[var(--shadow-soft)]"
                  : "border-border opacity-70 hover:opacity-100"
              }`}
              title={v.label}
            >
              <div className="relative h-12 w-20">
                <img src={roomMain} alt={v.label} className="h-full w-full object-cover" style={{ filter: v.filter }} />
                {v.styleTint && (
                  <div className="absolute inset-0" style={{ background: v.styleTint, mixBlendMode: "multiply" }} />
                )}
              </div>
              <div className="absolute bottom-0 left-0 right-0 truncate bg-foreground/70 px-1 py-0.5 text-[9px] text-background">
                {i === 0 ? "Original" : v.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
