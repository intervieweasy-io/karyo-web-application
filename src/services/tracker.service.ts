import { http } from "@/lib/http";
import type { JobStage } from "@/app/tracker/data";

export type ApiJobStage = JobStage;

export interface ApiJob {
  id: string;
  title?: string | null;
  company?: string | null;
  location?: string | null;
  stage?: ApiJobStage | string | null;
  priority?: string | null;
  appliedOn?: string | null;
  archived?: boolean;
  notesCount?: number | null;
  isSaved?: boolean;
  logoUrl?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  [key: string]: unknown;
}

export interface ApiJobComment {
  id: string;
  text: string;
  createdAt: string;
  updatedAt?: string;
  authorName?: string;
  [key: string]: unknown;
}

export interface ApiJobAuditEvent {
  id: string;
  type: string;
  createdAt: string;
  actor?: string | null;
  payload?: Record<string, unknown>;
  [key: string]: unknown;
}

type Params = Record<string, string | number | boolean | undefined>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const extractId = (value: Record<string, unknown>): string | null => {
  if (typeof value.id === "string") return value.id;
  if (typeof value._id === "string") return value._id;
  if (typeof value.jobId === "string") return value.jobId;
  if (typeof value.uuid === "string") return value.uuid;
  return null;
};

const toApiJob = (value: unknown): ApiJob | null => {
  if (!isRecord(value)) return null;
  const id = extractId(value);
  if (!id) return null;

  const stage =
    typeof value.stage === "string"
      ? value.stage
      : typeof value.status === "string"
        ? value.status
        : undefined;

  return {
    ...(value as Record<string, unknown>),
    id,
    stage,
  } as ApiJob;
};

const unwrapJob = (value: unknown): ApiJob | null => {
  const direct = toApiJob(value);
  if (direct) {
    return direct;
  }
  if (isRecord(value)) {
    const fromJob = toApiJob(value.job);
    if (fromJob) {
      return fromJob;
    }
    const fromData = toApiJob(value.data);
    if (fromData) {
      return fromData;
    }
  }
  return null;
};

const unwrapCollection = <T>(
  value: unknown,
  key: string,
  fallbackKeys: string[] = []
): T[] | null => {
  if (Array.isArray(value)) {
    return value as T[];
  }
  if (isRecord(value)) {
    const candidates = [key, ...fallbackKeys];
    for (const candidate of candidates) {
      const direct = value[candidate];
      if (Array.isArray(direct)) {
        return direct as T[];
      }
    }
    if (Array.isArray(value.data)) {
      return value.data as T[];
    }
    if (isRecord(value.data)) {
      for (const candidate of candidates) {
        const nested = value.data[candidate];
        if (Array.isArray(nested)) {
          return nested as T[];
        }
      }
    }
  }
  return null;
};

const unwrapJobs = (value: unknown): ApiJob[] => {
  const collections =
    unwrapCollection<Record<string, unknown>>(value, "jobs", ["items", "results"]) ?? [];

  return collections
    .map((job) => toApiJob(job))
    .filter((job): job is ApiJob => Boolean(job));
};

const unwrapComments = (value: unknown): ApiJobComment[] => {
  const comments = unwrapCollection<ApiJobComment>(value, "comments") ?? [];
  return comments.filter((comment) => typeof comment.id === "string" && typeof comment.text === "string");
};

const unwrapAuditEvents = (value: unknown): ApiJobAuditEvent[] => {
  const events = unwrapCollection<ApiJobAuditEvent>(value, "audit") ?? [];
  return events.filter((event) => typeof event.id === "string" && typeof event.type === "string");
};

const extractCursor = (value: unknown): string | undefined => {
  if (!isRecord(value)) return undefined;
  if (typeof value.nextCursor === "string") return value.nextCursor;
  if (typeof value.cursor === "string") return value.cursor;
  if (isRecord(value.page) && typeof value.page.next === "string") {
    return value.page.next;
  }
  if (isRecord(value.data)) {
    return extractCursor(value.data);
  }
  return undefined;
};

