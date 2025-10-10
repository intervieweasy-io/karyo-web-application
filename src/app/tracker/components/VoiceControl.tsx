"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Mic, MicOff } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { JobItem, JobStage } from "../data";
import { STAGES } from "../data";
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

const KNOWN_STAGES: JobStage[] = STAGES.map((stage) => stage.key);

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

interface CommandPreviewState {
    command: ParsedCommand | null;
    intentLabel: string | null;
    error: string | null;
    isLoading: boolean;
}

interface ApplyState {
    isApplying: boolean;
    error: string | null;
}

interface ClarificationState {
    question: string | null;
    options: ClarificationOption[];
    answer: string;
    label: string | null;
    selectedOption: ClarificationOption | null;
    note: string | null;
    isRecording: boolean;
}

interface CommandDialogProps {
    open: boolean;
    onClose: () => void;
    transcript: string;
    onTranscriptChange: (value: string) => void;
    onPreview: () => void;
    onRun: () => void;
    preview: CommandPreviewState;
    apply: ApplyState;
    clarification: ClarificationState;
    onClarificationAnswerChange: (value: string) => void;
    onClarificationOptionSelect: (option: ClarificationOption) => void;
    onClarificationRun: () => void;
    onClarificationRecord: () => void;
    recognitionSupported: boolean;
}

const getIntentLabel = (intent: ParsedCommand["intent"] | undefined): string | null => {
    if (!intent) return null;
    if (typeof intent === "string") {
        return intent;
    }
    if (typeof intent === "object") {
        if ("label" in intent && typeof intent.label === "string") {
            return intent.label;
        }
        if ("name" in intent && typeof intent.name === "string") {
            return intent.name;
        }
    }
    return JSON.stringify(intent);
};

