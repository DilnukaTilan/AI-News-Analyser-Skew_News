import { cn } from "@/lib/utils";
import { BiasMeter } from "@/components/ui/bias-meter";
import Link from "next/link";

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
  excerpt?: string;
  category: string;
  country: string;
  imageUrl?: string;
  imageAlt?: string;
  timeAgo?: string;
  readTime?: string;
  sourceCount?: number;
  publishedAt?: string;
  sentimentLabel?: "positive" | "neutral" | "negative";
  framingLabel?: "left" | "center" | "right" | "mixed" | "unclear";
  confidence?: number;
  href?: string;
  variant?: "horizontal" | "grid";
  bias: { left: number; center: number; right: number };
  className?: string;
}

export function ArticleCard({
  title,
  excerpt,
  category,
  country,
  imageUrl,
  imageAlt = "",
  timeAgo,
  readTime,
  sourceCount,
  publishedAt,
  sentimentLabel,
  framingLabel,
  confidence,
  href,
  variant = "horizontal",
  bias,
  className,
}: ArticleCardProps) {
  if (variant === "grid") {
    return (
      <article
        className={cn(
          "flex h-full min-w-0 flex-col overflow-hidden rounded-md border border-black/20 bg-bg-primary shadow-sm",
          className,
        )}
      >
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-bg-secondary">
          {imageUrl ? (
            href ? (
              <Link
                href={href}
                aria-label={`Read ${title}`}
                className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt={imageAlt}
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.015]"
                />
              </Link>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={imageAlt}
                className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.015]"
              />
            )
          ) : (
            <div
              className="h-full w-full bg-[linear-gradient(135deg,#d8d8d4,#efefeb)]"
              role="img"
              aria-label={imageAlt || "Article image unavailable"}
            />
          )}
          <span className="absolute right-3 top-3 rounded-full bg-black/60 p-0.5 text-white ring-1 ring-white/80">
            <InfoIcon />
            <span className="sr-only">About this article</span>
          </span>
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-3.5 pb-3.5 pt-3">
          <p className="text-[11px] leading-4 text-text-primary">
            <span className="font-medium">{category}</span>
            <span className="mx-1">·</span>
            {publishedAt ? <time dateTime={publishedAt}>{country}</time> : country}
          </p>
          <h3 className="mt-1 text-[17px] font-semibold leading-[1.28] tracking-[-0.015em] text-text-primary">
            {href ? (
              <Link
                href={href}
                className="rounded-sm transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                {title}
              </Link>
            ) : (
              title
            )}
          </h3>

          {sentimentLabel || framingLabel || typeof confidence === "number" ? (
            <div className="mt-3 flex flex-wrap gap-1.5 text-[9px] text-text-secondary">
              {sentimentLabel ? (
                <span className="rounded-full bg-bg-secondary px-2 py-1 capitalize">
                  Sentiment: {sentimentLabel}
                </span>
              ) : null}
              {framingLabel ? (
                <span className="rounded-full bg-bg-secondary px-2 py-1 capitalize">
                  AI-estimated framing: {framingLabel}
                </span>
              ) : null}
              {typeof confidence === "number" ? (
                <span className="rounded-full bg-bg-secondary px-2 py-1">
                  Confidence: {Math.round(confidence * 100)}%
                </span>
              ) : null}
            </div>
          ) : null}

          <div
            className="mt-4"
            aria-label={`AI-estimated political framing: ${bias.left}% left, ${bias.center}% center, ${bias.right}% right`}
          >
            <BiasMeter
              left={bias.left}
              center={bias.center}
              right={bias.right}
              compact
            />
          </div>

          {typeof sourceCount === "number" ? (
            <p className="mt-4 text-[11px] leading-none text-text-primary">
              {sourceCount} {sourceCount === 1 ? "source" : "sources"}
            </p>
          ) : null}
        </div>
      </article>
    );
  }

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
          <img
            src={imageUrl}
            alt={imageAlt}
            className="h-full w-full object-cover"
          />
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
        {excerpt ? (
          <p className="text-body-md text-text-secondary">{excerpt}</p>
        ) : null}

        <BiasMeter
          left={bias.left}
          center={bias.center}
          right={bias.right}
          className="mt-1"
        />

        {timeAgo || readTime ? (
          <div className="mt-1 flex items-center gap-4 text-caption text-text-secondary">
            {timeAgo ? (
              <span className="inline-flex items-center gap-1.5">
                <ClockIcon />
                {timeAgo}
              </span>
            ) : null}
            {readTime ? (
              <span className="inline-flex items-center gap-1.5">
                <BookmarkIcon />
                {readTime}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
