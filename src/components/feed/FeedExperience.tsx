"use client";

import Link from "next/link";

import { Sparkles } from "lucide-react";

import { FeedComposer } from "./FeedComposer";
import { FeedList } from "./FeedList";
import { EmptyFeedState, FeedSkeleton } from "./FeedSkeleton";
import { composerTabs, quickTags } from "./constants";
import { useFeedExperience } from "./useFeedExperience";

export const FeedExperience = () => {
  const {
    activeTab,
    setActiveTab,
    selectedTag,
    setSelectedTag,
    composerText,
    setComposerText,
    composerError,
    isSubmitting,
    canSubmit,
    composerPlaceholder,
    disabledTabReason,
    feedItems,
    loadState,
    nextCursor,
    pollErrors,
    pollLoading,
    handleSubmit,
    handleLoadMore,
    reloadFeed,
    handleVote,
  } = useFeedExperience();

  return (
    <section className="home-page" aria-labelledby="home-heading">
      <div className="home-feed-shell">
        <header className="home-heading">
          <div>
            <p className="home-heading__eyebrow">
              <Sparkles aria-hidden className="home-heading__icon" />
              Your community hub
            </p>
            <p className="home-heading__subtitle">
              Celebrate wins, ask for help, and keep your peers in the loop.
            </p>
          </div>
        </header>

        <FeedComposer
          composerTabs={composerTabs}
          quickTags={quickTags}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          disabledTabReason={disabledTabReason}
          composerText={composerText}
          onTextChange={setComposerText}
          placeholder={composerPlaceholder}
          composerError={composerError}
          selectedTag={selectedTag}
          onSelectTag={setSelectedTag}
          onSubmit={handleSubmit}
          canSubmit={canSubmit}
          isSubmitting={isSubmitting}
        />

        {loadState.error && !loadState.isInitialLoading && (
          <div className="home-error" role="alert">
            <p>{loadState.error}</p>
            <button type="button" onClick={reloadFeed} className="home-error__retry">
              Try again
            </button>
          </div>
        )}

        {loadState.isInitialLoading ? (
          <FeedSkeleton />
        ) : feedItems.length === 0 ? (
          <EmptyFeedState />
        ) : (
          <FeedList
            items={feedItems}
            pollErrors={pollErrors}
            pollLoading={pollLoading}
            onVote={handleVote}
          />
        )}

        {nextCursor && feedItems.length > 0 && (
          <button
            type="button"
            className="home-load-more"
            onClick={handleLoadMore}
            disabled={loadState.isLoadingMore}
          >
            {loadState.isLoadingMore ? "Loading more..." : "Load more updates"}
          </button>
        )}
      </div>
    </section>
  );
};

export default FeedExperience;
