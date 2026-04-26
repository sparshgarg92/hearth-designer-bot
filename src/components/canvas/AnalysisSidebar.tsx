import { Thermometer, Wifi, AudioLines, X, Brain } from "lucide-react";
import { useRoomSession, type AnalysisMode, type SimRoomScore } from "@/lib/room-session";

const ROOMS = [
  { id: "living",  name: "Living Room" },
  { id: "kitchen", name: "Kitchen"     },
  { id: "bedroom", name: "Bed Room"    },
  { id: "toilet",  name: "Toilet"      },
  { id: "shop1",   name: "Shop 1"      },
  { id: "shop2",   name: "Shop 2"      },
  { id: "sitout",  name: "Sitout"      },
];

// SVG floor plan proportions (scaled to 300x220 viewBox)
const ROOM_RECTS = [
  { id: "living",  x: 91,  y: 88,  w: 134, h: 107 },
  { id: "kitchen", x: 91,  y: 0,   w: 134, h: 86  },
  { id: "bedroom", x: 225, y: 0,   w: 131, h: 131 },
  { id: "toilet",  x: 225, y: 132, w: 76,  h: 62  },
  { id: "shop1",   x: 91,  y: 195, w: 134, h: 99  },
  { id: "shop2",   x: 225, y: 195, w: 131, h: 99  },
  { id: "sitout",  x: 0,   y: 86,  w: 90,  h: 172 },
];

type ModeConfig = {
  id: Exclude<AnalysisMode, null>;
  label: string;
  icon: React.ReactNode;
  blurb: string;
  lowColor: string;
  highColor: string;
  lowLabel: string;
  highLabel: string;
};

const MODES: ModeConfig[] = [
  {
    id: "thermal",
    label: "Thermal / HVAC",
    icon: <Thermometer className="h-4 w-4" />,
    blurb: "Heat flow, sun exposure and HVAC efficiency.",
    lowColor: "#93C5FD", highColor: "#EF4444",
    lowLabel: "Cool", highLabel: "Hot",
  },
  {
    id: "wifi",
    label: "WiFi Signal",
    icon: <Wifi className="h-4 w-4" />,
    blurb: "Signal strength based on walls and router position.",
    lowColor: "#EF4444", highColor: "#22C55E",
    lowLabel: "Weak", highLabel: "Strong",
  },
  {
    id: "acoustic",
    label: "Acoustics",
    icon: <AudioLines className="h-4 w-4" />,
    blurb: "Reverb and echo based on room surfaces.",
    lowColor: "#22C55E", highColor: "#EF4444",
    lowLabel: "Absorbed", highLabel: "Echo",
  },
];

function scoreToColor(score: number, low: string, high: string): string {
  const t = score / 100;
  const lc = parseInt(low.slice(1), 16);
  const hc = parseInt(high.slice(1), 16);
  const lerp = (a: number, b: number) => Math.round(a + (b - a) * t);
  const r = lerp((lc >> 16) & 0xff, (hc >> 16) & 0xff);
  const g = lerp((lc >> 8) & 0xff, (hc >> 8) & 0xff);
  const b = lerp(lc & 0xff, hc & 0xff);
  return `rgba(${r},${g},${b},0.75)`;
}

export function AnalysisSidebar() {
  const { analysisMode, setAnalysisMode, setAnalysisOpen, simScores } = useRoomSession();

  const activeConfig = MODES.find((m) => m.id === analysisMode) ?? null;
  const activeScores: SimRoomScore[] = activeConfig && simScores
    ? (simScores[activeConfig.id] ?? [])
    : [];

  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r border-border bg-card/40 lg:flex overflow-y-auto">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          In-depth analysis
        </div>
        <button onClick={() => { setAnalysisOpen(false); setAnalysisMode(null); }}
          className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="p-4 flex flex-col gap-2">
        {MODES.map((m) => {
          const active = analysisMode === m.id;
          const hasData = simScores && simScores[m.id]?.length > 0;
          return (
            <button key={m.id} onClick={() => setAnalysisMode(active ? null : m.id)}
              className={`flex flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left transition ${
                active
                  ? "border-foreground/40 bg-foreground text-background shadow-[var(--shadow-soft)]"
                  : "border-border bg-background hover:border-foreground/20"
              }`}>
              <span className="flex items-center gap-2 text-sm font-medium w-full">
                {m.icon} {m.label}
                {hasData && !active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-green-500" />
                )}
              </span>
              <span className={`text-[11px] leading-snug ${active ? "text-background/70" : "text-muted-foreground"}`}>
                {m.blurb}
              </span>
            </button>
          );
        })}

        {!simScores && (
          <div className="mt-2 flex items-start gap-2 rounded-lg border border-dashed border-border p-3">
            <Brain className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground/50" />
            <p className="text-[11px] text-muted-foreground leading-snug">
              Describe your walls or materials in the chat — K2 will compute the simulations automatically.
            </p>
          </div>
        )}
      </div>

      {/* Heatmap — only shows when mode is selected AND K2 has returned scores */}
      {activeConfig && activeScores.length > 0 && (
        <div className="px-4 pb-4 flex flex-col gap-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Floor plan overlay
          </div>

          <div className="rounded-xl border border-border bg-background p-2 overflow-hidden">
            <svg viewBox="0 0 356 294" className="w-full">
              {ROOM_RECTS.map((rect) => {
                const result = activeScores.find((r) => r.roomId === rect.id);
                const score = result?.score ?? 50;
                const color = scoreToColor(score, activeConfig.lowColor, activeConfig.highColor);
                const room = ROOMS.find((r) => r.id === rect.id);
                return (
                  <g key={rect.id}>
                    <rect x={rect.x} y={rect.y} width={rect.w} height={rect.h}
                      fill={color} stroke="white" strokeWidth="1.5" rx="3" />
                    <text x={rect.x + rect.w / 2} y={rect.y + rect.h / 2 - 7}
                      textAnchor="middle" fontSize="7.5" fill="white" fontWeight="600">
                      {room?.name}
                    </text>
                    <text x={rect.x + rect.w / 2} y={rect.y + rect.h / 2 + 7}
                      textAnchor="middle" fontSize="8.5" fill="white" opacity="0.9">
                      {result?.label ?? "…"}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Gradient legend */}
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>{activeConfig.lowLabel}</span>
            <div className="h-2 flex-1 rounded-full" style={{
              background: `linear-gradient(to right, ${activeConfig.lowColor}, ${activeConfig.highColor})`
            }} />
            <span>{activeConfig.highLabel}</span>
          </div>

          {/* Per-room breakdown */}
          <div className="flex flex-col gap-1.5">
            {activeScores.map((r) => {
              const room = ROOMS.find((rm) => rm.id === r.roomId);
              const color = scoreToColor(r.score, activeConfig.lowColor, activeConfig.highColor);
              return (
                <div key={r.roomId} className="flex items-start gap-2 rounded-lg border border-border bg-background px-2.5 py-2">
                  <div className="mt-0.5 h-3 w-3 shrink-0 rounded-sm" style={{ background: color }} />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-medium">
                      {room?.name} <span className="text-muted-foreground font-normal">· {r.label}</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-snug">{r.detail}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mode selected but no scores yet */}
      {analysisMode && activeScores.length === 0 && (
        <div className="mx-4 mb-4 rounded-lg border border-dashed border-border p-3 text-[11px] text-muted-foreground">
          Talk to your room about wall materials or layout — K2 will populate this automatically.
        </div>
      )}
    </aside>
  );
}
