import { createContext, useContext, useState, type ReactNode } from "react";
import roomMain from "@/assets/room-main.jpg";
import roomDoorway from "@/assets/room-doorway.jpg";
import roomCorner from "@/assets/room-corner.jpg";

export type DetectedItem = {
  id: string; label: string; x: number; y: number;
};

export type ChatMessage = {
  id: string; role: "assistant" | "user"; content: string;
  productCard?: { title: string; price: string; image: string; };
};

export type Viewpoint = { id: string; label: string; image: string; };

export type EditVersion = {
  id: string; label: string; filter?: string;
  removed?: string[]; added?: { label: string; description: string }[];
  styleTint?: string; styleLabel?: string;
};

export type LinkPreview = {
  url: string; kind: "product" | "airbnb";
  title: string; image: string;
  price?: string; color?: string; type?: string;
  width?: number; depth?: number; height?: number;
};

export type ImageAdjust = { brightness: number; rotation: number; elevation: number; };

export type AiDirection = {
  wallColour: string; wallMaterial: string;
  floorColour: string; floorMaterial: string;
};

export type AnalysisMode = "thermal" | "wifi" | "acoustic" | null;

export type SimRoomScore = {
  roomId: string; score: number; label: string; detail: string;
};

export type SimScores = {
  thermal: SimRoomScore[];
  wifi: SimRoomScore[];
  acoustic: SimRoomScore[];
};

export const VIEWPOINTS: Viewpoint[] = [
  { id: "main", label: "Wide", image: roomMain },
  { id: "doorway", label: "From doorway", image: roomDoorway },
  { id: "corner", label: "From corner", image: roomCorner },
];

export const INITIAL_ITEMS: DetectedItem[] = [
  { id: "sofa", label: "Grey sofa", x: 70, y: 68 },
  { id: "coffee-table", label: "Oak coffee table", x: 48, y: 80 },
  { id: "floor-lamp", label: "Floor lamp", x: 47, y: 45 },
  { id: "window", label: "West-facing window", x: 14, y: 38 },
  { id: "plant", label: "Potted plant", x: 38, y: 70 },
];

type RoomSessionState = {
  items: DetectedItem[]; setItems: (i: DetectedItem[]) => void;
  messages: ChatMessage[]; pushMessage: (m: ChatMessage) => void;
  versions: EditVersion[]; pushVersion: (v: EditVersion) => void;
  currentVersionId: string; setCurrentVersionId: (id: string) => void;
  currentViewpointId: string; setCurrentViewpointId: (id: string) => void;
  highlightedItemId: string | null; setHighlightedItemId: (id: string | null) => void;
  linkPreview: LinkPreview | null; setLinkPreview: (p: LinkPreview | null) => void;
  imageAdjust: ImageAdjust; setImageAdjust: (a: ImageAdjust) => void;
  aiDirection: AiDirection; setAiDirection: (a: AiDirection) => void;
  analysisOpen: boolean; setAnalysisOpen: (b: boolean) => void;
  analysisMode: AnalysisMode; setAnalysisMode: (m: AnalysisMode) => void;
  generatedImage: string | null; setGeneratedImage: (img: string | null) => void;
  simScores: SimScores | null; setSimScores: (s: SimScores) => void;
};

const RoomSessionContext = createContext<RoomSessionState | null>(null);

export function RoomSessionProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<DetectedItem[]>(INITIAL_ITEMS);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [versions, setVersions] = useState<EditVersion[]>([{ id: "v0", label: "Original" }]);
  const [currentVersionId, setCurrentVersionId] = useState("v0");
  const [currentViewpointId, setCurrentViewpointId] = useState("main");
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const [linkPreview, setLinkPreview] = useState<LinkPreview | null>(null);
  const [imageAdjust, setImageAdjust] = useState<ImageAdjust>({ brightness: 100, rotation: 0, elevation: 0 });
  const [aiDirection, setAiDirection] = useState<AiDirection>({ wallColour: "", wallMaterial: "", floorColour: "", floorMaterial: "" });
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [simScores, setSimScores] = useState<SimScores | null>(null);

  return (
    <RoomSessionContext.Provider value={{
      items, setItems, messages,
      pushMessage: (m) => setMessages((prev) => [...prev, m]),
      versions, pushVersion: (v) => setVersions((prev) => [...prev, v]),
      currentVersionId, setCurrentVersionId,
      currentViewpointId, setCurrentViewpointId,
      highlightedItemId, setHighlightedItemId,
      linkPreview, setLinkPreview,
      imageAdjust, setImageAdjust,
      aiDirection, setAiDirection,
      analysisOpen, setAnalysisOpen,
      analysisMode, setAnalysisMode,
      generatedImage, setGeneratedImage,
      simScores, setSimScores,
    }}>
      {children}
    </RoomSessionContext.Provider>
  );
}

export function useRoomSession() {
  const ctx = useContext(RoomSessionContext);
  if (!ctx) throw new Error("useRoomSession must be used inside RoomSessionProvider");
  return ctx;
}
