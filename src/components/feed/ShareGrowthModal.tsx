"use client";

import { useCallback, useEffect, useState } from "react";

import { BarChart3, Image, Loader2, Paperclip, Video, X } from "lucide-react";

import type { ComposerTab, ComposerTabKey, QuickTag } from "./types";
import { classNames } from "./utils";

interface ShareGrowthModalProps {
  open: boolean;
  onClose: () => void;
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
  canSubmit: boolean;
  isSubmitting: boolean;
  onSubmit: () => Promise<boolean>;
}

const quickActions = [
  { key: "image", label: "Image", icon: Image },
  { key: "video", label: "Video", icon: Video },
  { key: "poll", label: "Poll", icon: BarChart3 },
  { key: "attach", label: "Attach", icon: Paperclip },
] as const;

export const ShareGrowthModal = ({
  open,
  onClose,
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
  canSubmit,
  isSubmitting,
  onSubmit,
}: ShareGrowthModalProps) => {
  const [step, setStep] = useState<"category" | "compose">("category");

  useEffect(() => {
    if (open) {
      setStep(selectedTag ? "compose" : "category");
    }
  }, [open, selectedTag]);

  const handleClose = useCallback(() => {
    onClose();
    setStep("category");
  }, [onClose]);

  const handleSubmit = useCallback(async () => {
    const success = await onSubmit();
    if (success) {
      handleClose();
    }
  }, [handleClose, onSubmit]);

  if (!open) {
    return null;
  }

  return (
    <div className="home-share-modal" role="dialog" aria-modal="true" aria-labelledby="share-growth-title">
      <div className="home-share-modal__backdrop" aria-hidden onClick={handleClose} />
      <div className="home-share-modal__panel">
        <header className="home-share-modal__header">
          <div>
            <p className="home-share-modal__eyebrow">Share Your Growth</p>
            <h2 id="share-growth-title">Share to feed</h2>
          </div>
          <button type="button" className="home-share-modal__close" aria-label="Close" onClick={handleClose}>
            <X aria-hidden />
          </button>
        </header>

        {step === "category" ? (
          <div className="home-share-modal__body" role="document">
            <p className="home-share-modal__subtitle">Select a category for your post</p>
            <div className="home-share-modal__category-list">
              {quickTags.map(({ value, label, icon: Icon }) => {
                const isActive = selectedTag === value;
                return (
                  <button
                    key={value}
                    type="button"
                    className={classNames(
                      "home-share-modal__category",
                      isActive && "home-share-modal__category--active",
                    )}
                    onClick={() => onSelectTag(isActive ? null : value)}
                    aria-pressed={isActive}
                  >
                    <Icon className="home-share-modal__category-icon" aria-hidden />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
            <footer className="home-share-modal__footer">
              <button type="button" className="home-share-modal__secondary" onClick={() => setStep("compose")}>
                Skip for now
              </button>
              <button
                type="button"
                className="home-share-modal__primary"
                onClick={() => setStep("compose")}
                disabled={!selectedTag}
              >
                Continue
              </button>
            </footer>
          </div>
        ) : (
          <div className="home-share-modal__body" role="document">
            <div className="home-share-modal__tabs" role="tablist" aria-label="Share options">
              {composerTabs.map(({ key, label, icon: Icon, disabled }) => {
                const isActive = activeTab === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={classNames(
                      "home-share-modal__tab",
                      isActive && "home-share-modal__tab--active",
                      disabled && "home-share-modal__tab--disabled",
                    )}
                    onClick={() => onTabChange(key)}
                  >
                    <Icon className="home-share-modal__tab-icon" aria-hidden />
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="home-share-modal__editor">
              <textarea
                value={composerText}
                onChange={(event) => onTextChange(event.target.value)}
                placeholder={placeholder}
                className="home-share-modal__textarea"
                aria-label="Share your update"
                maxLength={800}
              />

              <div className="home-share-modal__quick-actions">
                {quickActions.map(({ key, label, icon: Icon }) => (
                  <button key={key} type="button" className="home-share-modal__quick-button" disabled>
                    <Icon className="home-share-modal__quick-icon" aria-hidden />
                    {label}
                  </button>
                ))}
              </div>

              <p className="home-share-modal__hint">Attach Files · Support: PDF, Word, Excel, PowerPoint, Text, CSV, PNG</p>
            </div>

            {composerError && (
              <p className="home-share-modal__error" role="alert">
                {composerError}
              </p>
            )}

            {disabledTabReason && <p className="home-share-modal__notice">{disabledTabReason}</p>}

            <footer className="home-share-modal__footer home-share-modal__footer--actions">
              <button type="button" className="home-share-modal__secondary" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </button>
              <button
                type="button"
                className="home-share-modal__primary"
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="home-share-modal__spinner" aria-hidden />
                    Sharing...
                  </>
                ) : (
                  "Share Progress"
                )}
              </button>
            </footer>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareGrowthModal;
