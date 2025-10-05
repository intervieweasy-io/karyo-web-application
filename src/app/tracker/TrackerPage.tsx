"use client";

import { useCallback, useEffect, useMemo, useState, type DragEvent } from "react";
import { Search, Sparkles } from "lucide-react";
import StageColumn from "./components/StageColumn";
import VoiceControl from "./components/VoiceControl";
import AddJobModal from "./components/AddJobModal";
import { STAGES, type JobItem, type JobStage } from "./data";
import { filterJobs, groupJobsByStage } from "./utils";
import {
    createJob as createJobRequest,
    listJobs as listJobsRequest,
    updateJob as updateJobRequest,
    type ApiJob,
} from "@/services/tracker.service";

const KNOWN_STAGES: JobStage[] = ["WISHLIST", "APPLIED", "INTERVIEW", "OFFER", "ARCHIVED"];

const toKnownStage = (value: string | null | undefined): JobStage | null => {
    if (!value) return null;
    const direct = KNOWN_STAGES.find((stage) => stage === value);
    if (direct) return direct;
    const upper = value.toUpperCase() as JobStage;
    return KNOWN_STAGES.find((stage) => stage === upper) ?? null;
};

const fallbackAppliedDate = (job: ApiJob) => {
    const candidates = [job.appliedOn, job.updatedAt, job.createdAt].filter((value): value is string => Boolean(value));
    const resolved = candidates.find((value) => !Number.isNaN(new Date(value).getTime()));
    if (resolved) {
        return resolved.split("T")[0];
    }
    return new Date().toISOString().split("T")[0];
};

const resolveStage = (job: ApiJob): JobStage => {
    const candidates: Array<string | null | undefined> = [job.stage];
    if ("status" in job && typeof job.status === "string") {
        candidates.push(job.status);
    }
    for (const candidate of candidates) {
        const resolved = toKnownStage(candidate);
        if (resolved) {
            return resolved;
        }
    }
    if (job.archived) {
        return "ARCHIVED";
    }
    return "WISHLIST";
};

const toJobItem = (job: ApiJob): JobItem => ({
    id: job.id,
    role: job.title ?? "Untitled role",
    company: job.company ?? "Unknown company",
    location: job.location ?? "Remote",
    stage: resolveStage(job),
    appliedDate: fallbackAppliedDate(job),
    notes:
        typeof job.notesCount === "number" && Number.isFinite(job.notesCount) ? Math.max(0, job.notesCount) : 0,
    isSaved: job.priority === "starred" || job.priority === "STARRED" || job.isSaved === true,
    logoUrl: job.logoUrl ?? undefined,
});

