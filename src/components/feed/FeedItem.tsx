import { useCallback, useEffect, useMemo, useState } from "react";
import { Heart, MessageCircle, Share2, Paperclip } from "lucide-react";
import type { ApiPoll, ApiPollOption, ApiPost } from "@/services/feed.service";
import {
  classNames,
  formatTagLabel,
  formatVisibility,
  getFirstNonEmpty,
  initialsFromName,
  toRelativeTime,
} from "./utils";
import { http } from "@/lib/http";

interface FeedItemProps {
  post: ApiPost;
  pollError?: string;
  pollLoading?: boolean;
  onVote: (optionId: string) => void;
  onLike: () => void;
  onUnlike: () => void;
  likeLoading?: boolean;
  likeError?: string;
  likeCount?: number;
  isLiked?: boolean;
}

/**
 * Main Feed Item
 */
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
  const [poll, setPoll] = useState<ApiPoll | undefined>(post.poll);
  const [pollSubmitting, setPollSubmitting] = useState(false);
  const [pollSubmitError, setPollSubmitError] = useState<string | undefined>();

  const authorName = getFirstNonEmpty(post.author?.name, post.author?.handle, "Unknown member");
  const authorHeadline = getFirstNonEmpty(post.author?.headline, post.author?.title);
  const statusSource = getFirstNonEmpty(post.statusBadge, post.topics?.[0], post.tags?.[0]);
  const statusBadge = statusSource ? formatTagLabel(statusSource) : undefined;
  const visibilityLabel = formatVisibility(post.visibility);

  const fallbackLikes = post.counts?.likes ?? 0;
  const displayedLikes = likeCount ?? fallbackLikes;
  const effectiveLiked = isLiked ?? Boolean(post.raw.likedByMe);

  const handleLikeClick = () => {
    if (likeLoading) return;
    effectiveLiked ? onUnlike() : onLike();
  };

  const handleVote = async (optionId: string) => {
    if (!poll || pollSubmitting) return;
    try {
      setPollSubmitting(true);
      setPollSubmitError(undefined);

      // Call vote API
      await http.post(`/api/posts/${post.id}/poll/vote`, { optionIds: [optionId] });

      // Fetch updated results
      const res = await http.get(`/api/posts/${post.id}/poll/results`);
      if (res) setPoll(res);
    } catch {
      setPollSubmitError("Failed to submit vote. Try again.");
    } finally {
      setPollSubmitting(false);
    }
  };

  useEffect(() => {
    if (post.poll) setPoll(post.poll);
  }, [post.poll]);

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

      {post.text && (
        <div
          className="home-feed-card__text"
          dangerouslySetInnerHTML={{
            __html: post.text.replace(/\n/g, "<br/>").replace(
              /(https?:\/\/[^\s]+)/g,
              (m) => `<a href="${m}" target="_blank" rel="noopener noreferrer">${m}</a>`
            ),
          }}
        />
      )}

      {post.media?.length ? <MediaPreview media={post.media} /> : null}

      {poll && (
        <PollBlock
          postId={post.id}
          poll={poll}
          onVote={handleVote}
          isSubmitting={pollSubmitting}
          error={pollSubmitError}
        />
      )}

      <footer className="home-feed-card__footer">
        <button
          type="button"
          className={classNames("home-feed-card__action", effectiveLiked && "is-active")}
          aria-label={effectiveLiked ? "Unlike" : "Like"}
          aria-pressed={effectiveLiked}
          disabled={Boolean(likeLoading)}
          onClick={handleLikeClick}
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

      {likeError && <p className="home-poll__error">{likeError}</p>}
    </article>
  );
};

/**
 * Poll Component
 */
const PollBlock = ({
  postId,
  poll,
  onVote,
  isSubmitting,
  error,
}: {
  postId: string;
  poll: ApiPoll;
  onVote: (id: string) => void;
  isSubmitting: boolean;
  error?: string;
}) => {
  const totalVotes = useMemo(() => {
    if (typeof poll.totalVotes === "number") return poll.totalVotes;
    return poll.options.reduce((a, o) => a + (o.votes ?? 0), 0);
  }, [poll]);

  const hasVoted = poll.hasVoted ?? Boolean(poll.selectedOptionIds?.length);

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
            isSelected={Boolean(poll.selectedOptionIds?.includes(option.id))}
            onVote={() => onVote(option.id)}
          />
        ))}
      </ul>

      <div className="home-poll__footer">
        <span>
          {totalVotes} vote{totalVotes === 1 ? "" : "s"}
        </span>
        {poll.allowMultiple && <span>Multiple selections allowed</span>}
      </div>

      {error && <p className="home-poll__error">{error}</p>}
    </section>
  );
};

const PollOption = ({
  option,
  totalVotes,
  disabled,
  isSubmitting,
  isSelected,
  onVote,
}: {
  option: ApiPollOption;
  totalVotes: number;
  disabled: boolean;
  isSubmitting: boolean;
  isSelected: boolean;
  onVote: () => void;
}) => {
  const percentage = useMemo(() => {
    if (typeof option.percentage === "number") return Math.round(option.percentage);
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
          disabled && "home-poll-option__button--disabled"
        )}
      >
        <span className="home-poll-option__label">{option.text}</span>
        <span className="home-poll-option__stats">
          {percentage}% • {option.votes ?? 0} vote{(option.votes ?? 0) === 1 ? "" : "s"}
        </span>
      </button>
      <div className="home-poll-option__progress">
        <div style={{ width: `${percentage}%` }} />
      </div>
    </li>
  );
};

/**
 * Media (image, video, file) Previews
 */
const MediaPreview = ({ media }: { media: ApiPost["media"] }) => {
  if (!media?.length) return null;

  return (
    <div className="home-media">
      {media.map((m, i) => {
        if (m.kind === "image")
          return (
            <img
              key={i}
              src={m.url}
              alt=""
              className="home-media__img"
              loading="lazy"
              onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
            />
          );
        if (m.kind === "video")
          return (
            <video key={i} controls className="home-media__video">
              <source src={m.url} />
              Your browser does not support video playback.
            </video>
          );
        return (
          <a key={i} href={m.url} target="_blank" rel="noopener noreferrer" className="home-media__file">
            <Paperclip size={18} />
            <span>{m.url.split("/").pop()}</span>
          </a>
        );
      })}
    </div>
  );
};
