import { useState, useRef, useEffect } from "react";
import { Send, Sparkles } from "lucide-react";
import { useRoomSession } from "@/lib/room-session";

const API_URL = "https://roomly-backend-seven.vercel.app";

const SUGGESTIONS = [
  "Remove the coffee table",
  "Add a round white marble coffee table",
  "Make it feel like a Tokyo apartment",
];

export function ChatPanel() {
  const { messages, pushMessage, setGeneratedImage } = useRoomSession();
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const raw = sessionStorage.getItem("roomData");
  const roomData = raw ? JSON.parse(raw) : null;
  const firstRoom = roomData?.rooms?.[0];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isThinking]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    pushMessage({ id: `u-${Date.now()}`, role: "user", content: trimmed });
    setInput("");
    setIsThinking(true);

    try {
      // Step 1: get text suggestions + 3D changes
      const chatRes = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          roomName: firstRoom?.name || "Living Room",
          roomType: firstRoom?.type || "living",
          currentFurniture: [],
        }),
      });
      const chatData = await chatRes.json();
      pushMessage({
        id: `a-${Date.now()}`,
        role: "assistant",
        content: chatData.reply || "Let me help with that…",
      });

      // Step 2: generate a visual room image
      const imgRes = await fetch(`${API_URL}/api/generate-room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomName: firstRoom?.name || "Living Room",
          roomType: firstRoom?.type || "living",
          style: chatData.changes?.mood,
          wallColor: chatData.changes?.wallColor,
          changes: trimmed,
        }),
      });
      const imgData = await imgRes.json();
      if (imgData.image) {
        setGeneratedImage(imgData.image);
      }
    } catch {
      pushMessage({
        id: `a-${Date.now()}`,
        role: "assistant",
        content: "Something went wrong. Check your API key is set in Vercel.",
      });
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <aside className="hidden h-full w-full flex-col bg-card/40 lg:flex">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3">
        <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Talk to your room
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {messages.map((m) => (
          <div key={m.id} className={`animate-fade-in-up flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
              m.role === "user" ? "bg-foreground text-background" : "bg-card text-foreground border border-border"
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex items-center gap-1.5 rounded-2xl border border-border bg-card px-3.5 py-2.5 text-sm w-fit">
            <Dot delay="0ms" /><Dot delay="150ms" /><Dot delay="300ms" />
          </div>
        )}
      </div>

      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-1.5 border-t border-border px-5 py-3">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => send(s)}
              className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition">
              {s}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="flex items-center gap-2 border-t border-border bg-card px-3 py-3">
        <input value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your room…"
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

