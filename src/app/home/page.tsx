"use client";

import type { ComponentType } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Award,
  BarChart3,
  Heart,
  Lightbulb,
  Loader2,
  MessageCircle,
  Paperclip,
  PenSquare,
  Rocket,
  Share2,
  Sparkles,
  Video,
} from "lucide-react";

import type { ApiPoll, ApiPollOption, ApiPost } from "@/services/feed.service";
import {
  createPost,
  getHomeFeed,
  getPollResults,
  voteOnPoll,
} from "@/services/feed.service";

import "./home.css";

type ComposerTabKey = "update" | "video" | "poll" | "attach";

interface ComposerTab {
  key: ComposerTabKey;
  label: string;
  icon: ComponentType<{ className?: string }>;
  disabled?: boolean;
}

interface QuickTag {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
}

interface FeedLoadState {
  isInitialLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
}

const composerTabs: ComposerTab[] = [
  { key: "update", label: "Update", icon: PenSquare },
  { key: "video", label: "Video", icon: Video, disabled: true },
  { key: "poll", label: "Poll", icon: BarChart3, disabled: true },
  { key: "attach", label: "Attach", icon: Paperclip, disabled: true },
];

const quickTags: QuickTag[] = [
  { label: "Currently Working On", value: "currently-working", icon: Sparkles },
  { label: "Problem I’m Solving", value: "problem-solving", icon: Lightbulb },
  { label: "Learning Journey", value: "learning-journey", icon: Rocket },
  { label: "Milestone Achieved", value: "milestone-achieved", icon: Award },
];

const quickTagLabelByValue = quickTags.reduce<Record<string, string>>(
  (accumulator, tag) => {
    accumulator[tag.value] = tag.label;
    return accumulator;
  },
  {},
);

const classNames = (
  ...values: Array<string | false | null | undefined>
): string => values.filter(Boolean).join(" ");

const combinePoll = (previous: ApiPoll | null | undefined, next: ApiPoll | null) => {
  if (!next) return previous ?? null;
  if (!previous) return next;

  return {
    ...previous,
    ...next,
    prompt: next.prompt ?? previous.prompt,
    allowMultiple: next.allowMultiple ?? previous.allowMultiple,
    options: next.options && next.options.length > 0 ? next.options : previous.options,
    selectedOptionIds:
      next.selectedOptionIds && next.selectedOptionIds.length > 0
        ? next.selectedOptionIds
        : previous.selectedOptionIds,
    hasVoted: next.hasVoted ?? previous.hasVoted,
    totalVotes:
      typeof next.totalVotes === "number" ? next.totalVotes : previous.totalVotes,
  };
};

const toRelativeTime = (value?: string | null) => {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes === 1) return "1 minute ago";
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours === 1) return "1 hour ago";
  if (diffHours < 24) return `${diffHours} hours ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks === 1) return "1 week ago";
  if (diffWeeks < 5) return `${diffWeeks} weeks ago`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return "1 month ago";
  if (diffMonths < 12) return `${diffMonths} months ago`;

  const diffYears = Math.floor(diffDays / 365);
  if (diffYears === 1) return "1 year ago";
  return `${diffYears} years ago`;
};

const initialsFromName = (name?: string | null) => {
  if (!name) return "U";
  const words = name
    .split(" ")
    .map((word) => word.trim())
    .filter(Boolean);
  if (words.length === 0) return name.slice(0, 2).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] ?? ""}${words[words.length - 1][0] ?? ""}`.toUpperCase();
};

const getFirstNonEmpty = (
  ...values: Array<string | null | undefined>
): string | undefined => values.find((value) => Boolean(value)) ?? undefined;

