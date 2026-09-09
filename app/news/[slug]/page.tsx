import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AiSummary } from "@/components/news/ai-summary";
import { ArticleActions } from "@/components/news/article-actions";
import { BiasAnalysis } from "@/components/news/bias-analysis";
import { NewsletterSignup } from "@/components/news/newsletter-signup";
import { RelatedStories } from "@/components/news/related-stories";
import { SourceBreakdown } from "@/components/news/source-breakdown";
import { BiasMeter } from "@/components/ui/bias-meter";
import { featuredArticle } from "@/lib/demo-news";

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

export function generateStaticParams() {
  return [{ slug: featuredArticle.id }];
}

export async function generateMetadata({
  params,
}: NewsDetailsPageProps): Promise<Metadata> {
  const { slug } = await params;

  if (slug !== featuredArticle.id) {
    return { title: "Story not found — Skew" };
  }

  return {
    title: `${featuredArticle.title} — Skew`,
    description: featuredArticle.summaryBullets[0],
  };
}

export default async function NewsDetailsPage({ params }: NewsDetailsPageProps) {
  const { slug } = await params;

  if (slug !== featuredArticle.id) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f7f4]">
      <SiteHeader showTopics={false} />

      <main className="flex-1 px-4 pb-10 pt-10 sm:px-6 sm:pb-14 sm:pt-12 lg:pt-14">
        <div className="mx-auto max-w-app">
          <div className="grid items-start gap-10 xl:grid-cols-[minmax(0,2.12fr)_minmax(320px,0.9fr)] xl:gap-11">
            <article className="min-w-0">
              <header>
                <p className="text-[11px] font-medium">
                  {featuredArticle.category}
                  <span className="mx-1">·</span>
                  {featuredArticle.country}
                </p>
                <h1 className="mt-3 max-w-[830px] text-[30px] font-semibold leading-[1.18] tracking-[-0.04em] sm:text-[38px] lg:text-[42px]">
                  {featuredArticle.title}
                </h1>
                <div className="mt-5 flex flex-col gap-3 border-b border-black/0 pb-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-text-secondary">
                    <span className="font-medium text-text-primary">
                      By {featuredArticle.author}
                    </span>
                    <span aria-hidden>·</span>
                    <time dateTime={featuredArticle.publishedDate}>
                      {featuredArticle.publishedLabel}
                    </time>
                    <span aria-hidden>·</span>
                    <span>{featuredArticle.readTime}</span>
                  </p>
                  <ArticleActions />
                </div>
              </header>

              <figure className="mt-6">
                <div className="aspect-[16/9] overflow-hidden rounded-md bg-bg-secondary">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={featuredArticle.imageUrl}
                    alt={featuredArticle.imageAlt}
                    className="h-full w-full object-cover"
                  />
                </div>
                <figcaption className="mt-3 text-[9px] leading-[1.55] text-text-secondary">
                  <span className="block">{featuredArticle.imageCaption}</span>
                  <span className="block">{featuredArticle.imageCredit}</span>
                </figcaption>
              </figure>

              <section
                className="mt-6 rounded-md border border-black/15 bg-bg-primary p-4 shadow-sm sm:p-5"
                aria-labelledby="bias-distribution-heading"
              >
                <div className="flex items-center gap-2">
                  <h2 id="bias-distribution-heading" className="text-[12px] font-semibold">
                    Bias Distribution
                  </h2>
                  <span className="text-text-secondary" aria-hidden>
                    <InfoIcon />
                  </span>
                </div>
                <div
                  className="mt-4"
                  aria-label={`AI-estimated political framing: ${featuredArticle.bias.left}% left, ${featuredArticle.bias.center}% center, ${featuredArticle.bias.right}% right`}
                >
                  <BiasMeter
                    left={featuredArticle.bias.left}
                    center={featuredArticle.bias.center}
                    right={featuredArticle.bias.right}
                  />
                </div>
                <p className="mt-4 text-[11px] font-semibold">
                  {featuredArticle.sourceCount} sources
                </p>
              </section>

              <div className="mt-10 space-y-6 text-[15px] leading-[1.58] tracking-[-0.01em] sm:text-[16px]">
                {featuredArticle.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>

              <RelatedStories stories={featuredArticle.relatedStories} />
            </article>

            <aside
              className="grid min-w-0 gap-6 md:grid-cols-2 xl:sticky xl:top-6 xl:grid-cols-1"
              aria-label="Article analysis"
            >
              <BiasAnalysis article={featuredArticle} />
              <AiSummary article={featuredArticle} />
              <div className="md:col-span-2 xl:col-span-1">
                <SourceBreakdown article={featuredArticle} />
              </div>
            </aside>
          </div>

          <NewsletterSignup />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
