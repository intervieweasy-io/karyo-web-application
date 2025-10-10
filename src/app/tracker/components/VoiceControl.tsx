"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Mic, MicOff } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { JobItem, JobStage } from "../data";
import {
    applyCommand,
    parseCommand,
    type ApplyCommandResponse,
    type CommandEffect,
    type ParsedCommand,
} from "@/services/tracker.service";
import { useToast } from "@/components/ui/use-toast";

interface VoiceControlProps {
    jobs: JobItem[];
    onMove: (jobId: string, stage: JobStage) => void;
}

type RecognitionInstance = {
    lang: string;
    interimResults: boolean;
    maxAlternatives?: number;
    start: () => void;
    stop: () => void;
    abort?: () => void;
    onresult: ((event: { results: Array<{ 0?: { transcript?: string } }> }) => void) | null;
    onerror: ((event: unknown) => void) | null;
    onspeechend?: (() => void) | null;
};

type RecognitionCtor = new () => RecognitionInstance;

type ClarificationOption = { jobId: string; company: string; title: string };

type CommandChannel = "voice" | "text";

const KNOWN_STAGES: JobStage[] = ["WISHLIST", "APPLIED", "INTERVIEW", "OFFER", "ARCHIVED"];

const normaliseStage = (value: unknown): JobStage | null => {
    if (typeof value !== "string") return null;
    const upper = value.toUpperCase() as JobStage;
    return KNOWN_STAGES.includes(upper) ? upper : null;
};

const summariseEffects = (effects: CommandEffect[] | undefined, jobs: JobItem[]): string => {
    if (!effects || effects.length === 0) {
        return "Command applied successfully.";
    }

    const messages = effects.map((effect) => {
        if (effect.type === "MOVE_STAGE") {
            const jobId = typeof effect.jobId === "string" ? effect.jobId : null;
            const stage = normaliseStage(effect.to);
            const job = jobId ? jobs.find((item) => item.id === jobId) : null;
            if (job && stage) {
                return `Moved ${job.role} to ${stage.toLowerCase()}`;
            }
            if (jobId && stage) {
                return `Moved job ${jobId} to ${stage.toLowerCase()}`;
            }
            return "Updated job stage";
        }

        if (effect.type === "CREATE") {
            return "Created a new job entry";
        }

        if (effect.type === "COMMENT") {
            return "Added a note to the job";
        }

        return effect.type;
    });

    return messages.join(" • ");
};

