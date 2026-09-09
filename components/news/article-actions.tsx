function BookmarkIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M6 4h12v16l-6-4-6 4V4z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5" />
    </svg>
  );
}

export function ArticleActions() {
  const iconButton =
    "grid h-8 w-8 place-items-center rounded-sm transition-colors hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";

  return (
    <div className="flex items-center gap-1 text-[10px]">
      <button type="button" className="rounded-sm px-2 py-2 hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40">
        Save
      </button>
      <button type="button" aria-label="Bookmark article" className={iconButton}>
        <BookmarkIcon />
      </button>
      <button type="button" className="rounded-sm px-2 py-2 hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40">
        Share
      </button>
      <button type="button" aria-label="Share article" className={iconButton}>
        <ShareIcon />
      </button>
      <button type="button" aria-label="More article actions" className={`${iconButton} text-lg tracking-widest`}>
        ···
      </button>
    </div>
  );
}