const formatVisibility = (value?: string | null) => {
  if (!value) return undefined;
  const normalized = value.replace(/[_-]+/g, " ");
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const formatTagLabel = (value: string): string =>
  quickTagLabelByValue[value] ?? value.replace(/[_-]+/g, " ");

const mergePosts = (current: ApiPost[], incoming: ApiPost[]): ApiPost[] => {
  if (incoming.length === 0) {
    return current;
  }

  const merged = [...current];
  incoming.forEach((item) => {
    const index = merged.findIndex((existing) => existing.id === item.id);
    if (index >= 0) {
      merged[index] = item;
    } else {
      merged.push(item);
    }
  });
  return merged;
};

export default function HomePage() {
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

  return (
    <section className="home-page" aria-labelledby="home-heading">
      <div className="home-feed-shell">
        <header className="home-heading">
          <div>
            <p className="home-heading__eyebrow">
              <Sparkles aria-hidden className="home-heading__icon" />
              Your community hub
            </p>
            <h1 id="home-heading">Welcome back! Ready to share something new?</h1>
            <p className="home-heading__subtitle">
              Celebrate wins, ask for help, and keep your peers in the loop.
            </p>
          </div>
          <Link className="home-heading__cta" href="/tracker">
            Go to tracker
          </Link>
        </header>

        <article className="home-compose-card" aria-label="Share an update">
          <header className="home-compose-card__header">
            <h2>Share your progress, challenges, or what you&apos;re learning...</h2>
            <p>Inspire your peers with a quick update or ask for feedback.</p>
          </header>

          <div className="home-compose-tabs" role="tablist" aria-label="Share options">
            {composerTabs.map(({ key, label, icon: Icon, disabled }) => {
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={classNames(
                    "home-compose-tab",
                    isActive && "home-compose-tab--active",
                    disabled && "home-compose-tab--disabled",
                  )}
                  onClick={() => setActiveTab(key)}
                >
                  <Icon className="home-compose-tab__icon" aria-hidden />
                  {label}
                </button>
              );
            })}
          </div>

          <div className="home-compose-card__body">
            <div className="home-avatar" aria-hidden>
              {initialsFromName("User")}
            </div>
            <textarea
              value={composerText}
              onChange={(event) => setComposerText(event.target.value)}
              className="home-compose-card__textarea"
              placeholder={composerPlaceholder}
              disabled={activeTab !== "update"}
              aria-label="What’s new?"
              maxLength={800}
            />
          </div>

          <footer className="home-compose-card__footer">
            <div className="home-compose-tags" role="group" aria-label="Add a quick tag">
              {quickTags.map(({ label, value, icon: Icon }) => {
                const isActive = selectedTag === value;
                return (
                  <button
                    key={value}
                    type="button"
                    className={classNames(
                      "home-tag-button",
                      isActive && "home-tag-button--active",
                    )}
                    onClick={() =>
                      setSelectedTag((current) => (current === value ? null : value))
                    }
                    aria-pressed={isActive}
                  >
                    <Icon className="home-tag-button__icon" aria-hidden />
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="home-compose-actions">
              {composerError && (
                <p className="home-compose-error" role="alert">
                  {composerError}
                </p>
              )}

              {disabledTabReason && (
                <p className="home-compose-hint">{disabledTabReason}</p>
              )}

              <button
                type="button"
                className="home-submit-button"
                onClick={handleSubmit}
                disabled={!canSubmit}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="home-submit-button__icon" aria-hidden />
                    Sharing...
                  </>
                ) : (
                  "Share update"
                )}
              </button>
            </div>
          </footer>
        </article>

        {loadState.error && !loadState.isInitialLoading && (
          <div className="home-error" role="alert">
            <p>{loadState.error}</p>
            <button type="button" onClick={() => loadFeed()} className="home-error__retry">
              Try again
            </button>
          </div>
        )}

        {loadState.isInitialLoading ? (
          <FeedSkeleton />
        ) : feedItems.length === 0 ? (
          <EmptyFeedState />
        ) : (
          <div className="home-feed-list" aria-live="polite">
            {feedItems.map((post) => (
              <FeedItem
                key={post.id}
                post={post}
                pollError={pollErrors[post.id]}
                pollLoading={pollLoading[post.id]}
                onVote={(optionId) => post.poll && handleVote(post.id, post.poll, optionId)}
              />
            ))}
          </div>
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
}

interface FeedItemProps {
  post: ApiPost;
  pollError?: string;
  pollLoading?: boolean;
  onVote: (optionId: string) => void;
}

function FeedItem({ post, pollError, pollLoading, onVote }: FeedItemProps) {
  const authorName = getFirstNonEmpty(post.author?.name, post.author?.handle, "Unknown member");
  const authorHeadline = getFirstNonEmpty(post.author?.headline, post.author?.title);
  const statusSource = getFirstNonEmpty(post.statusBadge, post.topics?.[0], post.tags?.[0]);
  const statusBadge = statusSource ? formatTagLabel(statusSource) : undefined;
  const visibilityLabel = formatVisibility(post.visibility);

  return (
    <article className="home-feed-card">
      <header className="home-feed-card__header">
        <div className="home-feed-card__author">
          <div className="home-avatar home-avatar--sm" aria-hidden>
            {initialsFromName(post.author?.name)}
          </div>
          <div>
            <p className="home-feed-card__author-name">{authorName}</p>
            <p className="home-feed-card__meta">
              <span>{toRelativeTime(post.createdAt)}</span>
              {visibilityLabel && <span className="home-feed-card__dot" aria-hidden />}
              {visibilityLabel && <span>{visibilityLabel}</span>}
              {authorHeadline && <span className="home-feed-card__headline">{authorHeadline}</span>}
            </p>
          </div>
        </div>

        {statusBadge && <span className="home-status-pill">{statusBadge}</span>}
      </header>

      {post.text && <p className="home-feed-card__text">{post.text}</p>}

      {post.tags && post.tags.length > 0 && (
        <ul className="home-topic-list" aria-label="Topics">
          {post.tags.map((tag) => (
            <li key={`${post.id}-${tag}`} className="home-topic-chip">
              #{formatTagLabel(tag.replace(/^#/, ""))}
            </li>
          ))}
        </ul>
      )}

      {post.poll && (
        <PollBlock
          postId={post.id}
          poll={post.poll}
          onVote={onVote}
          isSubmitting={Boolean(pollLoading)}
          error={pollError}
        />
      )}

      <footer className="home-feed-card__footer">
        <button type="button" className="home-feed-card__action" aria-label="Likes">
          <Heart aria-hidden />
          <span>{post.stats?.likes ?? 0}</span>
        </button>
        <button type="button" className="home-feed-card__action" aria-label="Comments">
          <MessageCircle aria-hidden />
          <span>{post.stats?.comments ?? 0}</span>
        </button>
        <button type="button" className="home-feed-card__action" aria-label="Shares">
          <Share2 aria-hidden />
          <span>{post.stats?.shares ?? 0}</span>
        </button>
      </footer>
    </article>
  );
}

interface PollBlockProps {
  postId: string;
  poll: ApiPoll;
  onVote: (optionId: string) => void;
  isSubmitting: boolean;
  error?: string;
}

function PollBlock({ postId, poll, onVote, isSubmitting, error }: PollBlockProps) {
  const totalVotes = useMemo(() => {
    if (typeof poll.totalVotes === "number" && poll.totalVotes >= 0) {
      return poll.totalVotes;
    }
    return poll.options.reduce((sum, option) => sum + (option.votes ?? 0), 0);
  }, [poll.options, poll.totalVotes]);

  const hasVoted = poll.hasVoted ?? Boolean(poll.selectedOptionIds?.length);

  const handleVoteInternal = useCallback(
    (optionId: string) => {
      if (hasVoted || isSubmitting) return;
      onVote(optionId);
    },
    [hasVoted, isSubmitting, onVote],
  );

  return (
    <section className="home-poll" aria-label="Poll">
      {poll.prompt && <h3 className="home-poll__prompt">{poll.prompt}</h3>}

      <ul className="home-poll__options">
        {poll.options.map((option) => (
          <PollOption
            key={`${postId}-${option.id}`}
            option={option}
            totalVotes={totalVotes}
            disabled={hasVoted}
            isSubmitting={isSubmitting}
            isSelected={Boolean(
              poll.selectedOptionIds?.includes(option.id) || option.isSelected,
            )}
            onVote={() => handleVoteInternal(option.id)}
          />
        ))}
      </ul>

      <div className="home-poll__footer">
        <span>{totalVotes} vote{totalVotes === 1 ? "" : "s"}</span>
        {poll.allowMultiple && <span>Multiple selections allowed</span>}
      </div>

      {error && (
        <p className="home-poll__error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

interface PollOptionProps {
  option: ApiPollOption;
  totalVotes: number;
  disabled: boolean;
  isSubmitting: boolean;
  isSelected: boolean;
  onVote: () => void;
}

function PollOption({
  option,
  totalVotes,
  disabled,
  isSubmitting,
  isSelected,
  onVote,
}: PollOptionProps) {
  const percentage = useMemo(() => {
    if (typeof option.percentage === "number") {
      return Math.round(option.percentage);
    }
    if (!totalVotes) return 0;
    return Math.round(((option.votes ?? 0) / totalVotes) * 100);
  }, [option.percentage, option.votes, totalVotes]);

  return (
    <li className="home-poll-option">
      <button
        type="button"
        onClick={onVote}
        disabled={disabled || isSubmitting}
        className={classNames(
          "home-poll-option__button",
          isSelected && "home-poll-option__button--selected",
          disabled && "home-poll-option__button--disabled",
        )}
      >
        <span className="home-poll-option__label">{option.text}</span>
        <span className="home-poll-option__stats">
          {percentage}% • {option.votes ?? 0} vote{(option.votes ?? 0) === 1 ? "" : "s"}
        </span>
      </button>
      <div className="home-poll-option__progress" aria-hidden>
        <div style={{ width: `${Math.min(Math.max(percentage, 0), 100)}%` }} />
      </div>
    </li>
  );
}

function FeedSkeleton() {
  return (
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
}

function EmptyFeedState() {
  return (
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
}
