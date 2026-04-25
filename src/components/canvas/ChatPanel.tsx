import { useState, useRef, useEffect } from "react";
import { Send, Sparkles } from "lucide-react";
import { useRoomSession } from "@/lib/room-session";
import { scriptedRespond } from "@/lib/scripted-ai";

const SUGGESTIONS = [
  "Remove the coffee table",
  "Add a round white marble coffee table",
  "Make it feel like a Tokyo apartment",
];

export function ChatPanel() {
  const {
    messages,
    pushMessage,
    items,
    setItems,
    pushVersion,
    setCurrentVersionId,
    versions,
  } = useRoomSession();
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isThinking]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    pushMessage({ id: `u-${Date.now()}`, role: "user", content: trimmed });
    setInput("");
    setIsThinking(true);

    setTimeout(() => {
      const result = scriptedRespond(trimmed);
      pushMessage({
        id: `a-${Date.now()}`,
        role: "assistant",
        content: result.reply,
        productCard: result.productCard,
      });

      // Apply side-effects
      if (result.removeItemIds?.length) {
        setItems(items.filter((i) => !result.removeItemIds!.includes(i.id)));
      }
      if (result.addItemLabel) {
        setItems([
          ...items.filter((i) => !result.removeItemIds?.includes(i.id)),
          {
            id: `added-${Date.now()}`,
            label: result.addItemLabel,
            x: 48,
            y: 78,
          },
        ]);
      }
      if (result.versionPatch) {
        const id = `v${versions.length}`;
        pushVersion({ id, ...result.versionPatch });
        setCurrentVersionId(id);
      }
      setIsThinking(false);
    }, 1100);
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
          <div
            key={m.id}
            className={`animate-fade-in-up flex flex-col ${
              m.role === "user" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-foreground text-background"
                  : "bg-card text-foreground border border-border"
              }`}
              dangerouslySetInnerHTML={{ __html: renderMarkdownInline(m.content) }}
            />
            {m.productCard && <ProductCard card={m.productCard} />}
          </div>
        ))}
        {isThinking && (
          <div className="flex items-center gap-1.5 rounded-2xl border border-border bg-card px-3.5 py-2.5 text-sm w-fit">
            <Dot delay="0ms" />
            <Dot delay="150ms" />
            <Dot delay="300ms" />
          </div>
        )}
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-1.5 border-t border-border px-5 py-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 border-t border-border bg-card px-3 py-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your room…"
          className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-foreground/40"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background disabled:opacity-40 transition hover:scale-105"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </aside>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground"
      style={{ animationDelay: delay }}
    />
  );
}

function ProductCard({ card }: { card: NonNullable<ReturnType<typeof useRoomSession>["messages"][number]["productCard"]> }) {
  return (
    <div className="animate-scale-in mt-2 flex w-full max-w-[85%] items-center gap-3 rounded-xl border border-border bg-card p-2.5">
      <img src={card.image} alt={card.title} className="h-14 w-14 rounded-lg object-cover" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{card.title}</div>
        <div className="text-xs text-muted-foreground">{card.price}</div>
      </div>
      <button className="rounded-full bg-foreground px-3 py-1.5 text-xs text-background">
        Buy
      </button>
    </div>
  );
}

// Tiny safe markdown for **bold**
function renderMarkdownInline(text: string) {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}
