import { useEffect, useState } from "react";
import { useRoomSession } from "@/lib/room-session";

const TYPE_ICONS: Record<string, string> = {
  living: "🛋️", bedroom: "🛏️", kitchen: "🍳",
  bathroom: "🚿", dining: "🍽️", hallway: "🚪",
  office: "💻", other: "📦",
};

export function ViewpointSwitcher() {
  const { currentViewpointId, setCurrentViewpointId } = useRoomSession();
  const [rooms, setRooms] = useState<any[]>([]);

  useEffect(() => {
    const raw = sessionStorage.getItem("roomData");
    if (raw) setRooms(JSON.parse(raw).rooms || []);
  }, []);

  const views = [
    { id: "overview", name: "Overview", icon: "🏠" },
    ...rooms.map((r) => ({ id: r.id, name: r.name, icon: TYPE_ICONS[r.type] || "📦" })),
  ];

  return (
    <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
      <span className="shrink-0 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        Rooms
      </span>
      <div className="flex gap-1.5 overflow-x-auto">
        {views.map((vp) => {
          const active = vp.id === currentViewpointId;
          return (
            <button key={vp.id} onClick={() => setCurrentViewpointId(vp.id)}
              className={`flex shrink-0 flex-col items-center justify-center gap-0.5 rounded-md border px-3 py-1.5 text-[10px] transition-all ${
                active
                  ? "border-foreground bg-foreground text-background scale-105 shadow-[var(--shadow-soft)]"
                  : "border-border bg-card text-muted-foreground opacity-70 hover:opacity-100"
              }`}>
              <span className="text-base">{vp.icon}</span>
              <span>{vp.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

