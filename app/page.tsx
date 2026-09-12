import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ArticleCard } from "@/components/ui/article-card";
import { Pagination } from "@/components/ui/pagination";
import { listPublishedArticles } from "@/lib/supabase/queries/articles";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

interface HomePageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Home({ searchParams }: HomePageProps) {
  const resolvedSearchParams = await searchParams;
  const rawPage = resolvedSearchParams?.page;
  const pageStr = Array.isArray(rawPage) ? rawPage[0] : rawPage;
  const parsedPage = pageStr ? parseInt(pageStr, 10) : 1;
  const requestedPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const { articles, totalCount, totalPages, page: currentPage, pageSize } =
    await listPublishedArticles({ page: requestedPage, pageSize: 15 });

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f7f4]">
      <SiteHeader />
      <main id="top-news" className="flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:py-11">
        <section className="mx-auto max-w-app" aria-labelledby="top-news-heading">
          <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <h1
              id="top-news-heading"
              className="text-[28px] font-semibold leading-tight tracking-[-0.035em] sm:text-[30px]"
            >
              Top News
            </h1>
            {totalCount > 0 && (
              <p className="text-[12px] font-medium text-text-secondary">
                Page {currentPage} of {totalPages}
              </p>
            )}
          </div>
          {articles.length > 0 ? (
            <>
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
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalCount={totalCount}
                pageSize={pageSize}
                searchParams={resolvedSearchParams}
                className="mt-10 sm:mt-12"
              />
            </>
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
