import type { ApiPoll, ApiPost } from "@/services/feed.service";
import { FeedItem } from "./FeedItem";

interface FeedListProps {
  items: ApiPost[];
  pollErrors: Record<string, string>;
  pollLoading: Record<string, boolean>;
  onVote: (postId: string, poll: ApiPoll, optionId: string) => void;
  onLike: (postId: string) => void;
  onUnlike: (postId: string) => void;
  likeLoading: Record<string, boolean>;
  likeErrors: Record<string, string>;
  getDisplayedLikes: (postId: string) => number;
  isLocallyLiked: (postId: string) => boolean;
}

export const FeedList = ({
  items,
  pollErrors,
  pollLoading,
  onVote,
  onLike,
  onUnlike,
  likeLoading,
  likeErrors,
  getDisplayedLikes,
  isLocallyLiked,
}: FeedListProps) => (
  <div className="home-feed-list" aria-live="polite">
    {items.map((post) => (
      <FeedItem
        key={post.id}
        post={post}
        pollError={pollErrors[post.id]}
        pollLoading={pollLoading[post.id]}
        onVote={(optionId) => {
          if (post.poll) onVote(post.id, post.poll, optionId);
        }}
        onLike={() => onLike(post.id)}
        onUnlike={() => onUnlike(post.id)}
        likeLoading={likeLoading[post.id]}
        likeError={likeErrors[post.id]}
        likeCount={getDisplayedLikes(post.id)}
        isLiked={isLocallyLiked(post.id)}
      />
    ))}
  </div>
);
