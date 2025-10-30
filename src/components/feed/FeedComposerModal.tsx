"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import {
  Bold,
  Image as ImageIcon,
  Italic,
  Paperclip,
  Plus,
  Smile,
  Trash2,
  Underline,
  Video as VideoIcon,
  X,
} from "lucide-react";

import type { CreatePostPayload } from "@/services/feed.service";

import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

import type { ComposerTab, ComposerTabKey, QuickTag } from "./types";

const COMPOSER_CHAR_LIMIT = 1400;
const EMOJI_OPTIONS = [
  "😀",
  "😁",
  "😂",
  "😊",
  "😍",
  "🤩",
  "🤔",
  "😎",
  "🙌",
  "🔥",
  "🎉",
  "🚀",
  "🌟",
  "💡",
  "✅",
  "🥳",
  "❤️",
];

type AttachmentKind = "image" | "video" | "file";

interface AttachmentItem {
  id: string;
  file: File;
  previewUrl: string;
  kind: AttachmentKind;
  name: string;
  size: number;
}

export interface FeedComposerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  composerTabs: ComposerTab[];
  quickTags: QuickTag[];
  isSubmitting: boolean;
  initialTag?: string | null;
  onSubmit: (
    payload: CreatePostPayload
  ) => Promise<{ success: boolean; error?: string }>;
}

const sanitizeHtml = (value: string) => {
  if (typeof window === "undefined") {
    return value;
  }
  const container = document.createElement("div");
  container.innerHTML = value;
  const allowedTags = new Set(["STRONG", "B", "EM", "I", "U", "BR"]);

  const normalizeTag = (tagName: string) => {
    if (tagName === "B") return "STRONG";
    if (tagName === "I") return "EM";
    return tagName;
  };

  const traverse = (node: Node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const normalized = normalizeTag(element.tagName);
      if (!allowedTags.has(normalized)) {
        if (normalized === "DIV" || normalized === "P" || normalized === "SPAN") {
          const fragment = document.createDocumentFragment();
          while (element.firstChild) {
            fragment.appendChild(element.firstChild);
          }
          element.replaceWith(fragment);
        } else {
          element.replaceWith(document.createTextNode(element.textContent ?? ""));
          return;
        }
      } else {
        const desiredTag = normalized.toLowerCase();
        if (desiredTag !== element.tagName.toLowerCase()) {
          const replacement = document.createElement(desiredTag);
          while (element.firstChild) {
            replacement.appendChild(element.firstChild);
          }
          element.replaceWith(replacement);
          traverse(replacement);
          return;
        }
        [...element.attributes].forEach((attribute) => element.removeAttribute(attribute.name));
      }
    }
    [...node.childNodes].forEach(traverse);
  };

  [...container.childNodes].forEach(traverse);

  return container.innerHTML
    .replace(/<div><br><\/div>/gi, "<br>")
    .replace(/<div>/gi, "<br>")
    .replace(/<\/div>/gi, "")
    .replace(/<p>/gi, "")
    .replace(/<\/p>/gi, "<br>")
    .replace(/(&nbsp;)+/gi, " ");
};

