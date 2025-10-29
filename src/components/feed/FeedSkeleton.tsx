export const FeedSkeleton = () => (
  <div className="home-skeleton-list" aria-hidden>
    {[0, 1, 2].map((item) => (
      <div key={item} className="home-skeleton-card">
        <div className="home-skeleton-avatar" />
        <div className="home-skeleton-content">
          <div className="home-skeleton-line" />
          <div className="home-skeleton-line home-skeleton-line--short" />
          <div className="home-skeleton-line" />
        </div>
      </div>
    ))}
  </div>
);

export const EmptyFeedState = () => (
  <div className="home-empty">
    <h3>No updates yet</h3>
    <p>
      Be the first to share how your journey is going. A quick update can spark new
      connections and support from peers.
    </p>
    <p className="home-empty__hint">
      Tip: use the quick tags above to highlight what kind of update you&apos;re posting.
    </p>
  </div>
);
