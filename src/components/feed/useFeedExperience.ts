import { useCallback, useEffect, useState } from "react";

import type { ApiPoll, ApiPost } from "@/services/feed.service";
import {
  createPost,
  getHomeFeed,
  getPollResults,
  likePost,
  unlikePost,
  voteOnPoll,
} from "@/services/feed.service";

import { combinePoll, mergePosts } from "./utils";

export interface FeedLoadState {
  isInitialLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
}

export interface UseFeedExperienceResult {
  feedItems: ApiPost[];
  loadState: FeedLoadState;
  nextCursor: string | null;
  pollErrors: Record<string, string>;
  likeLoading: Record<string, boolean>;
  likeErrors: Record<string, string>;
  pollLoading: Record<string, boolean>;
  isCreatingPost: boolean;
  createPostEntry: (
    payload: Parameters<typeof createPost>[0]
  ) => Promise<{ success: boolean; error?: string; post?: ApiPost | null }>;
  handleLoadMore: () => Promise<void>;
  reloadFeed: () => Promise<void>;
  handleVote: (
    postId: string,
    poll: ApiPoll,
    optionId: string
  ) => Promise<void>;
}

export const useFeedExperience = (): UseFeedExperienceResult => {
  const [feedItems, setFeedItems] = useState<ApiPost[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<FeedLoadState>({
    isInitialLoading: true,
    isLoadingMore: false,
    error: null,
  });
  const [pollErrors, setPollErrors] = useState<Record<string, string>>({});
  const [pollLoading, setPollLoading] = useState<Record<string, boolean>>({});
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [likeLoading, setLikeLoading] = useState<Record<string, boolean>>({});
  const [likeErrors, setLikeErrors] = useState<Record<string, string>>({});

  const [likedLocal, setLikedLocal] = useState<Record<string, boolean>>({});
  const [likesDelta, setLikesDelta] = useState<Record<string, number>>({});

  const getEffectiveLikedState = useCallback(
    (postId: string) => {
      if (Object.prototype.hasOwnProperty.call(likedLocal, postId)) {
        return Boolean(likedLocal[postId]);
      }
      const post = feedItems.find((p) => p.id === postId);
      return Boolean(post?.raw?.likedByMe);
    },
    [feedItems, likedLocal]
  );

  const fetchPollDetails = useCallback(async (posts: ApiPost[]) => {
    const pollPosts = posts.filter((post) => Boolean(post.poll && post.id));
    if (pollPosts.length === 0) {
      return;
    }

    try {
      const updates = await Promise.all(
        pollPosts.map(async (post) => {
          try {
            const poll = await getPollResults(post.id);
            return { postId: post.id, poll } as const;
          } catch (error) {
            console.error("Failed to load poll results", error);
            return { postId: post.id, poll: post.poll ?? null } as const;
          }
        })
      );

      setFeedItems((previous) =>
        previous.map((post) => {
          const update = updates.find((item) => item.postId === post.id);
          if (!update) return post;
          return { ...post, poll: combinePoll(post.poll, update.poll) };
        })
      );
    } catch (error) {
      console.error("Unexpected error while resolving poll results", error);
    }
  }, []);

  const getDisplayedLikes = useCallback(
    (postId: string) => {
      const base = feedItems.find((p) => p.id === postId)?.counts?.likes ?? 0;
      return base + (likesDelta[postId] ?? 0);
    },
    [feedItems, likesDelta]
  );

  const isLocallyLiked = useCallback(
    (postId: string) => getEffectiveLikedState(postId),
    [getEffectiveLikedState]
  );

  const handleLike = useCallback(
    async (postId: string) => {
      if (likeLoading[postId]) return;

      const hadLocalOverride = Object.prototype.hasOwnProperty.call(
        likedLocal,
        postId
      );
      const previousLocal = likedLocal[postId];
      const currentlyLiked = getEffectiveLikedState(postId);
      if (currentlyLiked) return;

      const nextLiked = true;
      const delta = 1;

      setLikeErrors((p) => ({ ...p, [postId]: "" }));
      setLikeLoading((p) => ({ ...p, [postId]: true }));
      setLikedLocal((p) => ({ ...p, [postId]: nextLiked }));
      setLikesDelta((p) => ({ ...p, [postId]: (p[postId] ?? 0) + delta }));

      try {
        const updated = await likePost(postId); // server is source of truth
        if (updated) {
          // replace post with server values so counts are correct
          setFeedItems((prev) =>
            prev.map((p) => (p.id === postId ? { ...p, ...updated } : p))
          );
          // clear local delta since server counts are now applied
          setLikesDelta((p) => ({ ...p, [postId]: 0 }));
          setLikedLocal((p) => {
            const next = { ...p };
            delete next[postId];
            return next;
          });
        }
      } catch (e) {
        // rollback on failure
        setLikedLocal((p) => {
          if (hadLocalOverride) {
            return { ...p, [postId]: Boolean(previousLocal) };
          }
          const next = { ...p };
          delete next[postId];
          return next;
        });
        setLikesDelta((p) => ({ ...p, [postId]: (p[postId] ?? 0) - delta }));
        setLikeErrors((p) => ({
          ...p,
          [postId]: e instanceof Error ? e.message : "Couldn’t update like",
        }));
      } finally {
        setLikeLoading((p) => ({ ...p, [postId]: false }));
      }
    },
    [getEffectiveLikedState, likeLoading, likedLocal]
  );

  const handleUnlike = useCallback(
    async (postId: string) => {
      if (likeLoading[postId]) return;

      const hadLocalOverride = Object.prototype.hasOwnProperty.call(
        likedLocal,
        postId
      );
      const previousLocal = likedLocal[postId];
      const currentlyLiked = getEffectiveLikedState(postId);
      if (!currentlyLiked) return;

      const nextLiked = false;
      const delta = -1;

      setLikeErrors((p) => ({ ...p, [postId]: "" }));
      setLikeLoading((p) => ({ ...p, [postId]: true }));
      setLikedLocal((p) => ({ ...p, [postId]: nextLiked }));
      setLikesDelta((p) => ({ ...p, [postId]: (p[postId] ?? 0) + delta }));

      try {
        const updated = await unlikePost(postId); // server is source of truth
        if (updated) {
          setFeedItems((prev) =>
            prev.map((p) => (p.id === postId ? { ...p, ...updated } : p))
          );
          setLikesDelta((p) => ({ ...p, [postId]: 0 }));
          setLikedLocal((p) => {
            const next = { ...p };
            delete next[postId];
            return next;
          });
        }
      } catch (e) {
        // rollback on failure
        setLikedLocal((p) => {
          if (hadLocalOverride) {
            return { ...p, [postId]: Boolean(previousLocal) };
          }
          const next = { ...p };
          delete next[postId];
          return next;
        });
        setLikesDelta((p) => ({ ...p, [postId]: (p[postId] ?? 0) - delta }));
        setLikeErrors((p) => ({
          ...p,
          [postId]: e instanceof Error ? e.message : "Couldn’t update like",
        }));
      } finally {
        setLikeLoading((p) => ({ ...p, [postId]: false }));
      }
    },
    [getEffectiveLikedState, likeLoading, likedLocal]
  );

  const loadFeed = useCallback(
    async (cursor?: string | null) => {
      setLoadState((previous) => ({
        ...previous,
        isInitialLoading: !cursor,
        isLoadingMore: Boolean(cursor),
        error: cursor ? previous.error : null,
      }));

      try {
        const response = await getHomeFeed({
          size: 10,
          cursor: cursor ?? undefined,
        });
        setNextCursor(response.nextCursor);

        setFeedItems((previous) =>
          cursor ? mergePosts(previous, response.items) : [...response.items]
        );

        if (response.items.length > 0) {
          fetchPollDetails(response.items);
        }

        setLoadState((previous) => ({
          ...previous,
          isInitialLoading: false,
          isLoadingMore: false,
          error: null,
        }));
      } catch (error) {
        console.error("Failed to load home feed", error);
        setLoadState((previous) => ({
          ...previous,
          isInitialLoading: false,
          isLoadingMore: false,
          error:
            error instanceof Error
              ? error.message
              : "Something went wrong while fetching the feed.",
        }));
      }
    },
    [fetchPollDetails]
  );

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const createPostEntry = useCallback<
    UseFeedExperienceResult["createPostEntry"]
  >(async (payload) => {
    setIsCreatingPost(true);
    try {
      const created = await createPost(payload);
      if (created) {
        setFeedItems((previous) => [created, ...previous]);
      }
      return { success: true, post: created };
    } catch (error) {
      console.error("Failed to create post", error);
      const message =
        error instanceof Error
          ? error.message
          : "We couldn’t share your update. Please try again.";
      return { success: false, error: message, post: null };
    } finally {
      setIsCreatingPost(false);
    }
  }, []);

  const handleLoadMore = useCallback(async () => {
    if (!nextCursor) return;
    await loadFeed(nextCursor);
  }, [loadFeed, nextCursor]);

  const reloadFeed = useCallback(async () => {
    await loadFeed();
  }, [loadFeed]);

  const handleVote = useCallback(
    async (postId: string, poll: ApiPoll, optionId: string) => {
      if (!postId) return;

      setPollErrors((previous) => ({
        ...previous,
        [postId]: "",
      }));

      setPollLoading((previous) => ({
        ...previous,
        [postId]: true,
      }));

      try {
        const updated = await voteOnPoll(postId, [optionId]);
        const pollResult = updated ?? (await getPollResults(postId));
        const selected = new Set(poll.selectedOptionIds ?? []);
        selected.add(optionId);

        setFeedItems((previous) =>
          previous.map((item) =>
            item.id === postId
              ? {
                  ...item,
                  poll: combinePoll(
                    {
                      ...poll,
                      hasVoted: true,
                      selectedOptionIds: Array.from(selected),
                    },
                    pollResult
                  ),
                }
              : item
          )
        );
      } catch (error) {
        console.error("Failed to vote on poll", error);
        setPollErrors((previous) => ({
          ...previous,
          [postId]:
            error instanceof Error
              ? error.message
              : "We couldn’t record your vote. Please try again.",
        }));
      } finally {
        setPollLoading((previous) => ({
          ...previous,
          [postId]: false,
        }));
      }
    },
    []
  );

  return {
    feedItems,
    loadState,
    nextCursor,
    pollErrors,
    pollLoading,
    likeErrors,
    likeLoading,
    isCreatingPost,
    createPostEntry,
    handleLoadMore,
    reloadFeed,
    handleVote,
    handleLike,
    handleUnlike,
    getDisplayedLikes,
    isLocallyLiked,
  };
};
