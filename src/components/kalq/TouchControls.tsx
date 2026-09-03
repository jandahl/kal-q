import type { ReactNode } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  onLeft: () => void;
  onRight: () => void;
  onPlace: () => void;
  onDiscard: () => void;
  onRushStart: () => void;
  onRushEnd: () => void;
  canPlace: boolean;
};

function Pad({
  label,
  onPress,
  onRelease,
  className,
  children,
  disabled,
}: {
  label: string;
  onPress: () => void;
  onRelease?: () => void;
  className?: string;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      className={cn(
        "flex h-12 min-w-12 items-center justify-center rounded-[14px] border border-border bg-elevated text-fg",
        "active:scale-[0.96] disabled:opacity-35",
        className,
      )}
      onPointerDown={(e) => {
        e.preventDefault();
        onPress();
      }}
      onPointerUp={onRelease}
      onPointerCancel={onRelease}
      onPointerLeave={onRelease}
    >
      {children}
    </button>
  );
}

export function TouchControls({
  onLeft,
  onRight,
  onPlace,
  onDiscard,
  onRushStart,
  onRushEnd,
  canPlace,
}: Props) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 md:hidden">
      <div className="flex gap-2">
        <Pad label="Left" onPress={onLeft}>
          <ArrowLeft className="size-5" strokeWidth={1.75} />
        </Pad>
        <Pad label="Right" onPress={onRight}>
          <ArrowRight className="size-5" strokeWidth={1.75} />
        </Pad>
      </div>
      <Pad
        label="Rush"
        onPress={onRushStart}
        onRelease={onRushEnd}
        className="h-12 w-12"
      >
        <ArrowUp className="size-5" strokeWidth={1.75} />
      </Pad>
      <div className="flex justify-end gap-2">
        <Pad label="Discard" onPress={onDiscard}>
          <ArrowDown className="size-5" strokeWidth={1.75} />
        </Pad>
        <Pad
          label="Place"
          onPress={onPlace}
          disabled={!canPlace}
          className="bg-accent text-accent-fg border-transparent min-w-[4.5rem] px-3 text-sm font-medium"
        >
          Place
        </Pad>
      </div>
    </div>
  );
}
