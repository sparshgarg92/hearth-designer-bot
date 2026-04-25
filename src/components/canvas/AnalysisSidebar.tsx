import { Thermometer, Wifi, AudioLines, X } from "lucide-react";
import { useRoomSession, type AnalysisMode } from "@/lib/room-session";

const MODES: { id: Exclude<AnalysisMode, null>; label: string; icon: React.ReactNode; blurb: string }[] = [
  {
    id: "thermal",
    label: "Thermal / HVAC Modeling",
    icon: <Thermometer className="h-4 w-4" />,
    blurb: "Simulate heat flow, sun exposure and HVAC efficiency across the room.",
  },
  {
    id: "wifi",
    label: "WiFi Dead Zone Prediction",
    icon: <Wifi className="h-4 w-4" />,
    blurb: "Predict signal strength based on walls, materials and router placement.",
  },
  {
    id: "acoustic",
    label: "Acoustic Simulation",
    icon: <AudioLines className="h-4 w-4" />,
    blurb: "Model reverb, echo and sound absorption from surfaces and furniture.",
  },
];

export function AnalysisSidebar() {
  const { analysisMode, setAnalysisMode, setAnalysisOpen } = useRoomSession();

  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r border-border bg-card/40 p-4 lg:flex overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          In-depth analysis
        </div>
        <button
          onClick={() => setAnalysisOpen(false)}
          className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          aria-label="Close analysis"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {MODES.map((m) => {
          const active = analysisMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setAnalysisMode(active ? null : m.id)}
              className={`flex flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left transition ${
                active
                  ? "border-foreground/40 bg-foreground text-background shadow-[var(--shadow-soft)]"
                  : "border-border bg-background hover:border-foreground/20"
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                {m.icon}
                {m.label}
              </span>
              <span
                className={`text-[11px] leading-snug ${
                  active ? "text-background/70" : "text-muted-foreground"
                }`}
              >
                {m.blurb}
              </span>
            </button>
          );
        })}
      </div>

      {analysisMode && (
        <div className="mt-5 rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
          Running <span className="text-foreground">{MODES.find((x) => x.id === analysisMode)?.label}</span>…
          overlay rendered on the room view.
        </div>
      )}
    </aside>
  );
}
