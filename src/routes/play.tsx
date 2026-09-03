import { createFileRoute } from "@tanstack/react-router";
import { KalqApp } from "@/components/kalq/KalqApp";

export const Route = createFileRoute("/play")({ component: Play });

function Play() {
  return <KalqApp autoStart />;
}