const CommandDialog = ({
    open,
    onClose,
    transcript,
    onTranscriptChange,
    onPreview,
    onRun,
    preview,
    apply,
    clarification,
    onClarificationAnswerChange,
    onClarificationOptionSelect,
    onClarificationRun,
    onClarificationRecord,
    recognitionSupported,
}: CommandDialogProps) => {
    const { command, intentLabel, error: previewError, isLoading } = preview;
    const { isApplying, error: applyError } = apply;
    const {
        question,
        options,
        answer,
        label,
        selectedOption,
        note,
        isRecording,
    } = clarification;

    const commandHasText = transcript.trim().length > 0;
    const clarificationHasAnswer = answer.trim().length > 0;

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : undefined)}>
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
                        value={transcript}
                        onChange={(event) => onTranscriptChange(event.target.value)}
                        rows={4}
                    />
                    <div className="voice-command__actions">
                        <Button variant="secondary" onClick={onPreview} disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 aria-hidden className="voice-command__spinner" /> Updating preview…
                                </>
                            ) : (
                                "Refresh preview"
                            )}
                        </Button>
                        <Button onClick={onRun} disabled={isApplying || !commandHasText}>
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

                <div className="voice-command__preview" aria-live="polite">
                    {intentLabel ? (
                        <span className="voice-command__intent">{intentLabel}</span>
                    ) : (
                        <p className="voice-command__placeholder">
                            {isLoading ? "Understanding your command…" : "Preview will appear here once parsed."}
                        </p>
                    )}
                    {command?.args && Object.keys(command.args).length > 0 && (
                        <ul>
                            {Object.entries(command.args).map(([key, value]) => (
                                <li key={key}>
                                    <strong>{key}:</strong> {String(value ?? "—")}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {question && (
                    <div className="voice-command__clarification">
                        <p className="voice-command__clarification-question">{question}</p>
                        {options.length > 0 && (
                            <div className="voice-command__option-grid">
                                {options.map((option) => (
                                    <button
                                        type="button"
                                        key={option.jobId}
                                        className="voice-command__option"
                                        onClick={() => onClarificationOptionSelect(option)}
                                    >
                                        <strong>{option.title}</strong>
                                        <span>{option.company}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        {note && <p className="voice-command__note">{note}</p>}
                        <Label htmlFor="clarification-answer">Reply</Label>
                        <Textarea
                            id="clarification-answer"
                            value={selectedOption ? "" : answer}
                            placeholder={selectedOption ? label ?? "Replying with the selected job" : undefined}
                            onChange={(event) => onClarificationAnswerChange(event.target.value)}
                            rows={3}
                        />
                        <div className="voice-command__clarification-actions">
                            {recognitionSupported && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={onClarificationRecord}
                                    disabled={isRecording}
                                >
                                    {isRecording ? (
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
                            <Button onClick={onClarificationRun} disabled={isApplying || !clarificationHasAnswer}>
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
    );
};

const useSpeechRecognition = () => {
    const supported = useMemo(() => {
        if (typeof window === "undefined") return false;
        const speechWindow = window as typeof window & {
            SpeechRecognition?: RecognitionCtor;
            webkitSpeechRecognition?: RecognitionCtor;
        };
        return Boolean(speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition);
    }, []);

    const buildInstance = useCallback((): RecognitionInstance | null => {
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

    return { supported, buildInstance } as const;
};

const VoiceControl = ({ jobs, onMove }: VoiceControlProps) => {
    const { toast } = useToast();
    const { supported: recognitionSupported, buildInstance } = useSpeechRecognition();
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
    const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);

    const [clarificationQuestion, setClarificationQuestion] = useState<string | null>(null);
    const [clarificationOptions, setClarificationOptions] = useState<ClarificationOption[]>([]);
    const [clarificationAnswer, setClarificationAnswer] = useState("");
    const [clarificationChannel, setClarificationChannel] = useState<CommandChannel>("text");
    const [clarificationLabel, setClarificationLabel] = useState<string | null>(null);
    const [clarificationSelectedOption, setClarificationSelectedOption] = useState<ClarificationOption | null>(
        null
    );
    const [isClarificationRecording, setIsClarificationRecording] = useState(false);

    const resetClarificationState = useCallback(() => {
        clarificationRecognitionRef.current?.stop?.();
        clarificationRecognitionRef.current = null;
        setClarificationQuestion(null);
        setClarificationOptions([]);
        setClarificationAnswer("");
        setClarificationChannel("text");
        setClarificationLabel(null);
        setClarificationSelectedOption(null);
        setIsClarificationRecording(false);
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
        setCommandChannel("voice");
        setCommandPreview(null);
        setPreviewError(null);
        setApplyError(null);
        setIsPreviewLoading(false);
        setIsApplying(false);
        setPendingRequestId(null);
        resetClarificationState();
    }, [resetClarificationState]);

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
                    setPendingRequestId(null);
                    resetClarificationState();
                    const summary = summariseEffects(response.effects, jobs);
                    setStatus(summary);
                    toast({ title: "Command applied", description: summary });
                    handleEffects(response.effects);
                    closeCommandModal();
                } else if (response.status === "NEED_CLARIFICATION") {
                    setPendingRequestId(response.requestId);
                    setClarificationQuestion(response.question);
                    setClarificationOptions(response.options ?? []);
                    setClarificationAnswer("");
                    setClarificationChannel("text");
                    setClarificationLabel(null);
                    setClarificationSelectedOption(null);
                    setIsClarificationRecording(false);
                    setStatus("We need a quick clarification to continue.");
                } else if (response.status === "IGNORED_DUPLICATE") {
                    setPendingRequestId(null);
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
        [
            closeCommandModal,
            handleEffects,
            jobs,
            pendingRequestId,
            resetClarificationState,
            toast,
        ]
    );

    const openCommandModal = useCallback(
        (transcript: string, channel: CommandChannel) => {
            setCommandTranscript(transcript);
            setCommandChannel(channel);
            setCommandPreview(null);
            setPreviewError(null);
            setApplyError(null);
            resetClarificationState();
            setClarificationChannel(channel);
            setCommandOpen(true);
            if (transcript.trim()) {
                void previewCommand(transcript);
            }
        },
        [previewCommand, resetClarificationState]
    );

    useEffect(() => {
        if (!recognitionSupported) return;
        const recognition = buildInstance();
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
    }, [buildInstance, openCommandModal, recognitionSupported]);

    useEffect(() => {
        return () => {
            recognitionRef.current?.stop();
            clarificationRecognitionRef.current?.stop?.();
        };
    }, []);

    const startClarificationRecording = () => {
        const recognition = buildInstance();
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
        const label = `${option.title} at ${option.company}`;
        setClarificationAnswer(label);
        setClarificationChannel("text");
        setClarificationLabel(label);
        setClarificationSelectedOption(option);
    };

    const clarificationNote = clarificationLabel ? `Replying for ${clarificationLabel}` : null;

    const intentLabel = useMemo(
        () => getIntentLabel(commandPreview?.intent),
        [commandPreview?.intent]
    );

    const previewState: CommandPreviewState = {
        command: commandPreview,
        intentLabel,
        error: previewError,
        isLoading: isPreviewLoading,
    };

    const applyState: ApplyState = {
        isApplying,
        error: applyError,
    };

    const clarificationState: ClarificationState = {
        question: clarificationQuestion,
        options: clarificationOptions,
        answer: clarificationAnswer,
        label: clarificationLabel,
        selectedOption: clarificationSelectedOption,
        note: clarificationNote,
        isRecording: isClarificationRecording,
    };

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

            <CommandDialog
                open={commandOpen}
                onClose={closeCommandModal}
                transcript={commandTranscript}
                onTranscriptChange={(value) => {
                    setCommandTranscript(value);
                    setCommandChannel("text");
                }}
                onPreview={() => previewCommand(commandTranscript)}
                onRun={() => runApply(commandTranscript, commandChannel)}
                preview={previewState}
                apply={applyState}
                clarification={clarificationState}
                onClarificationAnswerChange={(value) => {
                    setClarificationAnswer(value);
                    setClarificationChannel("text");
                    setClarificationLabel(null);
                    setClarificationSelectedOption(null);
                }}
                onClarificationOptionSelect={handleClarificationOption}
                onClarificationRun={() => runApply(clarificationAnswer, clarificationChannel)}
                onClarificationRecord={startClarificationRecording}
                recognitionSupported={recognitionSupported}
            />
        </div>
    );
};

export default VoiceControl;
