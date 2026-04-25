import { useMemo } from "react";
import { useRoomSession, VIEWPOINTS, INITIAL_ITEMS } from "@/lib/room-session";

export function RoomStage() {
  const {
    versions,
    currentVersionId,
    currentViewpointId,
    highlightedItemId,
    items,
    imageAdjust,
  } = useRoomSession();

  const version = useMemo(
    () => versions.find((v) => v.id === currentVersionId) ?? versions[0],
    [versions, currentVersionId],
  );
  const viewpoint = VIEWPOINTS.find((v) => v.id === currentViewpointId) ?? VIEWPOINTS[0];

  // Find highlighted item position on initial map
  const hl = INITIAL_ITEMS.find((i) => i.id === highlightedItemId);
  const itemRemoved = highlightedItemId && !items.find((i) => i.id === highlightedItemId);

  const composedFilter = [
    version.filter,
    `brightness(${imageAdjust.brightness}%)`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-elevated)]">
      <img
        key={viewpoint.id + currentVersionId}
        src={viewpoint.image}
        alt="Your room"
        className="animate-fade-in h-full w-full object-cover transition-all duration-500"
        style={{
          filter: composedFilter,
          transform: `rotate(${imageAdjust.rotation}deg) translateY(${-imageAdjust.elevation}px) scale(${1 + Math.abs(imageAdjust.rotation) * 0.01})`,
          transformOrigin: "center",
        }}
      />

      {/* Style tint overlay */}
      {version.styleTint && (
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-500"
          style={{ background: version.styleTint, mixBlendMode: "multiply" }}
        />
      )}

      {/* Highlight ring on detected item */}
      {hl && currentViewpointId === "main" && !itemRemoved && (
        <div
          className="animate-scale-in pointer-events-none absolute"
          style={{ left: `${hl.x}%`, top: `${hl.y}%`, transform: "translate(-50%, -50%)" }}
        >
          <div
            className="h-24 w-24 rounded-full"
            style={{
              boxShadow:
                "0 0 0 2px oklch(0.985 0.005 80), 0 0 0 4px oklch(0.28 0.012 60), 0 0 60px 10px oklch(1 0 0 / 0.4)",
            }}
          />
          <div className="mt-2 -translate-x-1/2 rounded-full bg-foreground px-3 py-1 text-xs text-background">
            {hl.label}
          </div>
        </div>
      )}

      {/* Style label badge */}
      {version.styleLabel && (
        <div className="absolute left-4 top-4 rounded-full bg-card/90 px-3 py-1 text-xs backdrop-blur">
          {version.styleLabel}
        </div>
      )}

      {/* Viewpoint label */}
      <div className="absolute right-4 top-4 rounded-full bg-card/90 px-3 py-1 text-xs backdrop-blur">
        {viewpoint.label}
      </div>
    </div>
  );
}