const stripHtml = (value: string) => {
  if (typeof window === "undefined") {
    return value;
  }
  const container = document.createElement("div");
  container.innerHTML = value;
  return container.textContent ?? container.innerText ?? "";
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Unable to read file"));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

export const FeedComposerModal = ({
  open,
  onOpenChange,
  composerTabs,
  quickTags,
  isSubmitting,
  initialTag,
  onSubmit,
}: FeedComposerModalProps) => {
  const [activeTab, setActiveTab] = useState<ComposerTabKey>("update");
  const [editorHtml, setEditorHtml] = useState("");
  const [plainText, setPlainText] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(
    initialTag ?? quickTags[0]?.value ?? null
  );
  const [customTopic, setCustomTopic] = useState<string>("");
  const [imageAttachments, setImageAttachments] = useState<AttachmentItem[]>([]);
  const [videoAttachments, setVideoAttachments] = useState<AttachmentItem[]>([]);
  const [fileAttachments, setFileAttachments] = useState<AttachmentItem[]>([]);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [allowMultiplePollOptions, setAllowMultiplePollOptions] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const releaseAttachmentUrls = useCallback((attachments: AttachmentItem[]) => {
    attachments.forEach((item) => URL.revokeObjectURL(item.previewUrl));
  }, []);

  const resetAttachments = useCallback(() => {
    setImageAttachments((previous) => {
      releaseAttachmentUrls(previous);
      return [];
    });
    setVideoAttachments((previous) => {
      releaseAttachmentUrls(previous);
      return [];
    });
    setFileAttachments((previous) => {
      releaseAttachmentUrls(previous);
      return [];
    });
  }, [releaseAttachmentUrls]);

  const resetComposer = useCallback(() => {
    setActiveTab("update");
    setEditorHtml("");
    setPlainText("");
    setPollQuestion("");
    setPollOptions(["", ""]);
    setAllowMultiplePollOptions(false);
    setErrorMessage(null);
    resetAttachments();

    const fallback = quickTags[0]?.value ?? null;
    setSelectedTopic(initialTag ?? fallback);
    const shouldUseCustom = initialTag && !quickTags.some((tag) => tag.value === initialTag);
    setCustomTopic(shouldUseCustom ? initialTag ?? "" : "");
  }, [initialTag, quickTags, resetAttachments]);

  useEffect(() => {
    if (open) {
      resetComposer();
    } else {
      resetAttachments();
    }
  }, [open, resetAttachments, resetComposer]);

  useEffect(() => resetAttachments, [resetAttachments]);

  const activeAttachments = useMemo(() => {
    if (activeTab === "image") return imageAttachments;
    if (activeTab === "video") return videoAttachments;
    if (activeTab === "attach") return fileAttachments;
    return [];
  }, [activeTab, fileAttachments, imageAttachments, videoAttachments]);

  const handleEditorChange = useCallback((value: string) => {
    const sanitized = sanitizeHtml(value);
    setEditorHtml(sanitized);
    setPlainText(stripHtml(sanitized));
  }, []);

  const handleSelectTopic = useCallback((value: string) => {
    setSelectedTopic(value);
    setCustomTopic("");
  }, []);

  const handleCustomTopicChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      setCustomTopic(value);
      const normalized = value.trim();
      if (normalized.length > 0) {
        setSelectedTopic(normalized);
      } else {
        setSelectedTopic(quickTags[0]?.value ?? null);
      }
    },
    [quickTags]
  );

  const handleAddAttachments = useCallback(
    (files: FileList | null, kind: AttachmentKind) => {
      if (!files || files.length === 0) return;
      const next = Array.from(files).map((file) => ({
        id: `${kind}-${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        kind,
        name: file.name,
        size: file.size,
      }));

      if (kind === "image") {
        setImageAttachments((previous) => [...previous, ...next]);
      } else if (kind === "video") {
        setVideoAttachments((previous) => [...previous, ...next]);
      } else {
        setFileAttachments((previous) => [...previous, ...next]);
      }
    },
    []
  );

  const handleRemoveAttachment = useCallback((id: string, kind: AttachmentKind) => {
    const removeFrom = (items: AttachmentItem[]) => {
      let removed: AttachmentItem | undefined;
      const filtered = items.filter((item) => {
        if (item.id === id) {
          removed = item;
          return false;
        }
        return true;
      });
      if (removed) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return filtered;
    };

    if (kind === "image") {
      setImageAttachments((previous) => removeFrom(previous));
    } else if (kind === "video") {
      setVideoAttachments((previous) => removeFrom(previous));
    } else {
      setFileAttachments((previous) => removeFrom(previous));
    }
  }, []);

  const handlePollOptionChange = useCallback((index: number, value: string) => {
    setPollOptions((previous) => {
      const next = [...previous];
      next[index] = value;
      return next;
    });
  }, []);

  const handleAddPollOption = useCallback(() => {
    setPollOptions((previous) => [...previous, ""]);
  }, []);

  const handleRemovePollOption = useCallback((index: number) => {
    setPollOptions((previous) => {
      if (previous.length <= 2) return previous;
      const next = [...previous];
      next.splice(index, 1);
      return next;
    });
  }, []);

  const handleSubmitInternal = useCallback(async () => {
    if (isSubmitting) return;

    const trimmedText = plainText.trim();

    if (!selectedTopic) {
      setErrorMessage("Choose a topic before sharing.");
      return;
    }

    if (activeTab === "update" && trimmedText.length === 0) {
      setErrorMessage("Share a few words about your progress.");
      return;
    }

    if (plainText.length > COMPOSER_CHAR_LIMIT) {
      setErrorMessage("Please keep your update within the character limit.");
      return;
    }

    if (activeTab === "image" && imageAttachments.length === 0) {
      setErrorMessage("Add at least one image to continue.");
      return;
    }

    if (activeTab === "video" && videoAttachments.length === 0) {
      setErrorMessage("Add at least one video to continue.");
      return;
    }

    if (activeTab === "attach" && fileAttachments.length === 0) {
      setErrorMessage("Attach at least one file to continue.");
      return;
    }

    if (activeTab === "poll") {
      const options = pollOptions.map((option) => option.trim()).filter(Boolean);
      if (!pollQuestion.trim()) {
        setErrorMessage("Ask a question for your poll.");
        return;
      }
      if (options.length < 2) {
        setErrorMessage("Provide at least two poll options.");
        return;
      }
    }

    setErrorMessage(null);

    const typeMap: Record<ComposerTabKey, string> = {
      update: "text",
      image: "media",
      video: "media",
      poll: "poll",
      attach: "media",
    };

    const tags = selectedTopic ? [selectedTopic] : [];

    const payload: CreatePostPayload = {
      type: typeMap[activeTab],
      text: trimmedText,
      tags: tags.length > 0 ? tags : undefined,
      visibility: "public",
    };

    if (activeTab === "poll") {
      payload.poll = {
        prompt: pollQuestion.trim(),
        options: pollOptions.map((option) => option.trim()).filter(Boolean),
        multiSelect: allowMultiplePollOptions || undefined,
      };
    }

    if (activeAttachments.length > 0) {
      const attachmentsPayload = await Promise.all(
        activeAttachments.map(async (item) => ({
          kind: item.kind,
          url: await readFileAsDataUrl(item.file),
          description: item.name,
        }))
      );
      payload.media = attachmentsPayload;
    }

    const result = await onSubmit(payload);
    if (!result.success && result.error) {
      setErrorMessage(result.error);
    } else if (result.success) {
      resetComposer();
    }
  }, [
    activeAttachments,
    activeTab,
    allowMultiplePollOptions,
    fileAttachments,
    imageAttachments,
    isSubmitting,
    onSubmit,
    plainText,
    pollOptions,
    pollQuestion,
    resetComposer,
    selectedTopic,
    videoAttachments,
  ]);

  const charactersRemaining = useMemo(
    () => COMPOSER_CHAR_LIMIT - plainText.length,
    [plainText.length]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="home-composer-modal" overlayClassName="home-composer-modal__overlay">
        <DialogHeader className="home-composer-modal__header">
          <DialogTitle>Share Your Growth</DialogTitle>
          <button
            type="button"
            className="home-composer-modal__close"
            onClick={() => onOpenChange(false)}
            aria-label="Close composer"
          >
            <X size={18} />
          </button>
        </DialogHeader>

        <div className="home-composer-modal__body">
          <section className="home-composer-section">
            <header className="home-composer-section__header">
              <h3>Choose a topic</h3>
              <p>Every post needs a topic. Select one to help others find your update.</p>
            </header>

            <div className="home-composer-topics">
              {quickTags.map(({ label, value, icon: Icon }) => {
                const isActive = selectedTopic === value;
                return (
                  <button
                    key={value}
                    type="button"
                    className={`home-topic-pill ${isActive ? "home-topic-pill--active" : ""}`}
                    onClick={() => handleSelectTopic(value)}
                  >
                    <Icon size={16} aria-hidden />
                    {label}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="home-composer-section">
            <header className="home-composer-section__header">
              <h3>Create your post</h3>
              <p>Format text, add emoji, attach files, and preview everything here.</p>
            </header>

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ComposerTabKey)}>
              <TabsList className="home-composer-tabs">
                {composerTabs.map(({ key, label, icon: Icon }) => (
                  <TabsTrigger key={key} value={key} className="home-composer-tab-trigger">
                    <Icon size={16} aria-hidden />
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value={activeTab} className="home-composer-tabpanel">
                <RichTextEditor
                  value={editorHtml}
                  onChange={handleEditorChange}
                  maxLength={COMPOSER_CHAR_LIMIT}
                  placeholder="Share your progress, challenges, or what you're learning..."
                />

                <div className="home-composer-editor-meta">
                  <span>
                    {plainText.length}/{COMPOSER_CHAR_LIMIT} characters
                  </span>
                  <span>
                    {charactersRemaining >= 0
                      ? `${charactersRemaining} characters remaining`
                      : "Character limit exceeded"}
                  </span>
                </div>

                {activeTab === "image" && (
                  <button
                    type="button"
                    className="home-composer-attachment-button"
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <ImageIcon size={16} /> Add images
                  </button>
                )}

                {activeTab === "video" && (
                  <button
                    type="button"
                    className="home-composer-attachment-button"
                    onClick={() => videoInputRef.current?.click()}
                  >
                    <VideoIcon size={16} /> Add videos
                  </button>
                )}

                {activeTab === "attach" && (
                  <button
                    type="button"
                    className="home-composer-attachment-button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip size={16} /> Attach files
                  </button>
                )}

                {activeAttachments.length > 0 && (
                  <ul className="home-composer-attachments">
                    {activeAttachments.map((item) => (
                      <li key={item.id} className="home-composer-attachment">
                        <div className="home-composer-attachment__info">
                          <p className="home-composer-attachment__name">{item.name}</p>
                          <p className="home-composer-attachment__meta">
                            {(item.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          type="button"
                          className="home-composer-attachment__remove"
                          onClick={() => handleRemoveAttachment(item.id, item.kind)}
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {activeTab === "poll" && (
                  <div className="home-composer-poll">
                    <Label htmlFor="composer-poll-question">Poll question</Label>
                    <Input
                      id="composer-poll-question"
                      placeholder="What do you want to ask?"
                      value={pollQuestion}
                      className="poll-question"
                      onChange={(event) => setPollQuestion(event.target.value)}
                    />

                    <div className="home-composer-poll-options">
                      {pollOptions.map((option, index) => (
                        <div key={`poll-option-${index}`} className="home-composer-poll-option">
                          <Input
                            placeholder={`Option ${index + 1}`}
                            value={option}
                            onChange={(event) => handlePollOptionChange(index, event.target.value)}
                          />
                          {pollOptions.length > 2 && (
                            <button
                              type="button"
                              className="home-composer-poll-remove"
                              onClick={() => handleRemovePollOption(index)}
                              aria-label={`Remove option ${index + 1}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      className="home-composer-poll-add"
                      onClick={handleAddPollOption}
                    >
                      <Plus size={16} /> Add option
                    </Button>

                    <label className="home-composer-poll-multi">
                      <input
                        type="checkbox"
                        checked={allowMultiplePollOptions}
                        onChange={(event) => setAllowMultiplePollOptions(event.target.checked)}
                      />
                      Allow multiple selections
                    </label>
                  </div>
                )}

                {errorMessage && (
                  <p className="home-composer-error" role="alert">
                    {errorMessage}
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </section>
        </div>

        <footer className="home-composer-modal__footer">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmitInternal} disabled={isSubmitting}>
            {isSubmitting ? "Sharing..." : "Share progress"}
          </Button>
        </footer>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="home-composer-file-input"
          multiple
          onChange={(event) => handleAddAttachments(event.target.files, "image")}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          className="home-composer-file-input"
          multiple
          onChange={(event) => handleAddAttachments(event.target.files, "video")}
        />
        <input
          ref={fileInputRef}
          type="file"
          className="home-composer-file-input"
          multiple
          onChange={(event) => handleAddAttachments(event.target.files, "file")}
        />
      </DialogContent>
    </Dialog>
  );
};

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  placeholder?: string;
}

const RichTextEditor = ({ value, onChange, maxLength, placeholder }: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const lastValueRef = useRef(value);
  const isInternalChangeRef = useRef(false);

  const placeCaretAtEnd = useCallback((root: HTMLElement) => {
    const sel = window.getSelection?.();
    if (!sel) return;
    const range = document.createRange();
    let node: Node | null = root.lastChild;
    while (node && node.lastChild) node = node.lastChild;
    if (node && node.nodeType === Node.TEXT_NODE) {
      const len = (node.textContent || "").length;
      range.setStart(node, len);
    } else {
      range.setStart(root, root.childNodes.length);
    }
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }, []);

  useEffect(() => {
    if (!editorRef.current) return;
    if (isInternalChangeRef.current) {
      isInternalChangeRef.current = false;
      return;
    }
    if (editorRef.current.innerHTML !== value) {
      const hadFocus = document.activeElement === editorRef.current;
      editorRef.current.innerHTML = value;
      if (hadFocus) placeCaretAtEnd(editorRef.current);
    }
    lastValueRef.current = value;
  }, [value, placeCaretAtEnd]);

  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    const nextValue = sanitizeHtml(editorRef.current.innerHTML);
    const length = stripHtml(nextValue).length;
    if (length > maxLength) {
      editorRef.current.innerHTML = lastValueRef.current;
      return;
    }
    lastValueRef.current = nextValue;
    isInternalChangeRef.current = true;
    onChange(nextValue);
  }, [maxLength, onChange]);

  const applyCommand = useCallback((command: "bold" | "italic" | "underline") => {
    if (typeof document === "undefined") return;
    editorRef.current?.focus();
    document.execCommand(command, false);
    handleInput();
  }, [handleInput]);

  const insertEmoji = useCallback((emoji: string) => {
    if (typeof document === "undefined") return;
    editorRef.current?.focus();
    document.execCommand("insertText", false, emoji);
    handleInput();
  }, [handleInput]);

  return (
    <div className="home-composer-editor">
      <div
        ref={editorRef}
        className="home-composer-editor__input"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        data-home-composer-editor
        onInput={handleInput}
        onBlur={handleInput}
        aria-multiline="true"
        role="textbox"
      />
      <div className="home-composer-toolbar" role="toolbar" aria-label="Formatting options">
        <button type="button" onClick={() => applyCommand("bold")} aria-label="Bold">
          <Bold size={16} />
        </button>
        <button type="button" onClick={() => applyCommand("italic")} aria-label="Italic">
          <Italic size={16} />
        </button>
        <button type="button" onClick={() => applyCommand("underline")} aria-label="Underline">
          <Underline size={16} />
        </button>
        <div className="home-composer-toolbar__emoji">
          <Smile size={24} aria-hidden />
          <div className="home-composer-toolbar__emoji-popover">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => insertEmoji(emoji)}
                aria-label={`Insert ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
