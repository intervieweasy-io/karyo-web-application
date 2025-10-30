import { http } from "@/lib/http";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;

const toNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const toBoolean = (value: unknown): boolean | undefined =>
  typeof value === "boolean" ? value : undefined;

const toStringArray = (value: unknown): string[] | undefined => {
  if (Array.isArray(value)) {
    const mapped = value
      .map((item) => toString(item))
      .filter((item): item is string => Boolean(item));
    return mapped.length > 0 ? mapped : undefined;
  }
  return undefined;
};

const extractId = (value: Record<string, unknown>): string | undefined => {
  const candidates = ["id", "postId", "_id", "uuid", "slug", "handle"];
  for (const candidate of candidates) {
    const id = toString(value[candidate]);
    if (id) return id;
  }
  return undefined;
};

const unwrapCollection = <T>(
  value: unknown,
  keys: string[]
): T[] | undefined => {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (!isRecord(value)) {
    return undefined;
  }

  for (const key of keys) {
    const direct = value[key];
    if (Array.isArray(direct)) {
      return direct as T[];
    }
  }

  if (isRecord(value.data)) {
    return unwrapCollection<T>(value.data, keys);
  }

  return undefined;
};

const extractCursor = (value: unknown): string | null => {
  if (!isRecord(value)) return null;
  const cursor = toString(value.nextCursor) ?? toString(value.cursor);
  if (cursor) return cursor;
  if (isRecord(value.page)) {
    const pageCursor = toString(value.page.next);
    if (pageCursor) return pageCursor;
  }
  if (isRecord(value.data)) {
    return extractCursor(value.data);
  }
  return null;
};

export interface ApiUserSummary {
  id?: string;
  name?: string;
  handle?: string | false | null | undefined;
  headline?: string;
  title?: string;
  avatarUrl?: string | null;
}

const toUserSummary = (value: unknown): ApiUserSummary | undefined => {
  if (!isRecord(value)) return undefined;
  const id = extractId(value);
  const name =
    toString(value.name) ||
    toString(value.fullName) ||
    toString(value.displayName) ||
    (id && !/^[a-f0-9-]+$/i.test(id) ? id : undefined);

  const handle =
    toString(value.handle) ||
    toString(value.username) ||
    (typeof value.profile === "object" &&
      value.profile &&
      toString((value.profile as Record<string, unknown>).handle));

  return {
    id,
    name,
    handle,
    headline: toString(value.headline) ?? toString(value.title),
    title: toString(value.title),
    avatarUrl:
      toString(value.avatarUrl) ??
      toString(value.image) ??
      toString(value.profileImageUrl) ??
      null,
  };
};

export interface ApiMedia {
  id?: string;
  kind?: string;
  url?: string;
  thumbUrl?: string | null;
  description?: string | null;
}

const toMedia = (value: unknown): ApiMedia | undefined => {
  if (!isRecord(value)) return undefined;
  const url = toString(value.url) ?? toString(value.src);
  if (!url) return undefined;
  return {
    id: extractId(value),
    kind: toString(value.kind) ?? toString(value.type) ?? "image",
    url,
    thumbUrl: toString(value.thumbUrl) ?? toString(value.thumbnail) ?? null,
    description: toString(value.description) ?? null,
  };
};

export interface ApiPollOption {
  id: string;
  text: string;
  votes?: number;
  percentage?: number;
  isSelected?: boolean;
}

const toPollOption = (value: unknown): ApiPollOption | undefined => {
  if (!isRecord(value)) return undefined;
  const id =
    toString(value.id) ?? toString(value.optionId) ?? toString(value.value);
  if (!id) return undefined;
  const text =
    toString(value.text) ??
    toString(value.label) ??
    toString(value.title) ??
    id;
  return {
    id,
    text,
    votes:
      toNumber(value.votes) ??
      toNumber(value.voteCount) ??
      toNumber(value.count) ??
      toNumber(value.total) ??
      0,
    percentage:
      toNumber(value.percentage) ??
      toNumber(value.percent) ??
      toNumber(value.share) ??
      undefined,
    isSelected: toBoolean(value.selected) ?? Boolean(value.isSelected),
  };
};

export interface ApiPoll {
  id: string;
  prompt?: string;
  options: ApiPollOption[];
  totalVotes?: number;
  allowMultiple?: boolean;
  expiresAt?: string | null;
  hasVoted?: boolean;
  selectedOptionIds?: string[];
}

const toPoll = (value: unknown): ApiPoll | null => {
  if (!isRecord(value)) return null;
  const id = extractId(value);
  if (!id) return null;

  const optionsRaw =
    unwrapCollection<unknown>(value.options, ["options", "choices", "items"]) ??
    unwrapCollection<unknown>(value.choices, ["choices", "options"]);

  const options = (optionsRaw ?? [])
    .map((item) => toPollOption(item))
    .filter((item): item is ApiPollOption => Boolean(item));

  return {
    id,
    prompt:
      toString(value.prompt) ??
      toString(value.question) ??
      toString(value.title) ??
      undefined,
    options,
    totalVotes:
      toNumber(value.totalVotes) ??
      toNumber(value.voteCount) ??
      toNumber(value.total) ??
      (Array.isArray(value.responses) ? value.responses.length : undefined),
    allowMultiple:
      toBoolean(value.allowMultiple) ??
      toBoolean(value.multiSelect) ??
      Boolean(value.multiple),
    expiresAt:
      toString(value.expiresAt) ??
      toString(value.expiry) ??
      toString(value.endsAt) ??
      null,
    hasVoted:
      toBoolean(value.hasVoted) ??
      Boolean(value.voted) ??
      Boolean(value.alreadyVoted),
    selectedOptionIds:
      toStringArray(value.selectedOptionIds) ??
      (Array.isArray(value.selectedOptions)
        ? (value.selectedOptions as unknown[])
            .map((option) =>
              isRecord(option) ? toString(option.id) : toString(option)
            )
            .filter((item): item is string => Boolean(item))
        : undefined),
  };
};

