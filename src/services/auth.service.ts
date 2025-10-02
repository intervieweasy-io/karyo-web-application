import { http } from "@/lib/http";
import { tokenStore } from "@/lib/tokenStore";

const mapErr = (e: any): string => e?.response?.data?.error || "unknown_error";

export const signup = async (body: { email: string; name: string; password: string }) => {
  const { data } = await http.post("/auth/signup", body);
  tokenStore.set(data.access);
  return data;
};

export const login = async (body: { email: string; password: string }) => {
  const { data } = await http.post("/auth/login", body);
  tokenStore.set(data.access);
  return data;
};

export const forgot = async (body: { email: string }) => {
  const { data } = await http.post("/auth/forgot", body);
  return data;
};

export const logout = async () => {
  await http.post("/auth/logout");
  tokenStore.clear();
  return { ok: true };
};

export const me = async () => {
  const { data } = await http.get("/auth/me");
  return data;
};

export const errCode = mapErr;
