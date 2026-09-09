import { AnalysisPanel } from "@/components/news/analysis-panel";
import { FramingRow } from "@/components/news/bias-analysis";
import type { FeaturedArticle } from "@/lib/demo-news";

interface SourceBreakdownProps {
  article: Pick<FeaturedArticle, "bias" | "sourceCount" | "sources">;
}

const sourceLabelColors = {
  Left: "text-bias-left",
  Center: "text-text-secondary",
  Right: "text-bias-right",
};

export function SourceBreakdown({ article }: SourceBreakdownProps) {
  return (
    <AnalysisPanel title="Source Breakdown">
      <p className="mt-5 text-[11px] font-semibold">
        {article.sourceCount} Total Sources
      </p>
      <div className="mt-5 space-y-4">
        <FramingRow label="Left" value={article.bias.left} count={2} />
        <FramingRow label="Center" value={article.bias.center} count={4} />
        <FramingRow label="Right" value={article.bias.right} count={6} />
      </div>

      <div className="mt-6 border-t border-divider pt-5">
        <div className="mb-3 flex items-center justify-between text-[10px] font-semibold">
          <span>Top Sources</span>
          <span>Bias</span>
        </div>
        <ul className="space-y-3 text-[10px]">
          {article.sources.map((source) => (
            <li key={source.name} className="flex items-center justify-between gap-4">
              <span className="font-medium">{source.name}</span>
              <span className={sourceLabelColors[source.framing]}>
                {source.framing}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        className="mt-6 w-full rounded-sm border border-black/50 px-4 py-2 text-[10px] font-semibold transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        View All Sources
      </button>
    </AnalysisPanel>
  );
}
