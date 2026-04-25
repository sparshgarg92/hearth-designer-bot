import { useRoomSession } from "@/lib/room-session";

export function ItemSidebar() {
  const { items, highlightedItemId, setHighlightedItemId } = useRoomSession();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card/40 p-4 lg:flex">
      <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        In this room
      </div>
      <div className="mt-3 flex flex-1 flex-col gap-1.5 overflow-y-auto">
        {items.map((item) => {
          const active = item.id === highlightedItemId;
          return (
            <button
              key={item.id}
              onMouseEnter={() => setHighlightedItemId(item.id)}
              onMouseLeave={() => setHighlightedItemId(null)}
              onClick={() =>
                setHighlightedItemId(active ? null : item.id)
              }
              className={`group flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-sm transition-all ${
                active
                  ? "border-foreground/20 bg-card shadow-[var(--shadow-soft)]"
                  : "border-transparent hover:border-border hover:bg-card"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full transition ${
                  active ? "bg-foreground" : "bg-muted-foreground/40"
                }`}
              />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
        {items.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            Empty room — add something via chat.
          </div>
        )}
      </div>
      <div className="mt-3 rounded-lg bg-secondary p-3 text-[11px] leading-relaxed text-muted-foreground">
        Tap any item to highlight it in the room. Ask me to remove or replace it.
      </div>
    </aside>
  );
}
