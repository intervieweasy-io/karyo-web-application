import { http } from "@/lib/http";

export interface ApiFeedPost {
  id: string;
  [key: string]: unknown;
}

export interface HomeFeedResult {
  posts: ApiFeedPost[];
  nextCursor?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const extractId = (value: Record<string, unknown>): string | null => {
  if (typeof value.id === "string") return value.id;
  if (typeof value.postId === "string") return value.postId;
  if (typeof value.uuid === "string") return value.uuid;
  if (typeof value._id === "string") return value._id;
  if (typeof value.itemId === "string") return value.itemId;
  return null;
};

const toFeedPost = (value: unknown): ApiFeedPost | null => {
  if (!isRecord(value)) return null;
  const id = extractId(value);
  if (!id) return null;
  return { id, ...(value as Record<string, unknown>) };
};

const flattenCollection = (collection: unknown[]): unknown[] =>
  collection.flatMap((item) => {
    if (isRecord(item) && "node" in item) {
      const node = (item as Record<string, unknown>).node;
      if (Array.isArray(node)) {
        return flattenCollection(node);
      }
      return node ?? [];
    }
    return item;
  });

const unwrapCollection = (
  value: unknown,
  keys: string[]
): Array<Record<string, unknown>> => {
  if (Array.isArray(value)) {
    return flattenCollection(value)
      .map((item) => (isRecord(item) ? item : null))
      .filter((item): item is Record<string, unknown> => Boolean(item));
  }

  if (isRecord(value)) {
    for (const key of keys) {
      const nested = value[key];
      if (nested === value) continue;
      const resolved = unwrapCollection(nested, keys);
      if (resolved.length > 0) {
        return resolved;
      }
    }

    if (isRecord(value.data)) {
      if (value.data !== value) {
        const resolved = unwrapCollection(value.data, keys);
        if (resolved.length > 0) {
          return resolved;
        }
      }
    }

    if (Array.isArray(value.data)) {
      return unwrapCollection(value.data, keys);
    }
  }

  return [];
};

const unwrapPosts = (value: unknown): ApiFeedPost[] => {
  const collections = unwrapCollection(value, [
    "posts",
    "items",
    "results",
    "feed",
    "data",
    "edges",
    "list",
  ]);

  const direct = toFeedPost(value);
  if (!collections.length && direct) {
    return [direct];
  }

  return collections
    .map((item) => toFeedPost(item))
    .filter((post): post is ApiFeedPost => Boolean(post));
};

const extractCursor = (value: unknown): string | undefined => {
  if (!isRecord(value)) return undefined;
  if (typeof value.nextCursor === "string") return value.nextCursor;
  if (typeof value.cursor === "string") return value.cursor;
  if (typeof value.next === "string") return value.next;
  if (isRecord(value.page) && typeof value.page.next === "string") {
    return value.page.next;
  }
  if (isRecord(value.meta) && typeof value.meta.nextCursor === "string") {
    return value.meta.nextCursor;
  }
  if (isRecord(value.data)) {
    const nested = extractCursor(value.data);
    if (nested) return nested;
  }
  return undefined;
};

const unwrapPost = (value: unknown): ApiFeedPost | null => {
  const direct = toFeedPost(value);
  if (direct) return direct;
  if (!isRecord(value)) return null;

  const candidates = ["post", "data", "item", "result", "resource"];
  for (const key of candidates) {
    const nested = toFeedPost(value[key]);
    if (nested) return nested;
  }

  return null;
};

export const getHomeFeed = async (params?: {
  size?: number;
  cursor?: string;
}): Promise<HomeFeedResult> => {
  const query: Record<string, string | number> = {};
  if (typeof params?.size === "number" && Number.isFinite(params.size)) {
    query.size = params.size;
  }
  if (params?.cursor) {
    query.cursor = params.cursor;
  }

  const { data } = await http.get("/feed/home", {
    params: Object.keys(query).length ? query : undefined,
  });

  return {
    posts: unwrapPosts(data),
    nextCursor: extractCursor(data),
  };
};

export const createTextPost = async (body: {
  text: string;
  tags?: string[];
  visibility?: "public" | "connections" | "private";
}) => {
  const payload: Record<string, unknown> = {
    type: "text",
    text: body.text,
    visibility: body.visibility ?? "public",
  };

  if (Array.isArray(body.tags)) {
    const tags = body.tags
      .map((tag) =>
        typeof tag === "string" ? tag.trim().replace(/^#/, "") : undefined
      )
      .filter((tag): tag is string => Boolean(tag));
    if (tags.length) {
      payload.tags = tags;
    }
  }

  const { data } = await http.post("/posts", payload);
  return unwrapPost(data);
};

export const likePost = async (postId: string) => {
  await http.post(`/engage/posts/${postId}/like`);
  return { ok: true };
};

export const unlikePost = async (postId: string) => {
  await http.delete(`/engage/posts/${postId}/like`);
  return { ok: true };
};
