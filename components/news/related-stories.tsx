import Link from "next/link";

import { BiasMeter } from "@/components/ui/bias-meter";

interface RelatedArticleItem {
  biasLabel: "left" | "center" | "right" | "mixed" | "unclear";
  centerPercentage: number;
  confidence: number;
  id: string;
  imageUrl: string;
  leftPercentage: number;
  publishedAt: string;
  rightPercentage: number;
  sentimentLabel: "positive" | "neutral" | "negative";
  sourceName: string;
  title: string;
}

interface RelatedArticlesProps {
  articles: RelatedArticleItem[];
}

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

export function RelatedArticles({ articles }: RelatedArticlesProps) {
  if (articles.length === 0) return null;

  return (
    <section
      className="mt-12 border-t border-black/20 pt-7 sm:mt-14 sm:pt-8"
      aria-labelledby="related-articles-heading"
    >
      <h2
        id="related-articles-heading"
        className="text-[20px] font-semibold tracking-[-0.025em]"
      >
        Related Articles
      </h2>
      <div className="mt-5 grid gap-x-8 gap-y-6 md:grid-cols-2">
        {articles.map((article) => (
          <article
            key={article.id}
            className="grid min-w-0 grid-cols-[112px_minmax(0,1fr)] gap-3 sm:grid-cols-[136px_minmax(0,1fr)]"
          >
            <Link
              href={`/news/${article.id}`}
              aria-label={`Read ${article.title}`}
              className="aspect-[4/3] overflow-hidden rounded-sm bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={article.imageUrl}
                alt={`News image for ${article.title}`}
                className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.015]"
              />
            </Link>
            <div className="min-w-0 self-start">
              <p className="text-[10px] leading-4 text-text-secondary">
                <span className="font-medium text-text-primary">{article.sourceName}</span>
                <span className="mx-1">·</span>
                <time dateTime={article.publishedAt}>
                  {dateFormatter.format(new Date(article.publishedAt))}
                </time>
              </p>
              <h3 className="mt-1 text-[14px] font-semibold leading-[1.28] tracking-[-0.015em]">
                <Link
                  href={`/news/${article.id}`}
                  className="rounded-sm transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  {article.title}
                </Link>
              </h3>
              <div className="mt-2 flex flex-wrap gap-1 text-[9px] text-text-secondary">
                <span className="rounded-full bg-bg-secondary px-2 py-1 capitalize">
                  Sentiment: {article.sentimentLabel}
                </span>
                <span className="rounded-full bg-bg-secondary px-2 py-1 capitalize">
                  AI-estimated framing: {article.biasLabel}
                </span>
                <span className="rounded-full bg-bg-secondary px-2 py-1">
                  Confidence: {Math.round(article.confidence * 100)}%
                </span>
              </div>
              <div
                className="mt-3"
                aria-label={`AI-estimated political framing: ${article.leftPercentage}% left, ${article.centerPercentage}% center, ${article.rightPercentage}% right`}
              >
                <BiasMeter
                  left={article.leftPercentage}
                  center={article.centerPercentage}
                  right={article.rightPercentage}
                  compact
                />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
