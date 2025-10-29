import { Loader2 } from "lucide-react";

import type { ComposerTab, ComposerTabKey, QuickTag } from "./types";
import { classNames, initialsFromName } from "./utils";

interface FeedComposerProps {
  composerTabs: ComposerTab[];
  quickTags: QuickTag[];
  activeTab: ComposerTabKey;
  onTabChange: (tab: ComposerTabKey) => void;
  disabledTabReason?: string | null;
  composerText: string;
  onTextChange: (value: string) => void;
  placeholder: string;
  composerError?: string | null;
  selectedTag: string | null;
  onSelectTag: (value: string | null) => void;
  onSubmit: () => void;
  canSubmit: boolean;
  isSubmitting: boolean;
  currentUserName?: string;
}

export const FeedComposer = ({
  composerTabs,
  quickTags,
  activeTab,
  onTabChange,
  disabledTabReason,
  composerText,
  onTextChange,
  placeholder,
  composerError,
  selectedTag,
  onSelectTag,
  onSubmit,
  canSubmit,
  isSubmitting,
  currentUserName = "User",
}: FeedComposerProps) => {
  return (
    <article className="home-compose-card" aria-label="Share an update">
      <header className="home-compose-card__header">
        <h2>Share your progress, challenges, or what you&apos;re learning...</h2>
        <p>Inspire your peers with a quick update or ask for feedback.</p>
      </header>

      <div className="home-compose-tabs" role="tablist" aria-label="Share options">
        {composerTabs.map(({ key, label, icon: Icon, disabled }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={classNames(
                "home-compose-tab",
                isActive && "home-compose-tab--active",
                disabled && "home-compose-tab--disabled",
              )}
              onClick={() => onTabChange(key)}
            >
              <Icon className="home-compose-tab__icon" aria-hidden />
              {label}
            </button>
          );
        })}
      </div>

      <div className="home-compose-card__body">
        <div className="home-avatar" aria-hidden>
          {initialsFromName(currentUserName)}
        </div>
        <textarea
          value={composerText}
          onChange={(event) => onTextChange(event.target.value)}
          className="home-compose-card__textarea"
          placeholder={placeholder}
          disabled={activeTab !== "update"}
          aria-label="What’s new?"
          maxLength={800}
        />
      </div>

      <footer className="home-compose-card__footer">
        <div className="home-compose-tags" role="group" aria-label="Add a quick tag">
          {quickTags.map(({ label, value, icon: Icon }) => {
            const isActive = selectedTag === value;
            return (
              <button
                key={value}
                type="button"
                className={classNames("home-tag-button", isActive && "home-tag-button--active")}
                onClick={() => onSelectTag(isActive ? null : value)}
                aria-pressed={isActive}
              >
                <Icon className="home-tag-button__icon" aria-hidden />
                {label}
              </button>
            );
          })}
        </div>

        <div className="home-compose-actions">
          {composerError && (
            <p className="home-compose-error" role="alert">
              {composerError}
            </p>
          )}

          {disabledTabReason && <p className="home-compose-hint">{disabledTabReason}</p>}

          <button
            type="button"
            className="home-submit-button"
            onClick={onSubmit}
            disabled={!canSubmit}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="home-submit-button__icon" aria-hidden />
                Sharing...
              </>
            ) : (
              "Share update"
            )}
          </button>
        </div>
      </footer>
    </article>
  );
};
