import type { ChatMessage, EditVersion } from "./room-session";

export type ScriptedResult = {
  reply: string;
  productCard?: ChatMessage["productCard"];
  versionPatch?: Partial<EditVersion> & { label: string };
  removeItemIds?: string[];
  addItemLabel?: string;
};

// Lightweight pattern-matching "AI" — believable for a prototype demo.
export function scriptedRespond(input: string): ScriptedResult {
  const text = input.toLowerCase().trim();

  // Amazon / product link
  const urlMatch = input.match(/https?:\/\/\S+/);
  if (urlMatch) {
    return {
      reply:
        "I found this: **Article Timber Sofa in Cream**, $1,299. Placing it in your room now — matching the scale and lighting of the space.",
      productCard: {
        title: "Article Timber Sofa — Cream",
        price: "$1,299",
        image:
          "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80",
      },
      versionPatch: { label: "Added Article Timber Sofa" },
      removeItemIds: ["sofa"],
      addItemLabel: "Article Timber Sofa",
    };
  }

  // Style direction
  if (/(tokyo|japanese|japandi|minimal.*dark|darker tones|moody)/.test(text)) {
    return {
      reply:
        "Reinterpreting the whole room — keeping the layout and bones, but shifting toward a Tokyo apartment feel: deeper walnut tones, lower-profile furniture, a quieter palette.",
      versionPatch: {
        label: "Tokyo apartment style",
        filter: "saturate(0.85) brightness(0.82) contrast(1.05) hue-rotate(-8deg)",
        styleTint: "rgba(40, 30, 25, 0.18)",
        styleLabel: "Tokyo / minimal dark",
      },
    };
  }
  if (/(scandi|nordic|bright|airy)/.test(text)) {
    return {
      reply:
        "Pulling the room toward a brighter Scandinavian palette — lighter woods, more white, soft daylight.",
      versionPatch: {
        label: "Brighter Scandinavian",
        filter: "brightness(1.08) saturate(0.95)",
        styleTint: "rgba(255, 250, 240, 0.1)",
        styleLabel: "Scandinavian",
      },
    };
  }
  if (/(boho|warm|terracotta|earthy)/.test(text)) {
    return {
      reply:
        "Warming things up — earthier tones, terracotta accents, a softer, more lived-in feel.",
      versionPatch: {
        label: "Warm / earthy",
        filter: "saturate(1.15) brightness(0.98) hue-rotate(8deg)",
        styleTint: "rgba(180, 100, 60, 0.12)",
        styleLabel: "Warm earthy",
      },
    };
  }

  // Remove
  const removeMatch = text.match(/remove (?:the )?(\w[\w ]*?)(?:\.|$|,| from)/);
  if (removeMatch || /^(get rid of|delete|take out)/.test(text)) {
    const label = removeMatch?.[1] || text.replace(/^(get rid of|delete|take out)\s*(the )?/, "");
    const target = label.trim();
    return {
      reply: `Got it — removing the ${target} and filling in the floor naturally.`,
      versionPatch: { label: `Removed ${target}` },
      removeItemIds: [matchItemId(target)].filter(Boolean) as string[],
    };
  }

  // Add (description)
  if (/^(add|place|put)/.test(text)) {
    const cleaned = input.replace(/^(add|place|put)\s*(a |an )?/i, "").replace(/\.$/, "");
    if (/marble|coffee table|round table/.test(text)) {
      return {
        reply: `Adding a ${cleaned}. Matching scale and your room's natural light — should look like it belongs.`,
        versionPatch: { label: `Added ${cleaned}` },
        addItemLabel: capitalize(cleaned),
      };
    }
    return {
      reply: `Placing a ${cleaned} in the room. Want a specific finish or size?`,
      versionPatch: { label: `Added ${cleaned}` },
      addItemLabel: capitalize(cleaned),
    };
  }

  // Specs follow-up
  if (/(white marble|medium|small|large|brass|black|white|cream|walnut|oak)/.test(text)) {
    return {
      reply: "Updating with that finish — re-rendering at the right scale now.",
      versionPatch: { label: `Refined: ${input}` },
    };
  }

  return {
    reply:
      "I can remove or add items, drop in something from a product link, or restyle the whole room. What do you want to try?",
  };
}

function matchItemId(label: string): string | null {
  const l = label.toLowerCase();
  if (l.includes("coffee") || l.includes("table")) return "coffee-table";
  if (l.includes("sofa") || l.includes("couch")) return "sofa";
  if (l.includes("lamp")) return "floor-lamp";
  if (l.includes("plant")) return "plant";
  if (l.includes("window")) return "window";
  return null;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
