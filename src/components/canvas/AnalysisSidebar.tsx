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

const ROOM_RECTS = [
  { id: "living",  x: 91,  y: 88,  w: 134, h: 107 },
  { id: "kitchen", x: 91,  y: 0,   w: 134, h: 86  },
  { id: "bedroom", x: 225, y: 0,   w: 131, h: 131 },
  { id: "toilet",  x: 225, y: 132, w: 76,  h: 62  },
  { id: "shop1",   x: 91,  y: 195, w: 134, h: 99  },
  { id: "shop2",   x: 225, y: 195, w: 131, h: 99  },
  { id: "sitout",  x: 0,   y: 86,  w: 90,  h: 172 },
];

type ActiveMode = Exclude<AnalysisMode, "none">;

type ModeConfig = {
  id: ActiveMode;
  label: string;
  icon: React.ReactNode;
  blurb: string;
  gradient: [string, string];
  lowLabel: string;
  highLabel: string;
  gradientId: string;
};

const MODES: ModeConfig[] = [
  {
    id: "thermal",
    label: "Thermal / HVAC",
    icon: <Thermometer className="h-4 w-4" />,
    blurb: "Heat flow, sun exposure and HVAC efficiency.",
    gradient: ["#60a5fa", "#ef4444"],
    gradientId: "thermalGrad",
    lowLabel: "Cool", highLabel: "Hot",
  },
  {
    id: "wifi",
    label: "WiFi Signal",
    icon: <Wifi className="h-4 w-4" />,
    blurb: "Signal strength based on walls and router position.",
    gradient: ["#ef4444", "#22c55e"],
    gradientId: "wifiGrad",
    lowLabel: "Weak", highLabel: "Strong",
  },
  {
    id: "acoustic",
    label: "Acoustics",
    icon: <AudioLines className="h-4 w-4" />,
    blurb: "Reverb and echo based on room surfaces.",
    gradient: ["#22c55e", "#ef4444"],
    gradientId: "acousticGrad",
    lowLabel: "Absorbed", highLabel: "Echo",
  },
];

function scoreToRgb(score: number, low: string, high: string): string {
  const t = score / 100;
  const lc = parseInt(low.slice(1), 16);
  const hc = parseInt(high.slice(1), 16);
  const lerp = (a: number, b: number) => Math.round(a + (b - a) * t);
  const r = lerp((lc >> 16) & 0xff, (hc >> 16) & 0xff);
  const g = lerp((lc >> 8) & 0xff, (hc >> 8) & 0xff);
  const b = lerp(lc & 0xff, hc & 0xff);
  return `${r},${g},${b}`;
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
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">In-depth analysis</div>
        <button
          onClick={() => { setAnalysisOpen(false); setAnalysisMode("none"); }}
          className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="p-4 flex flex-col gap-2">
        {MODES.map((m) => {
          const active = analysisMode === m.id;
          const hasData = simScores && simScores[m.id]?.length > 0;
          return (
            <button key={m.id} onClick={() => setAnalysisMode(active ? "none" : m.id)}
              className={`flex flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-left transition-all ${
                active
                  ? "border-foreground/40 bg-foreground text-background shadow-lg scale-[1.01]"
                  : "border-border bg-background hover:border-foreground/20 hover:shadow-sm"
              }`}>
              <span className="flex items-center gap-2 text-sm font-medium w-full">
                {m.icon} {m.label}
                {hasData && !active && (
                  <span className="ml-auto flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </span>
                )}
              </span>
              <span className={`text-[11px] leading-snug ${active ? "text-background/70" : "text-muted-foreground"}`}>
                {m.blurb}
              </span>
            </button>
          );
        })}

        {!simScores && (
          <div className="mt-2 flex items-start gap-2 rounded-xl border border-dashed border-border p-3">
            <Brain className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground/50" />
            <p className="text-[11px] text-muted-foreground leading-snug">
              Describe your walls or materials in the chat — K2 will compute the simulations automatically.
            </p>
          </div>
        )}
      </div>

      {activeConfig && activeScores.length > 0 && (
        <div className="px-4 pb-4 flex flex-col gap-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Floor plan overlay</div>

          <div className="rounded-xl border border-border bg-background overflow-hidden shadow-inner">
            <svg viewBox="-4 -4 364 302" className="w-full">
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                {ROOM_RECTS.map((rect) => {
                  const result = activeScores.find((r) => r.roomId === rect.id);
                  const score = result?.score ?? 50;
                  const rgb = scoreToRgb(score, activeConfig.gradient[0], activeConfig.gradient[1]);
                  return (
                    <radialGradient key={rect.id} id={`rg-${rect.id}`} cx="50%" cy="40%" r="60%">
                      <stop offset="0%" stopColor={`rgb(${rgb})`} stopOpacity="1" />
                      <stop offset="100%" stopColor={`rgb(${rgb})`} stopOpacity="0.7" />
                    </radialGradient>
                  );
                })}
              </defs>

              {ROOM_RECTS.map((rect) => {
                const result = activeScores.find((r) => r.roomId === rect.id);
                const score = result?.score ?? 50;
                const rgb = scoreToRgb(score, activeConfig.gradient[0], activeConfig.gradient[1]);
                const room = ROOMS.find((r) => r.id === rect.id);
                return (
                  <g key={rect.id}>
                    <rect x={rect.x} y={rect.y} width={rect.w} height={rect.h}
                      fill={`rgb(${rgb})`} opacity="0.3" rx="6" filter="url(#glow)" />
                    <rect x={rect.x + 1} y={rect.y + 1} width={rect.w - 2} height={rect.h - 2}
                      fill={`url(#rg-${rect.id})`} rx="5" />
                    <rect x={rect.x} y={rect.y} width={rect.w} height={rect.h}
                      fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" rx="6" />
                    <text x={rect.x + rect.w / 2} y={rect.y + rect.h / 2 - 8}
                      textAnchor="middle" fontSize="7" fill="white" fontWeight="700">
                      {room?.name}
                    </text>
                    <text x={rect.x + rect.w / 2} y={rect.y + rect.h / 2 + 7}
                      textAnchor="middle" fontSize="9" fill="white" fontWeight="600" opacity="0.95">
                      {result?.label ?? "…"}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="font-medium">{activeConfig.lowLabel}</span>
            <div className="h-2 flex-1 rounded-full shadow-inner" style={{
              background: `linear-gradient(to right, ${activeConfig.gradient[0]}, ${activeConfig.gradient[1]})`
            }} />
            <span className="font-medium">{activeConfig.highLabel}</span>
          </div>

          <div className="flex flex-col gap-1.5">
            {activeScores.map((r) => {
              const room = ROOMS.find((rm) => rm.id === r.roomId);
              const rgb = scoreToRgb(r.score, activeConfig.gradient[0], activeConfig.gradient[1]);
              const color = `rgb(${rgb})`;
              return (
                <div key={r.roomId} className="rounded-xl border border-border bg-background px-3 py-2.5 shadow-sm">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold">{room?.name}</span>
                    <span className="text-[11px] font-mono font-medium" style={{ color }}>{r.label}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-border overflow-hidden mb-1.5">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${r.score}%`, background: color }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-snug">{r.detail}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {analysisMode !== "none" && activeScores.length === 0 && (
        <div className="mx-4 mb-4 rounded-xl border border-dashed border-border p-3 text-[11px] text-muted-foreground">
          Talk to your room about wall materials or layout — K2 will populate this automatically.
        </div>
      )}
    </aside>
  );
}
