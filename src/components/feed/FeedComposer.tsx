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

        <div className="home-compose-actions">
          {composerError && (
            <p className="home-compose-error" role="alert">
              {composerError}
            </p>
          )}

          {disabledTabReason && <p className="home-compose-hint">{disabledTabReason}</p>}
        </div>
      </footer>
    </article>
  );
};