const buildParams = (params?: Params): Params | undefined => {
  if (!params) return undefined;
  return Object.keys(params).reduce<Params>((acc, key) => {
    const value = params[key];
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});
};

export const listJobs = async (params?: {
  stage?: ApiJobStage | null;
  archived?: boolean;
  limit?: number;
  cursor?: string;
}) => {
  const query = buildParams({
    stage: params?.stage ?? undefined,
    archived: params?.archived,
    limit: params?.limit,
    cursor: params?.cursor,
  });
  const { data } = await http.get("/core/jobs", { params: query });
  return {
    jobs: unwrapJobs(data),
    nextCursor: extractCursor(data) ?? null,
    raw: data,
  };
};

export const getJob = async (id: string) => {
  const { data } = await http.get(`/core/jobs/${id}`);
  return unwrapJob(data);
};

export const createJob = async (body: { title: string; company: string; location?: string | null }) => {
  const { data } = await http.post("/core/jobs", body);
  return unwrapJob(data);
};

export const updateJob = async (
  id: string,
  body: Partial<{ title: string; company: string; location: string | null; stage: ApiJobStage; priority: string; appliedOn: string }>,
) => {
  const { data } = await http.patch(`/core/jobs/${id}`, body);
  return unwrapJob(data);
};

export const archiveJob = async (id: string) => {
  const { data } = await http.post(`/core/jobs/${id}/archive`);
  return unwrapJob(data);
};

export const restoreJob = async (id: string) => {
  const { data } = await http.post(`/core/jobs/${id}/restore`);
  return unwrapJob(data);
};

export const addJobComment = async (id: string, body: { text: string }) => {
  const { data } = await http.post(`/core/jobs/${id}/comments`, body);
  return unwrapCollection<ApiJobComment>(data, "comment")?.[0] ?? unwrapComments(data)[0] ?? null;
};

export const listJobComments = async (
  id: string,
  params?: { limit?: number; cursor?: string },
) => {
  const query = buildParams(params);
  const { data } = await http.get(`/core/jobs/${id}/comments`, { params: query });
  return {
    comments: unwrapComments(data),
    nextCursor: extractCursor(data) ?? null,
    raw: data,
  };
};

export const listJobAuditTrail = async (
  id: string,
  params?: { limit?: number; cursor?: string },
) => {
  const query = buildParams(params);
  const { data } = await http.get(`/core/jobs/${id}/audit`, { params: query });
  return {
    events: unwrapAuditEvents(data),
    nextCursor: extractCursor(data) ?? null,
    raw: data,
  };
};

export type CommandEffect = {
  type: string;
  [key: string]: unknown;
};

export type ApplyCommandResponse =
  | {
      status: "APPLIED";
      effects?: CommandEffect[];
      requestId: string;
    }
  | {
      status: "NEED_CLARIFICATION";
      question: string;
      options: Array<{ jobId: string; company: string; title: string }>;
      requestId: string;
    }
  | {
      status: "IGNORED_DUPLICATE";
      requestId: string;
    };

export const applyCommand = async (body: {
  channel: "voice" | "text";
  transcript: string;
  requestId?: string;
}) => {
  const payload = { body };
  const { data } = await http.post<ApplyCommandResponse>("/commands", payload);
  return data;
};

export type ParsedCommand = {
  intent?: string;
  args?: Record<string, unknown> | null;
};

export const parseLink = async (body: { sourceUrl: string }) => {
  const payload = { body };
  const { data } = await http.post<{ title?: string; company?: string; location?: string }>(
    "/parser/link",
    payload
  );
  return data;
};

export const parseCommand = async (body: { transcript: string }) => {
  const payload = { body };
  const { data } = await http.post<ParsedCommand>("/commands/parse", payload);
  return data;
};
