import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ArticleCard } from "@/components/ui/article-card";
import { listPublishedArticles } from "@/lib/supabase/queries/articles";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

export default async function Home() {
  const articles = await listPublishedArticles();

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f7f4]">
      <SiteHeader />
      <main id="top-news" className="flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:py-11">
        <section className="mx-auto max-w-app" aria-labelledby="top-news-heading">
          <h1
            id="top-news-heading"
            className="mb-6 text-[28px] font-semibold leading-tight tracking-[-0.035em] sm:text-[30px]"
          >
            Top News
          </h1>
          {articles.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-7">
              {articles.map((article) => (
                <ArticleCard
                  key={article.id}
                  variant="grid"
                  title={article.title}
                  category={article.source.name}
                  country={dateFormatter.format(new Date(article.published_at))}
                  publishedAt={article.published_at}
                  imageUrl={article.image_url}
                  imageAlt={`News image for ${article.title}`}
                  sentimentLabel={article.analysis.sentiment_label}
                  framingLabel={article.analysis.bias_label}
                  confidence={article.analysis.confidence}
                  bias={{
                    left: article.analysis.left_percentage,
                    center: article.analysis.center_percentage,
                    right: article.analysis.right_percentage,
                  }}
                  href={`/news/${article.id}`}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-black/15 bg-bg-primary px-6 py-12 text-center shadow-sm">
              <h2 className="text-[18px] font-semibold">No analyzed articles yet</h2>
              <p className="mt-2 text-[12px] text-text-secondary">
                New stories will appear here after scraping and AI analysis complete.
              </p>
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
