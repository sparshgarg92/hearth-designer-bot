import { useRoomSession } from "@/lib/room-session";
import { ROOM_LIST } from "./RoomStage";

interface Props {
  selectedRoomId: string | null;
  onSelect: (id: string | null) => void;
}

export function ViewpointSwitcher({ selectedRoomId, onSelect }: Props) {
  return (
    <div className="flex items-center gap-2 border-b border-border px-4 py-2.5 overflow-x-auto">
      <span className="shrink-0 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Rooms</span>
      <div className="flex gap-1.5">
        <button
          onClick={() => onSelect(null)}
          className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all ${
            selectedRoomId === null
              ? "border-foreground bg-foreground text-background shadow"
              : "border-border bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          Overview
        </button>
        {ROOM_LIST.map((room) => (
          <button
            key={room.id}
            onClick={() => onSelect(room.id)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all ${
              selectedRoomId === room.id
                ? "border-foreground bg-foreground text-background shadow"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {room.name}
          </button>
        ))}
      </div>
    </div>
  );
}