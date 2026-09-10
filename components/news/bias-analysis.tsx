import { AnalysisPanel } from "@/components/news/analysis-panel";

type FramingLabel = "left" | "center" | "right" | "mixed" | "unclear";

interface FramingDistribution {
  left: number;
  center: number;
  right: number;
}

interface FramingRowProps {
  label: "Left" | "Center" | "Right";
  value: number;
  count?: number;
}

const rowColors = {
  Left: "bg-bias-left",
  Center: "bg-[#d8d8d8]",
  Right: "bg-bias-right",
};

export function FramingRow({ label, value, count }: FramingRowProps) {
  return (
    <div className="grid grid-cols-[52px_62px_minmax(72px,1fr)] items-center gap-2 text-[11px]">
      <span>{label}</span>
      <span className={label === "Left" ? "text-bias-left" : ""}>
        {typeof count === "number" ? `${count} (${value}%)` : `${value}%`}
      </span>
      <span className="flex h-2 items-center justify-end overflow-hidden rounded-sm bg-bg-secondary">
        <span
          className={`h-full rounded-sm ${rowColors[label]}`}
          style={{ width: `${value}%` }}
        />
      </span>
    </div>
  );
}

interface BiasAnalysisProps {
  article: {
    bias: FramingDistribution;
    confidence: number;
    framingLabel: FramingLabel;
    framingNotes: string;
    sourceName: string;
  };
}

export function BiasAnalysis({ article }: BiasAnalysisProps) {
  const label = `${article.framingLabel[0].toUpperCase()}${article.framingLabel.slice(1)}`;
  const labelColor =
    article.framingLabel === "left"
      ? "text-bias-left"
      : article.framingLabel === "right"
        ? "text-bias-right"
        : "text-text-primary";

  return (
    <AnalysisPanel title="Bias Analysis">
      <p className="mt-6 text-[11px] font-medium">AI-estimated political framing</p>
      <p className={`mt-1 text-[24px] font-semibold leading-none ${labelColor}`}>
        {label}
      </p>
      <p className="mt-2 text-[10px] text-text-secondary">
        Analysis of the article from {article.sourceName}
      </p>

      <div
        className="mt-6 space-y-4 border-y border-divider py-5"
        aria-label={`AI-estimated political framing: ${article.bias.left}% left, ${article.bias.center}% center, ${article.bias.right}% right`}
      >
        <FramingRow label="Left" value={article.bias.left} />
        <FramingRow label="Center" value={article.bias.center} />
        <FramingRow label="Right" value={article.bias.right} />
      </div>

      <p className="mt-5 text-[11px] leading-[1.55] text-text-primary">
        This AI-estimated analysis considers language, emphasis, and framing in the
        stored article text.
      </p>
      <p className="mt-3 text-[10px] leading-relaxed text-text-secondary">
        Confidence: {Math.round(article.confidence * 100)}% · {article.framingNotes}
      </p>
      <button
        type="button"
        className="mt-5 w-full rounded-sm border border-black/50 px-4 py-2 text-[11px] font-semibold transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        How We Analyze Bias
      </button>
    </AnalysisPanel>
  );
}
