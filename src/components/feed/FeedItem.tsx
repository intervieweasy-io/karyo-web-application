import { useCallback, useMemo } from "react";
import { Heart, MessageCircle, Share2 } from "lucide-react";

import type { ApiPoll, ApiPollOption, ApiPost } from "@/services/feed.service";

import {
  classNames,
  formatTagLabel,
  formatVisibility,
  getFirstNonEmpty,
  initialsFromName,
  toRelativeTime,
} from "./utils";

interface FeedItemProps {
  post: ApiPost;
  pollError?: string;
  pollLoading?: boolean;
  onVote: (optionId: string) => void;

  // Likes (ephemeral – provided by parent)
  onLike: () => void;
  onUnlike: () => void;
  likeLoading?: boolean;
  likeError?: string;
  likeCount?: number;
  isLiked?: boolean;
}

export const FeedItem = ({
  post,
  pollError,
  pollLoading,
  onVote,
  onLike,
  onUnlike,
  likeLoading,
  likeError,
  likeCount,
  isLiked,
}: FeedItemProps) => {
  const authorName = getFirstNonEmpty(post.author?.name, post.author?.handle, "Unknown member");
  const authorHeadline = getFirstNonEmpty(post.author?.headline, post.author?.title);
  const statusSource = getFirstNonEmpty(post.statusBadge, post.topics?.[0], post.tags?.[0]);
  const statusBadge = statusSource ? formatTagLabel(statusSource) : undefined;
  const visibilityLabel = formatVisibility(post.visibility);

  const displayedLikes = typeof likeCount === "number" ? likeCount : (post.counts?.likes ?? 0);
  const effectiveLiked = typeof isLiked === "boolean" ? isLiked : Boolean(post?.raw?.likedByMe);

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
        <button
          type="button"
          className={classNames(
            "home-feed-card__action",
            effectiveLiked && "is-active"
          )}
          aria-label={effectiveLiked ? "Unlike" : "Like"}
          aria-pressed={effectiveLiked}
          disabled={Boolean(likeLoading)}
          onClick={effectiveLiked ? onUnlike : onLike}
        >
          <Heart aria-hidden />
          <span>{displayedLikes}</span>
        </button>

        <button type="button" className="home-feed-card__action" aria-label="Comments">
          <MessageCircle aria-hidden />
          <span>{post.counts?.comments ?? 0}</span>
        </button>

        <button type="button" className="home-feed-card__action" aria-label="Shares">
          <Share2 aria-hidden />
          <span>{post.counts?.shares ?? 0}</span>
        </button>
      </footer>

      {likeError && (
        <p className="home-poll__error" role="alert">
          {likeError}
        </p>
      )}
    </article>
  );
};

interface PollBlockProps {
  postId: string;
  poll: ApiPoll;
  onVote: (optionId: string) => void;
  isSubmitting: boolean;
  error?: string;
}

const PollBlock = ({ postId, poll, onVote, isSubmitting, error }: PollBlockProps) => {
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
            isSelected={Boolean(poll.selectedOptionIds?.includes(option.id) || option.isSelected)}
            onVote={() => handleVoteInternal(option.id)}
          />
        ))}
      </ul>

      <div className="home-poll__footer">
        <span>
          {totalVotes} vote{totalVotes === 1 ? "" : "s"}
        </span>
        {poll.allowMultiple && <span>Multiple selections allowed</span>}
      </div>

      {error && (
        <p className="home-poll__error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
};

interface PollOptionProps {
  option: ApiPollOption;
  totalVotes: number;
  disabled: boolean;
  isSubmitting: boolean;
  isSelected: boolean;
  onVote: () => void;
}

const PollOption = ({ option, totalVotes, disabled, isSubmitting, isSelected, onVote }: PollOptionProps) => {
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
};
