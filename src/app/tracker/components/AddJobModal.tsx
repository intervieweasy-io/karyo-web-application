"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Building2, ExternalLink, FileText, Link2, Loader2, Mic } from "lucide-react";
import type { JobStage } from "../data";
import { parseCommand, parseLink, type ParsedCommand } from "@/services/tracker.service";
import "./add-job-modal.css";

type RecognitionResult = {
    isFinal: boolean;
    0?: { transcript?: string };
};

interface RecognitionEvent {
    results: ArrayLike<RecognitionResult>;
}

interface RecognitionInstance {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives?: number;
    start: () => void;
    stop: () => void;
    onresult: ((event: RecognitionEvent) => void) | null;
    onerror: ((event: unknown) => void) | null;
    onend: (() => void) | null;
}

type RecognitionConstructor = new () => RecognitionInstance;

interface AddJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddJob: (job: { company: string; role: string; stage: JobStage }) => void;
}

const STAGE_OPTIONS: JobStage[] = ["WISHLIST", "APPLIED", "INTERVIEW", "OFFER", "ARCHIVED"];

const stageKeywords: Record<JobStage, string[]> = {
    WISHLIST: [],
    APPLIED: ["applied", "sent application", "submitted"],
    INTERVIEW: ["interview", "phone screen", "meeting"],
    OFFER: ["offer", "got offer", "received offer"],
    ARCHIVED: ["rejected", "declined", "turned down"],
};

const defaultStage: JobStage = "WISHLIST";

const normaliseStage = (value: unknown): JobStage | null => {
    if (typeof value !== "string") return null;
    const upper = value.toUpperCase() as JobStage;
    return STAGE_OPTIONS.includes(upper) ? upper : null;
};

const resolveStageFromText = (content: string): JobStage => {
    const lower = content.toLowerCase();
    for (const [stage, keywords] of Object.entries(stageKeywords) as Array<[JobStage, string[]]>) {
        if (keywords.some((keyword) => lower.includes(keyword))) {
            return stage;
        }
    }
    return defaultStage;
};

