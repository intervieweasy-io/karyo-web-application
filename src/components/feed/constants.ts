import {
  Award,
  BarChart3,
  Image,
  Lightbulb,
  NewspaperIcon,
  Paperclip,
  Rocket,
  Sparkles,
  Video,
} from "lucide-react";

import type { ComposerTab, QuickTag } from "./types";

export const composerTabs: ComposerTab[] = [
  { key: "update", label: "Update", icon: NewspaperIcon },
  { key: "image", label: "Image", icon: Image },
  { key: "video", label: "Video", icon: Video },
  { key: "poll", label: "Poll", icon: BarChart3 },
  { key: "attach", label: "Attach", icon: Paperclip },
];

export const quickTags: QuickTag[] = [
  { label: "Currently Working On", value: "currently-working", icon: Sparkles },
  { label: "Problem I’m Solving", value: "problem-solving", icon: Lightbulb },
  { label: "Learning Journey", value: "learning-journey", icon: Rocket },
  { label: "Milestone Achieved", value: "milestone-achieved", icon: Award },
];

export const quickTagLabelByValue = quickTags.reduce<Record<string, string>>(
  (accumulator, tag) => {
    accumulator[tag.value] = tag.label;
    return accumulator;
  },
  {}
);
