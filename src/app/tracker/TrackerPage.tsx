"use client";

import { useMemo, useState, type DragEvent } from "react";
import { Search, Sparkles } from "lucide-react";
import StageColumn from "./components/StageColumn";
import VoiceControl from "./components/VoiceControl";
import { INITIAL_JOBS, STAGES, type JobItem, type JobStage } from "./data";
import { filterJobs, groupJobsByStage } from "./utils";

const TrackerPage = () => {
    const [jobs, setJobs] = useState<JobItem[]>(INITIAL_JOBS);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStage, setSelectedStage] = useState<JobStage | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);

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
                REJECTED: 0,
            }
        );
    }, [jobs]);

    const moveJob = (jobId: string, stage: JobStage) => {
        setJobs((prev) =>
            prev.map((job) =>
                job.id === jobId
                    ? { ...job, stage, appliedDate: new Date().toISOString().split("T")[0] }
                    : job
            )
        );
    };

    const handleDragStart = (id: string, event: DragEvent<HTMLDivElement>) => {
        event.dataTransfer?.setData("text/plain", id);
        setActiveId(id);
    };

    const handleDragEnd = () => {
        setActiveId(null);
    };

    const handleDrop = (stage: JobStage, event: DragEvent<HTMLDivElement>) => {
        const droppedId = event.dataTransfer?.getData("text/plain") || activeId;
        if (droppedId) {
            moveJob(droppedId, stage);
        }
        setActiveId(null);
    };

    const handleAddJob = () => {
        if (typeof window === "undefined") return;
        const role = window.prompt("What role are you tracking?");
        if (!role) return;
        const company = window.prompt("Which company is it for?") || "Unknown company";
        const location = window.prompt("Where is the role located?") || "Remote";

        const newJob: JobItem = {
            id: `${Date.now()}`,
            role,
            company,
            location,
            stage: "WISHLIST",
            appliedDate: new Date().toISOString().split("T")[0],
            notes: 0,
            isSaved: false,
        };

        setJobs((prev) => [newJob, ...prev]);
    };

    return (
        <div className="tracker-page">
            <div className="tracker-backdrop" aria-hidden />
            <main className="tracker-shell">
                <header className="tracker-header">
                    <div className="tracker-heading">
                        <span className="tracker-eyebrow">
                            <Sparkles aria-hidden /> Job Tracker
                        </span>
                        <h1 className="tracker-title">Track it. Clear it.</h1>
                        <p className="tracker-subtitle">
                            Keep momentum across every stage of your search with a kanban board.
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
        </div>
    );
};

export default TrackerPage;