const TrackerPage = () => {
    const [jobs, setJobs] = useState<JobItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStage, setSelectedStage] = useState<JobStage | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isAddJobOpen, setIsAddJobOpen] = useState(false);

    const filteredJobs = useMemo(
        () => filterJobs(jobs, searchQuery, selectedStage),
        [jobs, searchQuery, selectedStage]
    );
    const groupedJobs = useMemo(() => groupJobsByStage(filteredJobs), [filteredJobs]);

    const stageCounts = useMemo(() => {
        return jobs.reduce<Record<JobStage, number>>(
            (acc, job) => {
                acc[job.stage] += 1;
                return acc;
            },
            {
                WISHLIST: 0,
                APPLIED: 0,
                INTERVIEW: 0,
                OFFER: 0,
                ARCHIVED: 0,
            }
        );
    }, [jobs]);

    const fetchJobs = useCallback(async () => {
        try {
            const { jobs: fetchedJobs } = await listJobsRequest();
            if (Array.isArray(fetchedJobs)) {
                setJobs(fetchedJobs.map(toJobItem));
            } else {
                setJobs([]);
            }
        } catch (error) {
            console.error("Failed to load jobs", error);
        }
    }, []);

    useEffect(() => {
        void fetchJobs();
    }, [fetchJobs]);

    const moveJob = useCallback((jobId: string, stage: JobStage) => {
        void (async () => {
            try {
                const updated = await updateJobRequest(jobId, { stage });
                if (updated) {
                    setJobs((prev) =>
                        prev.map((job) => (job.id === jobId ? toJobItem(updated) : job))
                    );
                    return;
                }
            } catch (error) {
                console.error("Failed to update job", error);
            }
            setJobs((prev) =>
                prev.map((job) =>
                    job.id === jobId
                        ? { ...job, stage, appliedDate: new Date().toISOString().split("T")[0] }
                        : job
                )
            );
        })();
    }, []);

    const handleDragStart = (id: string, event: DragEvent<HTMLDivElement>) => {
        event.dataTransfer?.setData("text/plain", id);
        setActiveId(id);
    };

    const handleDragEnd = () => {
        setActiveId(null);
    };

    const handleDrop = (stage: JobStage, event: DragEvent<HTMLElement>) => {
        const droppedId = event.dataTransfer?.getData("text/plain") || activeId;
        if (droppedId) {
            moveJob(droppedId, stage);
        }
        setActiveId(null);
    };

    const handleAddJob = () => {
        setIsAddJobOpen(true);
    };

    const handleJobCreate = useCallback(
        (job: { company: string; role: string; stage: JobStage }) => {
            void (async () => {
                try {
                    const created = await createJobRequest({
                        title: job.role,
                        company: job.company,
                        location: "Remote",
                    });
                    if (created) {
                        let next = toJobItem(created);
                        if (job.stage !== next.stage) {
                            try {
                                const updated = await updateJobRequest(created.id, { stage: job.stage });
                                if (updated) {
                                    next = toJobItem(updated);
                                } else {
                                    next = { ...next, stage: job.stage };
                                }
                            } catch (error) {
                                console.error("Failed to align stage", error);
                                next = { ...next, stage: job.stage };
                            }
                        }
                        setJobs((prev) => [next, ...prev]);
                        return;
                    }
                } catch (error) {
                    console.error("Failed to create job", error);
                }

                const fallback: JobItem = {
                    id: `${Date.now()}`,
                    role: job.role,
                    company: job.company,
                    location: "Remote",
                    stage: job.stage,
                    appliedDate: new Date().toISOString().split("T")[0],
                    notes: 0,
                    isSaved: false,
                };

                setJobs((prev) => [fallback, ...prev]);
            })();
        },
        []
    );

    return (
        <div className="tracker-page">
            <div className="tracker-backdrop" aria-hidden />
            <main className="tracker-shell">
                <header className="tracker-header">
                    <div className="tracker-heading">
                        <span className="tracker-eyebrow">
                            <Sparkles aria-hidden /> Karyo / Job Tracker
                        </span>
                        <p className="tracker-subtitle">
                            Keep momentum across every stage of your search with the Karyo board.
                        </p>
                    </div>
                </header>

                <div className="tracker-filter-bar">
                    <div className="tracker-filter-buttons">
                        <button
                            type="button"
                            className={`tracker-chip${selectedStage === null ? " tracker-chip--active" : ""}`}
                            onClick={() => setSelectedStage(null)}
                        >
                            All <span className="tracker-chip__count">{jobs.length}</span>
                        </button>
                        {STAGES.map((stage) => (
                            <button
                                key={stage.key}
                                type="button"
                                className={`tracker-chip${selectedStage === stage.key ? " tracker-chip--active" : ""}`}
                                onClick={() => setSelectedStage(stage.key)}
                            >
                                {stage.label} <span className="tracker-chip__count">{stageCounts[stage.key]}</span>
                            </button>
                        ))}
                    </div>

                    <div className="tracker-utilities-wrapper">
                        <div className="tracker-utilities">
                            <div className="tracker-search">
                                <Search aria-hidden />
                                <input
                                    type="search"
                                    value={searchQuery}
                                    onChange={(event) => setSearchQuery(event.target.value)}
                                    placeholder="Search role, company or location"
                                    aria-label="Search jobs"
                                />
                            </div>
                        </div>
                        <VoiceControl jobs={jobs} onMove={moveJob} />
                    </div>
                </div>

                <p className="tracker-visible-count">
                    Showing <strong>{filteredJobs.length}</strong> of {jobs.length} opportunities
                </p>

                <section className="tracker-board" aria-label="Job pipeline">
                    {STAGES.map((stage) => (
                        <StageColumn
                            key={stage.key}
                            stage={stage}
                            jobs={groupedJobs[stage.key]}
                            activeId={activeId}
                            onDrop={handleDrop}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            onAdd={stage.key === "WISHLIST" ? handleAddJob : undefined}
                        />
                    ))}
                </section>
            </main>
            <AddJobModal
                isOpen={isAddJobOpen}
                onClose={() => setIsAddJobOpen(false)}
                onAddJob={handleJobCreate}
            />
        </div>
    );
};

export default TrackerPage;
