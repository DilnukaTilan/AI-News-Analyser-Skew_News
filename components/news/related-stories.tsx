import type { RelatedStory } from "@/lib/demo-news";

interface RelatedStoriesProps {
  stories: RelatedStory[];
}

export function RelatedStories({ stories }: RelatedStoriesProps) {
  return (
    <section className="mt-8 border-t border-black/20 pt-6" aria-labelledby="related-stories-heading">
      <h2 id="related-stories-heading" className="text-[13px] font-semibold">
        Related Stories
      </h2>
      <div className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
        {stories.map((story) => (
          <article key={story.id} className="grid min-w-0 grid-cols-[104px_1fr] gap-3">
            <div className="aspect-[4/3] overflow-hidden rounded-sm bg-bg-secondary">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={story.imageUrl} alt={story.imageAlt} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] leading-4 text-text-secondary">
                {story.category} <span className="mx-1">·</span> {story.country}
              </p>
              <h3 className="mt-0.5 text-[12px] font-semibold leading-[1.25] tracking-[-0.01em]">
                {story.title}
              </h3>
              <p className="mt-2 text-[9px] text-text-secondary">
                <time dateTime={story.publishedDate}>{story.publishedLabel}</time>
                <span className="mx-1.5">·</span>
                {story.readTime}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
