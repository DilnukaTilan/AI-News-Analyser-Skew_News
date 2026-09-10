import { AnalysisPanel } from "@/components/news/analysis-panel";

interface SourceBreakdownProps {
  article: {
    articleUrl?: string;
    framingLabel: "left" | "center" | "right" | "mixed" | "unclear";
    publishedAt: string;
    sourceName: string;
  };
}

export function SourceBreakdown({ article }: SourceBreakdownProps) {
  return (
    <AnalysisPanel title="Article Source">
      <p className="mt-5 text-[15px] font-semibold">{article.sourceName}</p>
      <dl className="mt-5 space-y-3 border-y border-divider py-5 text-[10px]">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-text-secondary">Published</dt>
          <dd>
            <time dateTime={article.publishedAt}>
              {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
                new Date(article.publishedAt),
              )}
            </time>
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-text-secondary">AI-estimated framing</dt>
          <dd className="capitalize">{article.framingLabel}</dd>
        </div>
      </dl>

      {article.articleUrl ? (
        <a
          href={article.articleUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-6 block w-full rounded-sm border border-black/50 px-4 py-2 text-center text-[10px] font-semibold transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          Read original article
        </a>
      ) : null}
    </AnalysisPanel>
  );
}
