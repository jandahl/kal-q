import { createFileRoute } from "@tanstack/react-router";
import { KalqApp } from "@/components/kalq/KalqApp";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <KalqApp />;
}