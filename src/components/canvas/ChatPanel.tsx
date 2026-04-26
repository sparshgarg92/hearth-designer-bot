import { useState, useRef, useEffect } from "react";
import { Send, Brain } from "lucide-react";
import { useRoomSession } from "@/lib/room-session";

const K2_URL = "https://api.k2think.ai/v1/chat/completions";
const K2_KEY = import.meta.env.VITE_K2_API_KEY;

export function ChatPanel() {
  const { messages, pushMessage, setAnalysisMode, setSimScores } = useRoomSession();
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isThinking]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    pushMessage({ id: `u-${Date.now()}`, role: "user", content: trimmed });
    setInput("");
    setIsThinking(true);

    const systemPrompt = `You are an expert AI architect analyzing a floor plan with these rooms:
- Living Room (2.49m x 1.98m)
- Kitchen (2.49m x 1.6m)
- Bed Room (2.44m x 2.44m)
- Toilet (1.42m x 1.14m)
- Shop 1 (2.49m x 1.83m)
- Shop 2 (2.44m x 1.83m)
- Sitout (1.68m x 3.2m)

Respond ONLY with raw JSON, no markdown, no thinking tags:
{"reply":"2-3 sentences with specific numbers","scores":{"thermal":[{"roomId":"living","score":70,"label":"23C","detail":"explanation"},{"roomId":"kitchen","score":85,"label":"27C","detail":"explanation"},{"roomId":"bedroom","score":60,"label":"21C","detail":"explanation"},{"roomId":"toilet","score":75,"label":"24C","detail":"explanation"},{"roomId":"shop1","score":70,"label":"23C","detail":"explanation"},{"roomId":"shop2","score":70,"label":"23C","detail":"explanation"},{"roomId":"sitout","score":60,"label":"21C","detail":"explanation"}],"wifi":[{"roomId":"living","score":98,"label":"-35dBm","detail":"explanation"},{"roomId":"kitchen","score":75,"label":"-55dBm","detail":"explanation"},{"roomId":"bedroom","score":55,"label":"-68dBm","detail":"explanation"},{"roomId":"toilet","score":45,"label":"-75dBm","detail":"explanation"},{"roomId":"shop1","score":40,"label":"-78dBm","detail":"explanation"},{"roomId":"shop2","score":30,"label":"-85dBm","detail":"explanation"},{"roomId":"sitout","score":85,"label":"-45dBm","detail":"explanation"}],"acoustic":[{"roomId":"living","score":45,"label":"0.4s RT60","detail":"explanation"},{"roomId":"kitchen","score":70,"label":"0.8s RT60","detail":"explanation"},{"roomId":"bedroom","score":40,"label":"0.35s RT60","detail":"explanation"},{"roomId":"toilet","score":85,"label":"1.2s RT60","detail":"explanation"},{"roomId":"shop1","score":60,"label":"0.65s RT60","detail":"explanation"},{"roomId":"shop2","score":60,"label":"0.65s RT60","detail":"explanation"},{"roomId":"sitout","score":35,"label":"0.3s RT60","detail":"explanation"}]},"activateMode":null}`;

    try {
      const res = await fetch(K2_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${K2_KEY}`,
        },
        body: JSON.stringify({
          model: "MBZUAI-IFM/K2-Think-v2",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages
              .filter((m) => m.role === "user" || m.role === "assistant")
              .map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: trimmed },
          ],
          stream: false,
        }),
      });

      const data = await res.json();
      let raw = data.choices?.[0]?.message?.content || "{}";
      raw = raw.replace(/<think>[\s\S]*?<\/think>/g, "").replace(/[\s\S]*?<\/think>/g, "").trim();
      raw = raw.replace(/```json|```/g, "").trim();
      const jsonStart = raw.indexOf("{");
      const jsonEnd = raw.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1) raw = raw.slice(jsonStart, jsonEnd + 1);

      let parsed: any = {};
      try { parsed = JSON.parse(raw); }
      catch {
        const replyMatch = raw.match(/"reply"\s*:\s*"([^"]+)"/);
        parsed = { reply: replyMatch ? replyMatch[1] : raw.slice(0, 200), scores: null };
      }
      pushMessage({ id: `a-${Date.now()}`, role: "assistant", content: parsed.reply || "Let me help with that..." });
      if (parsed.scores) setSimScores(parsed.scores);
      if (parsed.activateMode) setAnalysisMode(parsed.activateMode);

    } catch {
      pushMessage({ id: `a-${Date.now()}`, role: "assistant", content: "K2 did not respond. Check VITE_K2_API_KEY in .env." });
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <aside className="flex h-full w-full flex-col bg-card/40">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3">
        <Brain className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Talk to your room</span>
        <span className="ml-auto rounded-full border border-border px-2 py-0.5 text-[9px] text-muted-foreground/60">K2 Think V2</span>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {messages.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
              m.role === "user" ? "bg-foreground text-background" : "bg-card text-foreground border border-border"
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3.5 py-2.5 w-fit">
            <Brain className="h-3 w-3 animate-pulse text-muted-foreground" />
            <span className="text-xs text-muted-foreground">K2 is reasoning...</span>
            <Dot delay="0ms" /><Dot delay="150ms" /><Dot delay="300ms" />
          </div>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="flex items-center gap-2 border-t border-border bg-card px-3 py-3">
        <input value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your walls, materials, layout..."
          className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-foreground/40" />
        <button type="submit" disabled={!input.trim() || isThinking}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background disabled:opacity-40 transition hover:scale-105">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </aside>
  );
}

function Dot({ delay }: { delay: string }) {
  return <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground" style={{ animationDelay: delay }} />;
}

