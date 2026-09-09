import { AnalysisPanel } from "@/components/news/analysis-panel";
import type { FeaturedArticle, FramingDistribution } from "@/lib/demo-news";

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
  article: Pick<
    FeaturedArticle,
    "bias" | "sourceCount" | "confidence" | "framingNotes"
  >;
}

export function BiasAnalysis({ article }: BiasAnalysisProps) {
  const strongest = (Object.entries(article.bias) as Array<
    [keyof FramingDistribution, number]
  >).reduce((current, candidate) =>
    candidate[1] > current[1] ? candidate : current,
  );
  const label = `${strongest[0][0].toUpperCase()}${strongest[0].slice(1)}`;

  return (
    <AnalysisPanel title="Bias Analysis">
      <p className="mt-6 text-[11px] font-medium">Overall Bias</p>
      <p className="mt-1 text-[24px] font-semibold leading-none text-bias-right">
        {label} {strongest[1]}%
      </p>
      <p className="mt-2 text-[10px] text-bias-right">
        Based on {article.sourceCount} balanced sources
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
        This AI-estimated analysis considers language, emphasis, and framing across
        the coverage. Sources are weighted by reliability and recency.
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
