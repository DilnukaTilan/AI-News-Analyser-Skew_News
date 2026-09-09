import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ArticleCard } from "@/components/ui/article-card";
import { featuredArticle, homeArticles } from "@/lib/demo-news";

export default function Home() {
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
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-7">
            {homeArticles.map((article) => (
              <ArticleCard
                key={article.id}
                variant="grid"
                title={article.title}
                category={article.category}
                country={article.country}
                imageUrl={article.imageUrl}
                imageAlt={article.imageAlt}
                sourceCount={article.sourceCount}
                bias={article.bias}
                href={
                  article.id === featuredArticle.id
                    ? `/news/${featuredArticle.id}`
                    : undefined
                }
              />
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
