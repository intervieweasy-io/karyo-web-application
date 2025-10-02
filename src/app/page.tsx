"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { tokenStore } from "@/lib/tokenStore";

const HOME_REDIRECTS = {
  authenticated: "/tracker",
  unauthenticated: "/login"
} as const;

export default function Home(): null {
  const router = useRouter();

  useEffect(() => {
    const token = tokenStore.get();
    const destination = token
      ? HOME_REDIRECTS.authenticated
      : HOME_REDIRECTS.unauthenticated;

    router.replace(destination);
  }, [router]);

  return null;
}
