import { createFileRoute } from "@tanstack/react-router";
import { CanvasView } from "@/components/canvas/CanvasView";

export const Route = createFileRoute("/canvas")({
  head: () => ({ meta: [{ title: "Your room — Roomly" }] }),
  component: () => <CanvasView />,
});