const AddJobModal = ({ isOpen, onClose, onAddJob }: AddJobModalProps) => {
    const { toast } = useToast();
    const [jobUrl, setJobUrl] = useState("");
    const [jobText, setJobText] = useState("");
    const [isRecording, setIsRecording] = useState(false);

    const [linkLoading, setLinkLoading] = useState(false);
    const [textLoading, setTextLoading] = useState(false);
    const [voiceLoading, setVoiceLoading] = useState(false);

    const [linkError, setLinkError] = useState<string | null>(null);
    const [voiceError, setVoiceError] = useState<string | null>(null);

    const [linkJob, setLinkJob] = useState<{ company: string; role: string; location: string } | null>(null);
    const [voiceTranscript, setVoiceTranscript] = useState("");
    const [voiceParse, setVoiceParse] = useState<ParsedCommand | null>(null);
    const [voiceJob, setVoiceJob] = useState<{ company: string; role: string; stage: JobStage } | null>(null);

    const resetState = () => {
        setJobUrl("");
        setJobText("");
        setIsRecording(false);
        setLinkLoading(false);
        setTextLoading(false);
        setVoiceLoading(false);
        setLinkError(null);
        setVoiceError(null);
        setLinkJob(null);
        setVoiceTranscript("");
        setVoiceParse(null);
        setVoiceJob(null);
    };

    const handleDialogChange = (open: boolean) => {
        if (!open) {
            resetState();
            onClose();
        }
    };

    const addJobAndClose = (job: { company: string; role: string; stage: JobStage }, message: string) => {
        onAddJob(job);
        toast({ title: "Job Added! 🎉", description: message });
        resetState();
        onClose();
    };

    const handleLinkSubmit = async () => {
        const trimmed = jobUrl.trim();
        if (!trimmed) return;
        setLinkLoading(true);
        setLinkError(null);
        try {
            const parsed = await parseLink({ sourceUrl: trimmed });
            const url = new URL(trimmed);
            const slug = url.pathname.split("/").filter(Boolean).pop() ?? "";
            const cleanedRole =
                (parsed.title ?? "")
                    .trim()
                    .replace(/[-_]/g, " ")
                    .replace(/\s+/g, " ") ||
                slug.replace(/[-_]/g, " ").replace(/\d+/g, "").trim() ||
                "Role";
            const resolvedCompany =
                (parsed.company ?? "").trim() || url.hostname.replace(/^www\./, "") || "Unknown company";
            const resolvedLocation = (parsed.location ?? "").trim() || "Remote";

            setLinkJob({ company: resolvedCompany, role: cleanedRole, location: resolvedLocation });
        } catch (error) {
            console.error("Failed to parse job link", error);
            setLinkJob(null);
            setLinkError("We couldn't parse that link. Please double-check the URL and try again.");
        } finally {
            setLinkLoading(false);
        }
    };

    const handleTextSubmit = async () => {
        if (!jobText.trim()) return;
        setTextLoading(true);
        try {
            const content = jobText.trim();
            const lines = content.split(/\n|\./).map((line) => line.trim()).filter(Boolean);
            const headline = lines[0] ?? "Job";
            const words = headline.split(" at ");
            const role = words[0]?.trim() || "Role";
            const company = words[1]?.trim() || "Unknown company";
            const stage = resolveStageFromText(content);
            addJobAndClose(
                { company, role, stage },
                "Successfully parsed job from text"
            );
        } finally {
            setTextLoading(false);
        }
    };

    const runVoiceParse = async (transcript: string) => {
        setVoiceLoading(true);
        setVoiceError(null);
        setVoiceParse(null);
        setVoiceJob(null);
        try {
            const parsed = await parseCommand({ transcript });
            setVoiceParse(parsed);
            if (parsed?.intent === "CREATE") {
                const args = parsed.args ?? {};
                const company =
                    (typeof args.company === "string" && args.company.trim()) ||
                    (typeof args.organisation === "string" && args.organisation.trim()) ||
                    "Unknown company";
                const role =
                    (typeof args.position === "string" && args.position.trim()) ||
                    (typeof args.title === "string" && args.title.trim()) ||
                    "New Role";
                const stage = normaliseStage(args.stage) ?? defaultStage;
                setVoiceJob({ company, role, stage });
            } else if (parsed?.intent) {
                setVoiceError(`Detected intent “${parsed.intent}”, but only job creation is supported here.`);
            } else {
                setVoiceError("We couldn't understand that command. Try rephrasing and try again.");
            }
        } catch (error) {
            console.error("Failed to parse voice command", error);
            setVoiceError("We couldn't parse that command. Please try again.");
        } finally {
            setVoiceLoading(false);
        }
    };

    const handleVoiceRecord = async () => {
        if (typeof window === "undefined") return;
        const speechWindow = window as typeof window & {
            SpeechRecognition?: RecognitionConstructor;
            webkitSpeechRecognition?: RecognitionConstructor;
        };

        const RecognitionCtor: RecognitionConstructor | undefined =
            speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;

        if (!RecognitionCtor) {
            toast({
                title: "Not Supported",
                description: "Speech recognition is not supported in this browser",
                variant: "destructive",
            });
            return;
        }

        const recognition = new RecognitionCtor();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";
        recognition.maxAlternatives = 1;

        recognition.onresult = (event) => {
            const result = event.results[event.results.length - 1];
            const transcript = result?.[0]?.transcript ?? "";
            const cleaned = transcript.trim();
            if (cleaned) {
                setVoiceTranscript(cleaned);
                void runVoiceParse(cleaned);
            } else {
                setVoiceError("We couldn't hear anything. Try again.");
            }
        };

        recognition.onerror = () => {
            setVoiceError("Could not capture voice input. Try again.");
            setIsRecording(false);
        };

        recognition.onend = () => {
            setIsRecording(false);
        };

        setVoiceError(null);
        setVoiceTranscript("");
        setVoiceParse(null);
        setVoiceJob(null);
        setIsRecording(true);
        recognition.start();
    };

    const previewVoiceFromText = async () => {
        const cleaned = voiceTranscript.trim();
        if (!cleaned) {
            setVoiceError("Enter a quick description so we can parse it.");
            return;
        }
        await runVoiceParse(cleaned);
    };

    const confirmLinkJob = () => {
        if (!linkJob) return;
        const company = linkJob.company.trim() || "Unknown company";
        const role = linkJob.role.trim() || "Role";
        addJobAndClose(
            { company, role, stage: defaultStage },
            `Added ${role} at ${company}`
        );
    };

    const confirmVoiceJob = () => {
        if (!voiceJob) return;
        const company = voiceJob.company.trim() || "Unknown company";
        const role = voiceJob.role.trim() || "New Role";
        addJobAndClose(
            { company, role, stage: voiceJob.stage },
            `Added ${role} at ${company}`
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleDialogChange}>
            <DialogContent className="add-job__content">
                <DialogHeader>
                    <DialogTitle className="add-job__title">Add New Job</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="link" className="add-job__tabs">
                    <TabsList className="add-job__tab-list">
                        <TabsTrigger value="link" className="add-job__tab">
                            <Link2 aria-hidden className="add-job__tab-icon" />
                            Link
                        </TabsTrigger>
                        <TabsTrigger value="paste" className="add-job__tab">
                            <FileText aria-hidden className="add-job__tab-icon" />
                            Paste
                        </TabsTrigger>
                        <TabsTrigger value="voice" className="add-job__tab">
                            <Mic aria-hidden className="add-job__tab-icon" />
                            Voice
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="link" className="add-job__panel">
                        <div className="add-job__field">
                            <Label htmlFor="job-url">Job Posting URL</Label>
                            <div className="add-job__input-row">
                                <Input
                                    id="job-url"
                                    placeholder="https://company.com/jobs/role-123"
                                    value={jobUrl}
                                    onChange={(event) => setJobUrl(event.target.value)}
                                />
                                <Button
                                    onClick={handleLinkSubmit}
                                    disabled={linkLoading || !jobUrl.trim()}
                                    aria-label="Parse job link"
                                >
                                    {linkLoading ? (
                                        <Loader2 aria-hidden className="add-job__spinner" />
                                    ) : (
                                        <ExternalLink aria-hidden />
                                    )}
                                </Button>
                            </div>
                            <p className="add-job__hint">Works with LinkedIn, Indeed, company career pages, and more.</p>
                            {linkError && <p className="add-job__error">{linkError}</p>}
                        </div>

                        {linkLoading && (
                            <div className="add-job__status">
                                <Loader2 aria-hidden className="add-job__spinner" />
                                <div>
                                    <p className="add-job__status-title">Parsing job posting…</p>
                                    <p className="add-job__status-copy">Extracting company, role, and location</p>
                                </div>
                            </div>
                        )}

                        {linkJob && !linkLoading && (
                            <div className="add-job__preview">
                                <p className="add-job__preview-title">Preview job</p>
                                <div className="add-job__preview-grid">
                                    <div className="add-job__preview-field">
                                        <Label htmlFor="preview-role">Role</Label>
                                        <Input
                                            id="preview-role"
                                            value={linkJob.role}
                                            onChange={(event) =>
                                                setLinkJob((prev) =>
                                                    prev
                                                        ? { ...prev, role: event.target.value }
                                                        : prev
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="add-job__preview-field">
                                        <Label htmlFor="preview-company">Company</Label>
                                        <Input
                                            id="preview-company"
                                            value={linkJob.company}
                                            onChange={(event) =>
                                                setLinkJob((prev) =>
                                                    prev
                                                        ? { ...prev, company: event.target.value }
                                                        : prev
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="add-job__preview-field">
                                        <Label htmlFor="preview-location">Location</Label>
                                        <Input
                                            id="preview-location"
                                            value={linkJob.location}
                                            onChange={(event) =>
                                                setLinkJob((prev) =>
                                                    prev
                                                        ? { ...prev, location: event.target.value }
                                                        : prev
                                                )
                                            }
                                        />
                                    </div>
                                </div>
                                <Button className="add-job__submit" onClick={confirmLinkJob}>
                                    Add to wishlist
                                </Button>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="paste" className="add-job__panel">
                        <div className="add-job__field">
                            <Label htmlFor="job-text">Job Description or Notes</Label>
                            <Textarea
                                id="job-text"
                                placeholder="Paste job description, your notes, or any job-related text here…"
                                value={jobText}
                                onChange={(event) => setJobText(event.target.value)}
                                rows={6}
                            />
                            <Button
                                className="add-job__submit"
                                onClick={handleTextSubmit}
                                disabled={textLoading || !jobText.trim()}
                            >
                                {textLoading ? (
                                    <>
                                        <Loader2 aria-hidden className="add-job__spinner" /> Parsing Text…
                                    </>
                                ) : (
                                    <>
                                        <Building2 aria-hidden className="add-job__tab-icon" /> Parse &amp; Add Job
                                    </>
                                )}
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="voice" className="add-job__panel">
                        <div className="add-job__voice">
                            <div className={isRecording ? "add-job__mic add-job__mic--active" : "add-job__mic"}>
                                <Mic aria-hidden className="add-job__mic-icon" />
                            </div>

                            <div className="add-job__voice-copy">
                                <h3>Voice Job Update</h3>
                                <p>
                                    Say something like: “Create a wishlist job for Senior Designer at Linear in San Francisco”.
                                </p>
                            </div>

                            <Button onClick={handleVoiceRecord} disabled={isRecording} className="add-job__voice-button">
                                {isRecording ? (
                                    <>
                                        <Loader2 aria-hidden className="add-job__spinner" /> Listening…
                                    </>
                                ) : (
                                    <>
                                        <Mic aria-hidden className="add-job__tab-icon" /> Start Recording
                                    </>
                                )}
                            </Button>

                            {voiceTranscript && (
                                <div className="add-job__voice-preview">
                                    <Label htmlFor="voice-transcript">Transcript</Label>
                                    <Textarea
                                        id="voice-transcript"
                                        value={voiceTranscript}
                                        onChange={(event) => setVoiceTranscript(event.target.value)}
                                        rows={3}
                                    />
                                    <div className="add-job__voice-actions">
                                        <Button
                                            variant="secondary"
                                            onClick={previewVoiceFromText}
                                            disabled={voiceLoading}
                                        >
                                            {voiceLoading ? (
                                                <>
                                                    <Loader2 aria-hidden className="add-job__spinner" /> Updating preview…
                                                </>
                                            ) : (
                                                "Refresh preview"
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {voiceParse && (
                                <div className="add-job__command-preview">
                                    <span className="add-job__command-intent">{voiceParse.intent ?? "Unknown"}</span>
                                    {voiceParse.args && (
                                        <ul>
                                            {Object.entries(voiceParse.args).map(([key, value]) => (
                                                <li key={key}>
                                                    <strong>{key}:</strong> {String(value ?? "—")}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}

                            {voiceError && <p className="add-job__error">{voiceError}</p>}

                            {voiceJob && !voiceLoading && (
                                <div className="add-job__preview">
                                    <p className="add-job__preview-title">Ready to add</p>
                                    <div className="add-job__preview-grid">
                                        <div className="add-job__preview-field">
                                            <Label htmlFor="voice-role">Role</Label>
                                            <Input
                                                id="voice-role"
                                                value={voiceJob.role}
                                                onChange={(event) =>
                                                    setVoiceJob((prev) =>
                                                        prev
                                                            ? { ...prev, role: event.target.value }
                                                            : prev
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="add-job__preview-field">
                                            <Label htmlFor="voice-company">Company</Label>
                                            <Input
                                                id="voice-company"
                                                value={voiceJob.company}
                                                onChange={(event) =>
                                                    setVoiceJob((prev) =>
                                                        prev
                                                            ? { ...prev, company: event.target.value }
                                                            : prev
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="add-job__preview-field">
                                            <Label htmlFor="voice-stage">Stage</Label>
                                            <select
                                                id="voice-stage"
                                                className="add-job__select"
                                                value={voiceJob.stage}
                                                onChange={(event) =>
                                                    setVoiceJob((prev) =>
                                                        prev
                                                            ? { ...prev, stage: event.target.value as JobStage }
                                                            : prev
                                                    )
                                                }
                                            >
                                                {STAGE_OPTIONS.map((stage) => (
                                                    <option key={stage} value={stage}>
                                                        {stage.charAt(0) + stage.slice(1).toLowerCase()}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <Button className="add-job__submit" onClick={confirmVoiceJob}>
                                        Add job from voice
                                    </Button>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

export default AddJobModal;
