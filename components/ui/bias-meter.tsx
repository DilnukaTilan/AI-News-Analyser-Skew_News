import { cn } from "@/lib/utils";

interface BiasMeterProps {
  left: number;
  center: number;
  right: number;
  /** Render the 0% / 50% / 100% scale ticks below the bar. */
  showScale?: boolean;
  /**
   * Compact card form: tighter padding, 10px text, 18px bar height, and tighter thresholds.
   */
  compact?: boolean;
  /**
   * Display mode for segment labels:
   * - "auto" (default): dynamically adapts between full word, first letter, and just numbers
   *   combining Character-Length Awareness and Fluid Responsive Padding & Sizing.
   * - "full": always shows full word + percentage (e.g., "Left 20%")
   * - "letter": always shows first letter + percentage (e.g., "L 20%")
   * - "number": always shows percentage number only (e.g., "20%")
   */
  labelFormat?: "auto" | "full" | "letter" | "number";
  className?: string;
}

/** Segmented left/center/right bias bar. Percentages are expected to sum to 100. */
export function BiasMeter({
  left,
  center,
  right,
  showScale = false,
  compact = false,
  labelFormat = "auto",
  className,
}: BiasMeterProps) {
  const segments = [
    {
      key: "left" as const,
      name: "Left",
      letter: "L",
      value: left,
      bg: "bg-bias-left",
      text: "text-white",
    },
    {
      key: "center" as const,
      name: "Center",
      letter: "C",
      value: center,
      bg: "bg-bias-center",
      text: "text-text-primary",
    },
    {
      key: "right" as const,
      name: "Right",
      letter: "R",
      value: right,
      bg: "bg-bias-right",
      text: "text-white",
    },
  ];

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "flex w-full items-stretch overflow-hidden rounded-sm select-none",
          compact ? "h-[18px] gap-px" : "h-[22px] gap-1",
        )}
        role="meter"
        aria-label={`AI-estimated political framing: ${left}% Left, ${center}% Center, ${right}% Right`}
        aria-valuenow={center}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {segments.map((s) => {
          const fullLabel = `${s.name} ${s.value}%`;
          const letterLabel = `${s.letter} ${s.value}%`;
          const numberLabel = `${s.value}%`;

          return (
            <div
              key={s.key}
              data-segment={s.key}
              data-compact={compact ? "true" : "false"}
              data-format={labelFormat}
              style={{ width: `${s.value}%` }}
              title={s.value > 0 ? fullLabel : undefined}
              className={cn(
                "bias-meter-segment relative flex h-full min-w-0 items-center justify-center overflow-hidden whitespace-nowrap font-medium leading-none tracking-tight",
                compact ? "text-[10px]" : "text-caption",
                s.bg,
                s.text,
              )}
            >
              {s.value > 0 && (
                <>
                  <span className="bias-label-full" aria-hidden="true">
                    {fullLabel}
                  </span>
                  <span className="bias-label-letter" aria-hidden="true">
                    {letterLabel}
                  </span>
                  <span className="bias-label-number" aria-hidden="true">
                    {numberLabel}
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>
      {showScale && (
        <div className="mt-1 flex justify-between text-caption text-text-secondary select-none">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      )}
    </div>
  );
}
