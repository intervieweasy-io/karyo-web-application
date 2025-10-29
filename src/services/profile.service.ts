import { http } from "@/lib/http";

export interface ApiProfile {
  id?: string;
  name?: string;
  handle?: string;
  headline?: string;
  location?: string;
  [key: string]: unknown;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const unwrapProfile = (value: unknown): ApiProfile | null => {
  if (!isRecord(value)) return null;

  const base: ApiProfile = { id: undefined };
  if (typeof value.id === "string") base.id = value.id;
  if (typeof value.userId === "string") base.id = value.userId;
  if (typeof value.name === "string") base.name = value.name;
  if (typeof value.fullName === "string") base.name = value.fullName;
  if (typeof value.handle === "string") base.handle = value.handle;
  if (typeof value.username === "string") base.handle = value.username;
  if (typeof value.headline === "string") base.headline = value.headline;
  if (typeof value.title === "string" && !base.headline) base.headline = value.title;
  if (typeof value.location === "string") base.location = value.location;
  if (typeof value.city === "string" && !base.location) base.location = value.city;

  return { ...value, ...base } as ApiProfile;
};

export const getMyProfile = async (): Promise<ApiProfile | null> => {
  const { data } = await http.get("/profile/me");

  const direct = unwrapProfile(data);
  if (direct) return direct;

  if (isRecord(data)) {
    const candidates = ["profile", "data", "user"];
    for (const key of candidates) {
      const nested = unwrapProfile(data[key]);
      if (nested) {
        return nested;
      }
    }
  }

  return null;
};
