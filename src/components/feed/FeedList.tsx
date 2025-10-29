import type { ApiPoll, ApiPost } from "@/services/feed.service";

import { FeedItem } from "./FeedItem";

interface FeedListProps {
  items: ApiPost[];
  pollErrors: Record<string, string>;
  pollLoading: Record<string, boolean>;
  onVote: (postId: string, poll: ApiPoll, optionId: string) => void;
}

export const FeedList = ({ items, pollErrors, pollLoading, onVote }: FeedListProps) => (
  <div className="home-feed-list" aria-live="polite">
    {items.map((post) => (
      <FeedItem
        key={post.id}
        post={post}
        pollError={pollErrors[post.id]}
        pollLoading={pollLoading[post.id]}
        onVote={(optionId) => {
          if (post.poll) {
            onVote(post.id, post.poll, optionId);
          }
        }}
      />
    ))}
  </div>
);
