import type { ComponentType } from "react";

export type ComposerTabKey = "update" | "video" | "poll" | "attach";

export interface ComposerTab {
  key: ComposerTabKey;
  label: string;
  icon: ComponentType<{ className?: string }>;
  disabled?: boolean;
}

export interface QuickTag {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
}
