import { useCallback, useEffect, useMemo, useState } from "react";

import type { ApiPoll, ApiPost } from "@/services/feed.service";
import {
  createPost,
  getHomeFeed,
  getPollResults,
  voteOnPoll,
} from "@/services/feed.service";

import { quickTags } from "./constants";
import type { ComposerTabKey } from "./types";
import { combinePoll, mergePosts } from "./utils";

export interface FeedLoadState {
  isInitialLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
}

export interface UseFeedExperienceResult {
  activeTab: ComposerTabKey;
  setActiveTab: (tab: ComposerTabKey) => void;
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
  composerText: string;
  setComposerText: (value: string) => void;
  composerError: string | null;
  isSubmitting: boolean;
  canSubmit: boolean;
  composerPlaceholder: string;
  disabledTabReason: string | null;
  feedItems: ApiPost[];
  loadState: FeedLoadState;
  nextCursor: string | null;
  pollErrors: Record<string, string>;
  pollLoading: Record<string, boolean>;
  handleSubmit: () => Promise<void>;
  handleLoadMore: () => Promise<void>;
  reloadFeed: () => Promise<void>;
  handleVote: (postId: string, poll: ApiPoll, optionId: string) => Promise<void>;
}

export const useFeedExperience = (): UseFeedExperienceResult => {
  const [activeTab, setActiveTab] = useState<ComposerTabKey>("update");
  const [selectedTag, setSelectedTag] = useState<string | null>(quickTags[0]?.value ?? null);
  const [composerText, setComposerText] = useState("");
  const [composerError, setComposerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedItems, setFeedItems] = useState<ApiPost[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<FeedLoadState>({
    isInitialLoading: true,
    isLoadingMore: false,
    error: null,
  });
  const [pollErrors, setPollErrors] = useState<Record<string, string>>({});
  const [pollLoading, setPollLoading] = useState<Record<string, boolean>>({});

  const disabledTabReason = useMemo(
    () =>
      activeTab === "update"
        ? null
        : "This option will be available soon. Switch back to Update to share a post.",
    [activeTab],
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
        }),
      );

      setFeedItems((previous) =>
        previous.map((post) => {
          const update = updates.find((item) => item.postId === post.id);
          if (!update) return post;
          return { ...post, poll: combinePoll(post.poll, update.poll) };
        }),
      );
    } catch (error) {
      console.error("Unexpected error while resolving poll results", error);
    }
  }, []);

  const loadFeed = useCallback(
    async (cursor?: string | null) => {
      setLoadState((previous) => ({
        ...previous,
        isInitialLoading: !cursor,
        isLoadingMore: Boolean(cursor),
        error: cursor ? previous.error : null,
      }));

      try {
        const response = await getHomeFeed({ size: 10, cursor: cursor ?? undefined });
        setNextCursor(response.nextCursor);

        setFeedItems((previous) =>
          cursor ? mergePosts(previous, response.items) : [...response.items],
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
    [fetchPollDetails],
  );

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const composerPlaceholder = useMemo(() => {
    switch (activeTab) {
      case "video":
        return "Share a video update (coming soon)";
      case "poll":
        return "Ask a question with a poll (coming soon)";
      case "attach":
        return "Share a file or deck (coming soon)";
      default:
        return "Start writing your update...";
    }
  }, [activeTab]);

  const canSubmit = useMemo(() => {
    if (activeTab !== "update") return false;
    return composerText.trim().length > 0 && !isSubmitting;
  }, [activeTab, composerText, isSubmitting]);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) {
      return;
    }

    setComposerError(null);
    setIsSubmitting(true);

    try {
      const created = await createPost({
        type: "text",
        text: composerText.trim(),
        tags: selectedTag ? [selectedTag] : undefined,
        visibility: "public",
      });

      if (created) {
        setFeedItems((previous) => [created, ...previous]);
      }

      setComposerText("");
    } catch (error) {
      console.error("Failed to create post", error);
      setComposerError(
        error instanceof Error
          ? error.message
          : "We couldn’t share your update. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [canSubmit, composerText, selectedTag]);

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
                    { ...poll, hasVoted: true, selectedOptionIds: Array.from(selected) },
                    pollResult,
                  ),
                }
              : item,
          ),
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
    [],
  );

  return {
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
  };
};
