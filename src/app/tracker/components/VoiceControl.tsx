"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import type { JobItem, JobStage } from "../data";
import { findJobByText } from "../utils";

interface VoiceControlProps {
    jobs: JobItem[];
    onMove: (jobId: string, stage: JobStage) => void;
}

type RecognitionInstance = {
    lang: string;
    interimResults: boolean;
    maxAlternatives: number;
    start: () => void;
    stop: () => void;
    abort: () => void;
    onresult: ((event: { results: Array<{ 0: { transcript: string } }> }) => void) | null;
    onerror: ((event: unknown) => void) | null;
    onspeechend: (() => void) | null;
};

type RecognitionCtor = new () => RecognitionInstance;

type StageAlias = {
    label: string;
    stage: JobStage;
};

const aliases: StageAlias[] = [
    { label: "wishlist", stage: "WISHLIST" },
    { label: "applied", stage: "APPLIED" },
    { label: "interview", stage: "INTERVIEW" },
    { label: "offer", stage: "OFFER" },
    { label: "archived", stage: "ARCHIVED" },
];

const VoiceControl = ({ jobs, onMove }: VoiceControlProps) => {
    const [listening, setListening] = useState(false);
    const [status, setStatus] = useState<string>("Give a quick voice command");
    const recognitionRef = useRef<RecognitionInstance | null>(null);

    const recognitionSupported = useMemo(() => {
        if (typeof window === "undefined") return false;
        const speechWindow = window as typeof window & {
            SpeechRecognition?: RecognitionCtor;
            webkitSpeechRecognition?: RecognitionCtor;
        };
        return Boolean(speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition);
    }, []);

    const resolveStage = useCallback((input: string): JobStage | null => {
        const lower = input.toLowerCase();
        const match = aliases.find((alias) => lower.includes(alias.label));
        return match?.stage ?? null;
    }, []);

    const processCommand = useCallback(
        (phrase: string) => {
            if (!phrase.trim()) return;
            const job = findJobByText(jobs, phrase);
            const stage = resolveStage(phrase);

            if (job && stage) {
                onMove(job.id, stage);
                setStatus(`Moved ${job.role} to ${stage.toLowerCase()}`);
            } else if (!job) {
                setStatus("Could not recognise the job in that command");
            } else {
                setStatus("I heard you, but could not find the stage");
            }
        },
        [jobs, onMove, resolveStage]
    );

    useEffect(() => {
        if (!recognitionSupported || typeof window === "undefined") return;
        const speechWindow = window as typeof window & {
            SpeechRecognition?: RecognitionCtor;
            webkitSpeechRecognition?: RecognitionCtor;
        };
        const ctor = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
        if (!ctor) return;
        const recognition = new ctor();
        recognition.lang = "en-US";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.onresult = (event) => {
            const transcript = event.results[0]?.[0]?.transcript;
            if (transcript) {
                processCommand(transcript);
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
    }, [processCommand, recognitionSupported]);

    const manualCommand = () => {
        if (typeof window === "undefined") return;
        const command = window.prompt("Try something like 'Move Linear to interview'");
        if (command) {
            processCommand(command);
        } else {
            setStatus("No command provided");
        }
    };

    const toggleListening = () => {
        if (!recognitionSupported || !recognitionRef.current) {
            setStatus("Voice input unavailable. Enter a quick command instead.");
            manualCommand();
            return;
        }

        if (listening) {
            recognitionRef.current.stop();
            setListening(false);
            return;
        }

        recognitionRef.current.start();
        setStatus("Listening... say 'Move [job] to [stage]'");
        setListening(true);
    };

    return (
        <div className="voice-control">
            <button type="button" className={`voice-control__button${listening ? " voice-control__button--active" : ""}`} onClick={toggleListening}>
                {listening ? <MicOff aria-hidden /> : <Mic aria-hidden />}
                <span>{listening ? "Listening" : "Voice"}</span>
            </button>
            <p className="voice-control__status">{status}</p>
        </div>
    );
};

export default VoiceControl;
