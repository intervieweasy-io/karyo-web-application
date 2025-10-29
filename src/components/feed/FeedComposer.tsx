import type { KeyboardEventHandler } from "react";

import { ChevronRight } from "lucide-react";

import type { QuickTag } from "./types";
import { initialsFromName } from "./utils";

interface FeedComposerProps {
  onOpen: () => void;
  quickTags: QuickTag[];
  lastSelectedTag?: string | null;
  currentUserName?: string;
}

export const FeedComposer = ({
  onOpen,
  quickTags,
  lastSelectedTag,
  currentUserName = "User",
}: FeedComposerProps) => {
  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  };

  const preferredTagLabel = quickTags.find((tag) => tag.value === lastSelectedTag)?.label;

  return (
    <article className="home-compose-card" aria-label="Create a post">
      <div
        className="home-compose-card__launcher"
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={handleKeyDown}
        aria-pressed="false"
      >
        <div className="home-compose-card__avatar" aria-hidden>
          {initialsFromName(currentUserName)}
        </div>
        <div className="home-compose-card__launch-text">
          <p className="home-compose-card__prompt">Share your progress with the community…</p>
          <p className="home-compose-card__hint">
            {preferredTagLabel
              ? `Last topic: ${preferredTagLabel}`
              : "Pick a topic and add updates, media, polls, or files."}
          </p>
        </div>
        <div className="home-compose-card__launch-icon" aria-hidden>
          <ChevronRight />
        </div>
      </div>

      {quickTags.length > 0 && (
        <footer className="home-compose-card__quick-tags" aria-label="Suggested topics">
          {quickTags.map(({ label, value, icon: Icon }) => (
            <button
              key={value}
              type="button"
              className="home-tag-button"
              onClick={onOpen}
              aria-label={`Share an update about ${label}`}
            >
              <Icon className="home-tag-button__icon" aria-hidden />
              {label}
            </button>
          ))}
        </footer>
      )}
    </article>
  );
};
