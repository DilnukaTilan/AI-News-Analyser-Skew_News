import Link from "next/link";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  basePath?: string;
  searchParams?: Record<string, string | string[] | undefined>;
  className?: string;
}

function createPageHref(
  page: number,
  basePath = "/",
  existingParams?: Record<string, string | string[] | undefined>,
): string {
  const params = new URLSearchParams();

  if (existingParams) {
    for (const [key, value] of Object.entries(existingParams)) {
      if (key !== "page" && typeof value === "string") {
        params.set(key, value);
      }
    }
  }

  if (page > 1) {
    params.set("page", page.toString());
  }

  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

function getPaginationRange(
  currentPage: number,
  totalPages: number,
): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [1];

  if (currentPage > 3) {
    pages.push("ellipsis");
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (currentPage < totalPages - 2) {
    pages.push("ellipsis");
  }

  pages.push(totalPages);

  return pages;
}

export function Pagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  basePath = "/",
  searchParams,
  className,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const fromItem = Math.min((currentPage - 1) * pageSize + 1, totalCount);
  const toItem = Math.min(currentPage * pageSize, totalCount);
  const pages = getPaginationRange(currentPage, totalPages);

  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <nav
      aria-label="Articles pagination"
      className={cn(
        "flex flex-col items-center justify-between gap-4 border-t border-black/10 pt-6 sm:flex-row",
        className,
      )}
    >
      <p className="text-[12px] font-medium text-text-secondary">
        Showing <span className="font-semibold text-text-primary">{fromItem}</span>–
        <span className="font-semibold text-text-primary">{toItem}</span> of{" "}
        <span className="font-semibold text-text-primary">{totalCount}</span> stories
      </p>

      <ul className="flex flex-wrap items-center justify-center gap-1.5 list-none p-0 m-0">
        {/* Previous page button */}
        <li>
          {hasPrevious ? (
            <Link
              href={createPageHref(currentPage - 1, basePath, searchParams)}
              aria-label="Go to previous page"
              className="inline-flex h-9 items-center gap-1 rounded-md border border-black/15 bg-bg-primary px-3 text-[12px] font-medium text-text-primary shadow-xs transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
              <span>Prev</span>
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className="inline-flex h-9 select-none items-center gap-1 rounded-md border border-black/10 bg-black/[0.02] px-3 text-[12px] font-medium text-text-secondary/50"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
              <span>Prev</span>
            </span>
          )}
        </li>

        {/* Page number buttons */}
        {pages.map((page, index) => {
          if (page === "ellipsis") {
            return (
              <li
                key={`ellipsis-${index}`}
                aria-hidden="true"
                className="inline-flex h-9 w-8 items-center justify-center text-[12px] font-medium text-text-secondary"
              >
                …
              </li>
            );
          }

          const isCurrent = page === currentPage;

          return (
            <li key={`page-${page}`}>
              {isCurrent ? (
                <span
                  aria-current="page"
                  className="inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-text-primary bg-text-primary px-2.5 text-[12px] font-semibold text-white shadow-xs"
                >
                  {page}
                </span>
              ) : (
                <Link
                  href={createPageHref(page, basePath, searchParams)}
                  aria-label={`Go to page ${page}`}
                  className="inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-black/15 bg-bg-primary px-2.5 text-[12px] font-medium text-text-primary shadow-xs transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  {page}
                </Link>
              )}
            </li>
          );
        })}

        {/* Next page button */}
        <li>
          {hasNext ? (
            <Link
              href={createPageHref(currentPage + 1, basePath, searchParams)}
              aria-label="Go to next page"
              className="inline-flex h-9 items-center gap-1 rounded-md border border-black/15 bg-bg-primary px-3 text-[12px] font-medium text-text-primary shadow-xs transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              <span>Next</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className="inline-flex h-9 select-none items-center gap-1 rounded-md border border-black/10 bg-black/[0.02] px-3 text-[12px] font-medium text-text-secondary/50"
            >
              <span>Next</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
