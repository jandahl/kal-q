import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { HowToScreen } from "@/components/kalq/Overlays";

export const Route = createFileRoute("/how-to")({ component: HowTo });

function HowTo() {
  const navigate = useNavigate();
  return (
    <main className="relative flex h-dvh flex-col overflow-hidden bg-bg text-fg">
      <HowToScreen onBack={() => navigate({ to: "/" })} />
    </main>
  );
}