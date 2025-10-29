import type { ApiPoll, ApiPost } from "@/services/feed.service";

import { quickTagLabelByValue } from "./constants";

export const classNames = (
  ...values: Array<string | false | null | undefined>
): string => values.filter(Boolean).join(" ");

export const combinePoll = (
  previous: ApiPoll | null | undefined,
  next: ApiPoll | null,
): ApiPoll | null => {
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
    totalVotes: typeof next.totalVotes === "number" ? next.totalVotes : previous.totalVotes,
  };
};

export const toRelativeTime = (value?: string | null) => {
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

export const initialsFromName = (name?: string | null) => {
  if (!name) return "U";
  const words = name
    .split(" ")
    .map((word) => word.trim())
    .filter(Boolean);
  if (words.length === 0) return name.slice(0, 2).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0]?.[0] ?? ""}${words[words.length - 1]?.[0] ?? ""}`.toUpperCase();
};

export const getFirstNonEmpty = (
  ...values: Array<string | null | undefined>
): string | undefined => values.find((value) => Boolean(value)) ?? undefined;

export const formatVisibility = (value?: string | null) => {
  if (!value) return undefined;
  const normalized = value.replace(/[_-]+/g, " ");
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

export const formatTagLabel = (value: string): string =>
  quickTagLabelByValue[value] ?? value.replace(/[_-]+/g, " ");

export const mergePosts = (current: ApiPost[], incoming: ApiPost[]): ApiPost[] => {
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
