import { cn } from "@/lib/utils";
import { BiasMeter } from "@/components/ui/bias-meter";

function ClockIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 4h12v16l-6-4-6 4V4z" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  );
}

interface ArticleCardProps {
  title: string;
  excerpt: string;
  category: string;
  country: string;
  imageUrl?: string;
  timeAgo: string;
  readTime: string;
  bias: { left: number; center: number; right: number };
  className?: string;
}

export function ArticleCard({
  title,
  excerpt,
  category,
  country,
  imageUrl,
  timeAgo,
  readTime,
  bias,
  className,
}: ArticleCardProps) {
  return (
    <article
      className={cn(
        "flex flex-col gap-4 rounded-lg border border-border bg-bg-primary p-4 shadow-sm sm:flex-row",
        className,
      )}
    >
      <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-md bg-surface sm:aspect-square sm:w-40">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : null}
        <span className="absolute right-2 top-2 rounded-full bg-bg-primary/90 p-1 text-text-secondary shadow-sm">
          <InfoIcon />
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="text-caption text-text-secondary">
          {category} <span className="mx-1">·</span> {country}
        </p>
        <h3 className="text-h3 text-text-primary">{title}</h3>
        <p className="text-body-md text-text-secondary">{excerpt}</p>

        <BiasMeter
          left={bias.left}
          center={bias.center}
          right={bias.right}
          className="mt-1"
        />

        <div className="mt-1 flex items-center gap-4 text-caption text-text-secondary">
          <span className="inline-flex items-center gap-1.5">
            <ClockIcon />
            {timeAgo}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BookmarkIcon />
            {readTime}
          </span>
        </div>
      </div>
    </article>
  );
}
