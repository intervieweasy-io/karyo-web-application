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

const stageKeywords: Record<JobStage, string[]> = {
    WISHLIST: [],
    APPLIED: ["applied", "sent application", "submitted"],
    INTERVIEW: ["interview", "phone screen", "meeting"],
    OFFER: ["offer", "got offer", "received offer"],
    ARCHIVED: ["rejected", "declined", "turned down"],
};

const defaultStage: JobStage = "WISHLIST";

const AddJobModal = ({ isOpen, onClose, onAddJob }: AddJobModalProps) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [jobUrl, setJobUrl] = useState("");
    const [jobText, setJobText] = useState("");
    const [isRecording, setIsRecording] = useState(false);

    const resolveStage = (content: string): JobStage => {
        const lower = content.toLowerCase();
        for (const [stage, keywords] of Object.entries(stageKeywords) as Array<[JobStage, string[]]>) {
            if (keywords.some((keyword) => lower.includes(keyword))) {
                return stage;
            }
        }
        return defaultStage;
    };

    const addJobAndClose = (job: { company: string; role: string; stage: JobStage }, message: string) => {
        onAddJob(job);
        toast({ title: "Job Added! 🎉", description: message });
        setIsLoading(false);
        setIsRecording(false);
        setJobText("");
        setJobUrl("");
        onClose();
    };

    const handleLinkSubmit = async () => {
        if (!jobUrl.trim()) return;
        setIsLoading(true);
        try {
            const url = new URL(jobUrl);
            const company = url.hostname.replace(/^www\./, "");
            const role = url.pathname.split("/").filter(Boolean).pop() ?? "Role";
            const cleanedRole = role.replace(/[-_]/g, " ").replace(/\d+/g, "").trim() || "Role";
            addJobAndClose(
                { company, role: cleanedRole, stage: defaultStage },
                "Successfully parsed job from link"
            );
        } catch (error) {
            console.error("Failed to parse job link", error);
            toast({
                title: "Unable to parse link",
                description: "Enter a valid job posting URL",
                variant: "destructive",
            });
            setIsLoading(false);
        }
    };

    const handleTextSubmit = async () => {
        if (!jobText.trim()) return;
        setIsLoading(true);
        const content = jobText.trim();
        const lines = content.split(/\n|\./).map((line) => line.trim()).filter(Boolean);
        const headline = lines[0] ?? "Job";
        const words = headline.split(" at ");
        const role = words[0]?.trim() || "Role";
        const company = words[1]?.trim() || "Unknown company";
        const stage = resolveStage(content);
        addJobAndClose(
            { company, role, stage },
            "Successfully parsed job from text"
        );
    };

    const processVoiceJobInput = (transcript: string) => {
        const cleanInput = transcript.toLowerCase();

        const companyPatterns = [
            /(?:at|from|to|with)\s+([a-z][a-z\s]+?)(?:\s+(?:as|for|in)|$)/i,
            /([a-z][a-z\s]+?)(?:\s+(?:as|for|in))/i,
        ];

        let company = "";
        for (const pattern of companyPatterns) {
            const match = cleanInput.match(pattern);
            if (match && match[1]) {
                company = match[1].trim();
                break;
            }
        }

        const rolePatterns = [
            /(?:as|for)\s+([a-z][a-z\s]+?)(?:\s+(?:position|role)|$)/i,
            /(?:pm|product manager|engineer|developer|analyst|designer|manager)/i,
        ];

        let role = "";
        for (const pattern of rolePatterns) {
            const match = cleanInput.match(pattern);
            if (!match) continue;
            if (typeof match === "string") {
                role = match;
            } else if (match[1]) {
                role = match[1];
            } else if (match[0]) {
                role = match[0];
            }
            break;
        }

        const stage = resolveStage(cleanInput);

        if (company || role) {
            const finalCompany = company || "Unknown company";
            const finalRole = role || "Position";
            addJobAndClose(
                { company: finalCompany, role: finalRole, stage },
                `Added ${finalRole} at ${finalCompany}`
            );
        } else {
            toast({
                title: "Couldn't parse job info",
                description: 'Try saying: "Add job at Google as PM position applied"',
                variant: "destructive",
            });
            setIsRecording(false);
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

        recognition.onresult = (event) => {
            const result = event.results[event.results.length - 1];
            if (result?.isFinal) {
                const transcript = result[0]?.transcript ?? "";
                processVoiceJobInput(transcript);
            }
        };

        recognition.onerror = () => {
            toast({
                title: "Error",
                description: "Could not capture voice input",
                variant: "destructive",
            });
            setIsRecording(false);
        };

        recognition.onend = () => {
            setIsRecording(false);
        };

        setIsRecording(true);
        recognition.start();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
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
                                    disabled={isLoading || !jobUrl.trim()}
                                    aria-label="Parse job link"
                                >
                                    {isLoading ? <Loader2 aria-hidden className="add-job__spinner" /> : <ExternalLink aria-hidden />}
                                </Button>
                            </div>
                            <p className="add-job__hint">Works with LinkedIn, Indeed, company career pages, and more.</p>
                        </div>

                        {isLoading && (
                            <div className="add-job__status">
                                <Loader2 aria-hidden className="add-job__spinner" />
                                <div>
                                    <p className="add-job__status-title">Parsing job posting…</p>
                                    <p className="add-job__status-copy">Extracting company, role, and requirements</p>
                                </div>
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
                                disabled={isLoading || !jobText.trim()}
                            >
                                {isLoading ? (
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
                                <p>Say something like: “Applied to Google for PM role yesterday, interview Thursday”.</p>
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
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

export default AddJobModal;
