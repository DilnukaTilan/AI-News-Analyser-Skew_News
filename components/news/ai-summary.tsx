import { AnalysisPanel } from "@/components/news/analysis-panel";

interface AiSummaryProps {
  article: {
    analyzedAt: string;
    disclaimer: string;
    loadedTerms: string[];
    model: string;
    sentimentLabel: "positive" | "neutral" | "negative";
    sentimentScore: number;
    summary: string;
  };
}

export function AiSummary({ article }: AiSummaryProps) {
  return (
    <AnalysisPanel title="AI Summary">
      <p className="mt-4 text-[10px] text-text-secondary">
        <time dateTime={article.analyzedAt}>
          Generated {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(article.analyzedAt))}
        </time>
        <span className="mx-2">·</span>
        {article.model}
      </p>
      <p className="mt-5 text-[11px] leading-[1.65] text-text-primary">
        {article.summary}
      </p>

      <div className="mt-6 border-t border-divider pt-4">
        <div className="flex flex-wrap items-center gap-2 text-[10px]">
          <span className="font-semibold">Sentiment</span>
          <span className="rounded-full bg-bg-secondary px-2.5 py-1 capitalize text-text-secondary">
            {article.sentimentLabel} ({article.sentimentScore.toFixed(2)})
          </span>
        </div>
        <p className="mt-3 text-[10px] font-semibold">Loaded terms</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {article.loadedTerms.length > 0 ? (
            article.loadedTerms.map((term) => (
              <span
                key={term}
                className="rounded-full border border-border bg-surface px-2 py-1 text-[9px] text-text-secondary"
              >
                {term}
              </span>
            ))
          ) : (
            <span className="text-[9px] text-text-secondary">None identified</span>
          )}
        </div>
      </div>

      <p className="mt-5 text-[10px] leading-relaxed text-text-secondary">
        {article.disclaimer}
      </p>
      <button
        type="button"
        className="mt-3 rounded-sm border border-black/50 px-4 py-2 text-[10px] font-medium transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        Provide Feedback
      </button>
    </AnalysisPanel>
  );
}