const generateRequestId = () => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `cmd-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const VoiceControl = ({ jobs, onMove }: VoiceControlProps) => {
    const { toast } = useToast();
    const [listening, setListening] = useState(false);
    const [status, setStatus] = useState<string>("Give a quick voice command");

    const recognitionRef = useRef<RecognitionInstance | null>(null);
    const clarificationRecognitionRef = useRef<RecognitionInstance | null>(null);

    const [commandOpen, setCommandOpen] = useState(false);
    const [commandTranscript, setCommandTranscript] = useState("");
    const [commandChannel, setCommandChannel] = useState<CommandChannel>("voice");
    const [commandPreview, setCommandPreview] = useState<ParsedCommand | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState<string | null>(null);

    const [applyError, setApplyError] = useState<string | null>(null);
    const [isApplying, setIsApplying] = useState(false);
    const [clarificationQuestion, setClarificationQuestion] = useState<string | null>(null);
    const [clarificationOptions, setClarificationOptions] = useState<ClarificationOption[]>([]);
    const [clarificationAnswer, setClarificationAnswer] = useState("");
    const [clarificationChannel, setClarificationChannel] = useState<CommandChannel>("text");
    const [clarificationLabel, setClarificationLabel] = useState<string | null>(null);
    const [clarificationSelectedOption, setClarificationSelectedOption] = useState<ClarificationOption | null>(
        null
    );
    const [isClarificationRecording, setIsClarificationRecording] = useState(false);

    const recognitionSupported = useMemo(() => {
        if (typeof window === "undefined") return false;
        const speechWindow = window as typeof window & {
            SpeechRecognition?: RecognitionCtor;
            webkitSpeechRecognition?: RecognitionCtor;
        };
        return Boolean(speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition);
    }, []);

    const ensureRecognition = useCallback((): RecognitionInstance | null => {
        if (typeof window === "undefined") return null;
        const speechWindow = window as typeof window & {
            SpeechRecognition?: RecognitionCtor;
            webkitSpeechRecognition?: RecognitionCtor;
        };
        const ctor = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
        if (!ctor) {
            return null;
        }
        const recognition = new ctor();
        recognition.lang = "en-US";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        return recognition;
    }, []);

    const previewCommand = useCallback(async (transcript: string) => {
        const trimmed = transcript.trim();
        if (!trimmed) {
            setCommandPreview(null);
            setPreviewError("Enter a short instruction to preview the command.");
            return;
        }
        setIsPreviewLoading(true);
        setPreviewError(null);
        try {
            const parsed = await parseCommand({ transcript: trimmed });
            setCommandPreview(parsed);
            if (!parsed?.intent) {
                setPreviewError("We couldn't detect an action from that input.");
            }
        } catch (error) {
            console.error("Failed to parse command", error);
            setPreviewError("Unable to parse that command right now. Try again in a moment.");
        } finally {
            setIsPreviewLoading(false);
        }
    }, []);

    const handleEffects = useCallback(
        (effects: CommandEffect[] | undefined) => {
            if (!effects) return;
            effects.forEach((effect) => {
                if (effect.type === "MOVE_STAGE") {
                    const jobId = typeof effect.jobId === "string" ? effect.jobId : null;
                    const stage = normaliseStage(effect.to);
                    if (jobId && stage) {
                        onMove(jobId, stage);
                    }
                }
            });
        },
        [onMove]
    );

    const closeCommandModal = useCallback(() => {
        setCommandOpen(false);
        setCommandTranscript("");
        setCommandPreview(null);
        setPreviewError(null);
        setApplyError(null);
        setClarificationQuestion(null);
        setClarificationOptions([]);
        setClarificationAnswer("");
        setClarificationChannel("text");
        setClarificationLabel(null);
        setClarificationSelectedOption(null);
        setIsPreviewLoading(false);
        setIsApplying(false);
    }, []);

    const runApply = useCallback(
        async (transcript: string, channel: CommandChannel) => {
            const trimmed = transcript.trim();
            if (!trimmed) {
                setApplyError("Please provide a command before running it.");
                return;
            }
            const requestId = generateRequestId();
            setIsApplying(true);
            setApplyError(null);
            try {
                const response: ApplyCommandResponse = await applyCommand({
                    channel,
                    transcript: trimmed,
                    requestId,
                });

                if (response.status === "APPLIED") {
                    setClarificationQuestion(null);
                    setClarificationOptions([]);
                    setClarificationAnswer("");
                    const summary = summariseEffects(response.effects, jobs);
                    setStatus(summary);
                    toast({ title: "Command applied", description: summary });
                    handleEffects(response.effects);
                    closeCommandModal();
                } else if (response.status === "NEED_CLARIFICATION") {
                    setClarificationQuestion(response.question);
                    setClarificationOptions(response.options ?? []);
                    setClarificationAnswer("");
                    setClarificationChannel("text");
                    setClarificationLabel(null);
                    setClarificationSelectedOption(null);
                    setStatus("We need a quick clarification to continue.");
                } else if (response.status === "IGNORED_DUPLICATE") {
                    setStatus("That request was already processed.");
                    toast({ title: "Duplicate command", description: "We already handled that request." });
                    closeCommandModal();
                }
            } catch (error) {
                console.error("Failed to apply command", error);
                setApplyError("We couldn't run that command. Please try again.");
            } finally {
                setIsApplying(false);
            }
        },
        [closeCommandModal, handleEffects, jobs, toast]
    );

    const openCommandModal = useCallback(
        (transcript: string, channel: CommandChannel) => {
            setCommandTranscript(transcript);
            setCommandChannel(channel);
            setCommandPreview(null);
            setPreviewError(null);
            setApplyError(null);
            setClarificationQuestion(null);
            setClarificationOptions([]);
            setClarificationAnswer("");
            setClarificationChannel(channel);
            setClarificationLabel(null);
            setClarificationSelectedOption(null);
            setCommandOpen(true);
            if (transcript.trim()) {
                void previewCommand(transcript);
            }
        },
        [previewCommand]
    );

    useEffect(() => {
        if (!recognitionSupported || typeof window === "undefined") return;
        const recognition = ensureRecognition();
        if (!recognition) return;

        recognition.onresult = (event) => {
            const transcript = event.results[0]?.[0]?.transcript;
            if (transcript) {
                openCommandModal(transcript, "voice");
                setStatus(`Captured command: “${transcript}”`);
            } else {
                setStatus("I didn't catch that. Try again.");
            }
            setListening(false);
        };

        recognition.onerror = () => {
            setStatus("Voice recognition error. Try again?");
            setListening(false);
        };

        recognition.onspeechend = () => {
            recognition.stop();
        };

        recognitionRef.current = recognition;

        return () => {
            recognition.stop();
            recognitionRef.current = null;
        };
    }, [ensureRecognition, openCommandModal, recognitionSupported]);

    useEffect(() => {
        return () => {
            recognitionRef.current?.stop();
            clarificationRecognitionRef.current?.stop?.();
        };
    }, []);

    const startClarificationRecording = () => {
        const recognition = ensureRecognition();
        if (!recognition) {
            setStatus("Voice input unavailable. Type a reply instead.");
            return;
        }

        recognition.onresult = (event) => {
            const transcript = event.results[0]?.[0]?.transcript ?? "";
            const cleaned = transcript.trim();
            if (cleaned) {
                setClarificationAnswer(cleaned);
                setClarificationChannel("voice");
                setClarificationLabel(null);
                setClarificationSelectedOption(null);
            }
            setIsClarificationRecording(false);
        };

        recognition.onerror = () => {
            setIsClarificationRecording(false);
            setStatus("Couldn't capture that reply. Try typing it instead.");
        };

        recognition.onspeechend = () => {
            recognition.stop();
        };

        clarificationRecognitionRef.current = recognition;
        setIsClarificationRecording(true);
        recognition.start();
    };

    const toggleListening = () => {
        if (!recognitionSupported || !recognitionRef.current) {
            setStatus("Voice input unavailable. Enter a quick command instead.");
            openCommandModal("", "text");
            return;
        }

        if (listening) {
            recognitionRef.current.stop();
            setListening(false);
            return;
        }

        recognitionRef.current.start();
        setStatus("Listening... say 'Move [job] to [stage]' or 'Create job...'");
        setListening(true);
    };

    const handleManualCommand = () => {
        openCommandModal(commandTranscript || "", "text");
    };

    const handleClarificationOption = (option: ClarificationOption) => {
        setClarificationAnswer(option.jobId);
        setClarificationChannel("text");
        setClarificationLabel(`${option.title} at ${option.company}`);
        setClarificationSelectedOption(option);
    };

    const clarificationNote = clarificationLabel
        ? `Replying for ${clarificationLabel}`
        : null;

    return (
        <div className="voice-control">
            <div className="voice-control__actions">
                <button
                    type="button"
                    className={`voice-control__button${listening ? " voice-control__button--active" : ""}`}
                    onClick={toggleListening}
                >
                    {listening ? <MicOff aria-hidden /> : <Mic aria-hidden />}
                    <span>{listening ? "Listening" : "Voice"}</span>
                </button>
                <button type="button" className="voice-control__text" onClick={handleManualCommand}>
                    Preview command
                </button>
            </div>
            <p className="voice-control__status">{status}</p>

            <Dialog open={commandOpen} onOpenChange={(open) => (!open ? closeCommandModal() : setCommandOpen(true))}>
                <DialogContent className="voice-command__dialog">
                    <DialogHeader>
                        <DialogTitle>Command center</DialogTitle>
                        <DialogDescription>
                            Preview your AI command, make tweaks, and confirm before applying it to the board.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="voice-command__section">
                        <Label htmlFor="command-transcript">Command</Label>
                        <Textarea
                            id="command-transcript"
                            value={commandTranscript}
                            onChange={(event) => {
                                setCommandTranscript(event.target.value);
                                setCommandChannel("text");
                            }}
                            rows={4}
                        />
                        <div className="voice-command__actions">
                            <Button
                                variant="secondary"
                                onClick={() => previewCommand(commandTranscript)}
                                disabled={isPreviewLoading}
                            >
                                {isPreviewLoading ? (
                                    <>
                                        <Loader2 aria-hidden className="voice-command__spinner" /> Updating preview…
                                    </>
                                ) : (
                                    "Refresh preview"
                                )}
                            </Button>
                            <Button
                                onClick={() => runApply(commandTranscript, commandChannel)}
                                disabled={isApplying || !commandTranscript.trim()}
                            >
                                {isApplying ? (
                                    <>
                                        <Loader2 aria-hidden className="voice-command__spinner" /> Running…
                                    </>
                                ) : (
                                    "Run command"
                                )}
                            </Button>
                        </div>
                        {previewError && <p className="voice-command__error">{previewError}</p>}
                        {applyError && <p className="voice-command__error">{applyError}</p>}
                    </div>

                    {commandPreview?.intent && (
                        <div className="voice-command__preview">
                            <span className="voice-command__intent">{commandPreview.intent}</span>
                            {commandPreview.args && (
                                <ul>
                                    {Object.entries(commandPreview.args).map(([key, value]) => (
                                        <li key={key}>
                                            <strong>{key}:</strong> {String(value ?? "—")}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {clarificationQuestion && (
                        <div className="voice-command__clarification">
                            <p className="voice-command__clarification-question">{clarificationQuestion}</p>
                            {clarificationOptions.length > 0 && (
                                <div className="voice-command__option-grid">
                                    {clarificationOptions.map((option) => (
                                        <button
                                            type="button"
                                            key={option.jobId}
                                            className="voice-command__option"
                                            onClick={() => handleClarificationOption(option)}
                                        >
                                            <strong>{option.title}</strong>
                                            <span>{option.company}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {clarificationNote && <p className="voice-command__note">{clarificationNote}</p>}
                            <Label htmlFor="clarification-answer">Reply</Label>
                            <Textarea
                                id="clarification-answer"
                                value={clarificationSelectedOption ? "" : clarificationAnswer}
                                placeholder={
                                    clarificationSelectedOption
                                        ? clarificationLabel ?? "Replying with the selected job"
                                        : undefined
                                }
                                onChange={(event) => {
                                    setClarificationAnswer(event.target.value);
                                    setClarificationChannel("text");
                                    setClarificationLabel(null);
                                    setClarificationSelectedOption(null);
                                }}
                                rows={3}
                            />
                            <div className="voice-command__clarification-actions">
                                {recognitionSupported && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={startClarificationRecording}
                                        disabled={isClarificationRecording}
                                    >
                                        {isClarificationRecording ? (
                                            <>
                                                <Loader2 aria-hidden className="voice-command__spinner" /> Listening…
                                            </>
                                        ) : (
                                            <>
                                                <Mic aria-hidden className="voice-command__icon" /> Use voice
                                            </>
                                        )}
                                    </Button>
                                )}
                                <Button
                                    onClick={() => runApply(clarificationAnswer, clarificationChannel)}
                                    disabled={isApplying || !clarificationAnswer.trim()}
                                >
                                    {isApplying ? (
                                        <>
                                            <Loader2 aria-hidden className="voice-command__spinner" /> Sending…
                                        </>
                                    ) : (
                                        "Send reply"
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default VoiceControl;
