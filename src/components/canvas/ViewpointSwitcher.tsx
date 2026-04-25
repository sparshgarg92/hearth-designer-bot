import { useRoomSession, VIEWPOINTS } from "@/lib/room-session";

export function ViewpointSwitcher() {
  const { currentViewpointId, setCurrentViewpointId } = useRoomSession();
  return (
    <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
      <span className="shrink-0 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        Viewpoints
      </span>
      <div className="flex gap-1.5">
        {VIEWPOINTS.map((vp) => {
          const active = vp.id === currentViewpointId;
          return (
            <button
              key={vp.id}
              onClick={() => setCurrentViewpointId(vp.id)}
              className={`overflow-hidden rounded-md border transition-all ${
                active
                  ? "border-foreground shadow-[var(--shadow-soft)] scale-105"
                  : "border-border opacity-70 hover:opacity-100"
              }`}
              title={vp.label}
            >
              <img src={vp.image} alt={vp.label} className="h-10 w-16 object-cover" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
