import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AiSummary } from "@/components/news/ai-summary";
import { ArticleActions } from "@/components/news/article-actions";
import { BiasAnalysis } from "@/components/news/bias-analysis";
import { NewsletterSignup } from "@/components/news/newsletter-signup";
import { RelatedArticles } from "@/components/news/related-stories";
import { SourceBreakdown } from "@/components/news/source-breakdown";
import { BiasMeter } from "@/components/ui/bias-meter";
import {
  getPublishedArticleById,
  getPublishedArticleEmbedding,
  getRelatedArticles,
} from "@/lib/supabase/queries/articles";

export const dynamic = "force-dynamic";

const getArticle = cache(getPublishedArticleById);
const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

interface NewsDetailsPageProps {
  params: Promise<{ slug: string }>;
}

function InfoIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  );
}

function safeArticleUrl(value: string): string | undefined {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

export async function generateMetadata({
  params,
}: NewsDetailsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    return { title: "Story not found — Skew" };
  }

  return {
    title: `${article.title} — Skew`,
    description: article.analysis.summary,
  };
}

export default async function NewsDetailsPage({ params }: NewsDetailsPageProps) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  const embedding = await getPublishedArticleEmbedding(article.id);
  const relatedArticles = embedding
    ? await getRelatedArticles(article.id, embedding)
    : [];

  const analysis = article.analysis;
  const bias = {
    left: analysis.left_percentage,
    center: analysis.center_percentage,
    right: analysis.right_percentage,
  };
  const paragraphs = article.raw_text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const articleUrl = safeArticleUrl(article.canonical_url ?? article.original_url);

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f7f4]">
      <SiteHeader showTopics={false} />

      <main className="flex-1 px-4 pb-10 pt-10 sm:px-6 sm:pb-14 sm:pt-12 lg:pt-14">
        <div className="mx-auto max-w-app">
          <div className="grid items-start gap-10 xl:grid-cols-[minmax(0,2.12fr)_minmax(320px,0.9fr)] xl:gap-11">
            <article className="min-w-0">
              <header>
                <p className="text-[11px] font-medium">{article.source.name}</p>
                <h1 className="mt-3 max-w-[830px] text-[30px] font-semibold leading-[1.18] tracking-[-0.04em] sm:text-[38px] lg:text-[42px]">
                  {article.title}
                </h1>
                <div className="mt-5 flex flex-col gap-3 border-b border-black/0 pb-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-text-secondary">
                    <span className="font-medium text-text-primary">
                      Published by {article.source.name}
                    </span>
                    <span aria-hidden>·</span>
                    <time dateTime={article.published_at}>
                      {dateFormatter.format(new Date(article.published_at))}
                    </time>
                  </p>
                  <ArticleActions />
                </div>
              </header>

              <figure className="mt-6">
                <div className="aspect-[16/9] overflow-hidden rounded-md bg-bg-secondary">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={article.image_url}
                    alt={`News image for ${article.title}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              </figure>

              <section
                className="mt-6 rounded-md border border-black/15 bg-bg-primary p-4 shadow-sm sm:p-5"
                aria-labelledby="bias-distribution-heading"
              >
                <div className="flex items-center gap-2">
                  <h2 id="bias-distribution-heading" className="text-[12px] font-semibold">
                    AI-estimated Political Framing
                  </h2>
                  <span className="text-text-secondary" aria-hidden>
                    <InfoIcon />
                  </span>
                </div>
                <div
                  className="mt-4"
                  aria-label={`AI-estimated political framing: ${bias.left}% left, ${bias.center}% center, ${bias.right}% right`}
                >
                  <BiasMeter left={bias.left} center={bias.center} right={bias.right} />
                </div>
                <p className="mt-4 text-[11px] font-semibold capitalize">
                  Label: {analysis.bias_label} · Confidence: {Math.round(analysis.confidence * 100)}%
                </p>
              </section>

              <div className="mt-10 space-y-6 text-[15px] leading-[1.58] tracking-[-0.01em] sm:text-[16px]">
                {paragraphs.map((paragraph, index) => (
                  <p key={`${article.id}-${index}`}>{paragraph}</p>
                ))}
              </div>
            </article>

            <aside
              className="grid min-w-0 gap-6 md:grid-cols-2 xl:sticky xl:top-6 xl:grid-cols-1"
              aria-label="Article analysis"
            >
              <BiasAnalysis
                article={{
                  bias,
                  confidence: analysis.confidence,
                  framingLabel: analysis.bias_label,
                  framingNotes: analysis.framing_notes,
                  sourceName: article.source.name,
                }}
              />
              <AiSummary
                article={{
                  analyzedAt: article.analyzed_at,
                  disclaimer: analysis.disclaimer,
                  loadedTerms: analysis.loaded_terms,
                  model: analysis.model,
                  sentimentLabel: analysis.sentiment_label,
                  sentimentScore: analysis.sentiment_score,
                  summary: analysis.summary,
                }}
              />
              <div className="md:col-span-2 xl:col-span-1">
                <SourceBreakdown
                  article={{
                    articleUrl,
                    framingLabel: analysis.bias_label,
                    publishedAt: article.published_at,
                    sourceName: article.source.name,
                  }}
                />
              </div>
            </aside>
          </div>

          <RelatedArticles articles={relatedArticles} />
          <NewsletterSignup />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