export interface ApiPostStats {
  likes?: number;
  comments?: number;
  shares?: number;
}

const toPostStats = (value: unknown): ApiPostStats | undefined => {
  if (!isRecord(value)) return undefined;
  return {
    likes:
      toNumber(value.likes) ??
      toNumber(value.reactions) ??
      toNumber((value.metrics as Record<string, unknown>)?.likes),
    comments:
      toNumber(value.comments) ??
      toNumber((value.metrics as Record<string, unknown>)?.comments),
    shares:
      toNumber(value.shares) ??
      toNumber((value.metrics as Record<string, unknown>)?.shares),
  };
};

export interface ApiPost {
  id: string;
  type?: string;
  text?: string;
  createdAt?: string;
  visibility?: string;
  tags?: string[];
  topics?: string[];
  statusBadge?: string | null;
  author?: ApiUserSummary;
  poll?: ApiPoll | null;
  media?: ApiMedia[];
  counts?: ApiPostStats;
  raw?: Record<string, unknown>;
}

const toPost = (value: unknown): ApiPost | null => {
  if (!isRecord(value)) return null;

  const candidate = isRecord(value.post) ? value.post : value;
  if (!isRecord(candidate)) return null;

  const id =
    extractId(candidate) ?? extractId(value as Record<string, unknown>);
  if (!id) return null;

  const tags =
    toStringArray(candidate.tags) ??
    toStringArray(candidate.topics) ??
    toStringArray((candidate.metadata as Record<string, unknown>)?.tags);

  const poll =
    toPoll(candidate.poll) ??
    toPoll(candidate.polls) ??
    toPoll((candidate.metadata as Record<string, unknown>)?.poll);

  const media = unwrapCollection<unknown>(candidate.media, [
    "media",
    "attachments",
  ])
    ?.map((item) => toMedia(item))
    .filter((item): item is ApiMedia => Boolean(item));

  return {
    id,
    type: toString(candidate.type) ?? toString(value.type),
    text:
      toString(candidate.text) ??
      toString(candidate.body) ??
      toString(candidate.content) ??
      undefined,
    createdAt:
      toString(candidate.createdAt) ??
      toString(candidate.created_at) ??
      toString(candidate.timestamp) ??
      toString(value.createdAt) ??
      toString(value.created_at),
    visibility:
      toString(candidate.visibility) ??
      toString(candidate.privacy) ??
      toString(candidate.scope) ??
      undefined,
    tags,
    topics: toStringArray(candidate.topics),
    statusBadge:
      toString(candidate.statusLabel) ??
      toString(candidate.contextLabel) ??
      toString(candidate.badge) ??
      (tags && tags.length > 0 ? tags[0] : null),
    author:
      toUserSummary(candidate.author) ??
      toUserSummary(candidate.user) ??
      toUserSummary(value.author) ??
      toUserSummary(value.user),
    poll,
    media,
    counts: toPostStats(candidate.counts),
    raw: candidate,
  };
};

const unwrapPosts = (value: unknown): ApiPost[] => {
  const collections =
    unwrapCollection<unknown>(value, ["items", "posts", "feed", "results"]) ??
    [];

  return collections
    .map((item) => toPost(item))
    .filter((item): item is ApiPost => Boolean(item));
};

export interface FeedResponse {
  items: ApiPost[];
  nextCursor: string | null;
  raw: unknown;
}

export const getHomeFeed = async (params?: {
  size?: number;
  cursor?: string;
}): Promise<FeedResponse> => {
  const { data } = await http.get("/feed/home", {
    params: {
      size: params?.size,
      cursor: params?.cursor,
    },
  });

  return {
    items: unwrapPosts(data),
    nextCursor: extractCursor(data),
    raw: data,
  };
};

export interface CreatePostPayload {
  type: string;
  text: string;
  visibility?: string;
  tags?: string[];
  media?: ApiMedia[];
  poll?: {
    prompt: string;
    options: string[];
    multiSelect?: boolean;
    expiresAt?: string;
  };
}

export const createPost = async (payload: CreatePostPayload) => {
  const { data } = await http.post("/posts", payload);
  return toPost(data);
};

export const likePost = async (postId: string) => {
  const { data } = await http.post(`engage/posts/${postId}/like`);
  return toPost(data);
};

export const unlikePost = async (postId: string) => {
  const { data } = await http.delete(`engage/posts/${postId}/like`);
  return toPost(data);
};

export const voteOnPoll = async (postId: string, optionIds: string[]) => {
  const { data } = await http.post(`/posts/${postId}/poll/vote`, { optionIds });
  return toPoll(data);
};

export const getPollResults = async (postId: string) => {
  const { data } = await http.get(`/posts/${postId}/poll/results`);
  return toPoll(data);
};
