import { cn } from "@/lib/utils";

interface BiasMeterProps {
  left: number;
  center: number;
  right: number;
  /** Render the 0% / 50% / 100% scale ticks below the bar. */
  showScale?: boolean;
  /**
   * Compact card form: the left segment reads "L 20%" instead of "Left 20%", and any
   * segment narrower than ~14% collapses to its percentage only so the word never clips.
   */
  compact?: boolean;
  className?: string;
}

/** Segmented left/center/right bias bar. Percentages are expected to sum to 100. */
export function BiasMeter({
  left,
  center,
  right,
  showScale = false,
  compact = false,
  className,
}: BiasMeterProps) {
  const leftWord = compact ? "L" : "Left";
  const segments = [
    {
      key: "left",
      value: left,
      label: `${leftWord} ${left}%`,
      bg: "bg-bias-left",
      text: "text-white",
    },
    {
      key: "center",
      value: center,
      label: `Center ${center}%`,
      bg: "bg-bias-center",
      text: "text-text-primary",
    },
    {
      key: "right",
      value: right,
      label: `Right ${right}%`,
      bg: "bg-bias-right",
      text: "text-white",
    },
  ];

  return (
    <div className={cn("w-full", className)}>
      <div className="flex w-full items-stretch gap-1 overflow-hidden rounded-sm">
        {segments.map((s) => {
          // In compact mode, drop the word on tight segments and show just the percentage.
          const label = compact && s.value < 14 ? `${s.value}%` : s.label;
          return (
            <div
              key={s.key}
              style={{ width: `${s.value}%` }}
              className={cn(
                "flex items-center justify-center px-2 py-1.5 text-caption font-medium whitespace-nowrap",
                s.bg,
                s.text,
              )}
            >
              {s.value > 0 && label}
            </div>
          );
        })}
      </div>
      {showScale && (
        <div className="mt-1 flex justify-between text-caption text-text-secondary">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      )}
    </div>
  );
}
