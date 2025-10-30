"use client";

import { useCallback, useState } from "react";

import { Sparkles } from "lucide-react";

import type { CreatePostPayload } from "@/services/feed.service";

import { FeedComposer } from "./FeedComposer";
import { FeedComposerModal } from "./FeedComposerModal";
import { FeedList } from "./FeedList";
import { EmptyFeedState, FeedSkeleton } from "./FeedSkeleton";
import { composerTabs, quickTags } from "./constants";
import { useFeedExperience } from "./useFeedExperience";

export const FeedExperience = () => {
  const {
    feedItems,
    loadState,
    nextCursor,
    pollErrors,
    pollLoading,
    isCreatingPost,
    createPostEntry,
    handleLoadMore,
    reloadFeed,
    handleVote,
    handleLike,
    handleUnlike,
    likeLoading,
    likeErrors,
    getDisplayedLikes,
    isLocallyLiked,
  } = useFeedExperience();

  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [lastSelectedTag, setLastSelectedTag] = useState<string | null>(
    quickTags[0]?.value ?? null
  );

  const handleSubmit = useCallback(
    async (payload: CreatePostPayload) => {
      const result = await createPostEntry(payload);
      if (result.success) {
        setIsComposerOpen(false);
        if (payload.tags && payload.tags.length > 0) {
          setLastSelectedTag(payload.tags[0]);
        }
      }
      return result;
    },
    [createPostEntry]
  );

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
          onOpen={() => setIsComposerOpen(true)}
          quickTags={quickTags}
          lastSelectedTag={lastSelectedTag}
        />

        <FeedComposerModal
          open={isComposerOpen}
          onOpenChange={setIsComposerOpen}
          composerTabs={composerTabs}
          quickTags={quickTags}
          isSubmitting={isCreatingPost}
          initialTag={lastSelectedTag}
          onSubmit={handleSubmit}
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
            onLike={handleLike}
            onUnlike={handleUnlike}
            likeLoading={likeLoading}
            likeErrors={likeErrors}
            getDisplayedLikes={getDisplayedLikes}
            isLocallyLiked={isLocallyLiked}
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
