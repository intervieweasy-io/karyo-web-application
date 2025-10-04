"use client";

import { useEffect, useMemo, useState, type DragEvent } from "react";
import { Bell, Calendar, LayoutDashboard, Menu, Search, Settings, Sparkles, X } from "lucide-react";
import StageColumn from "./components/StageColumn";
import VoiceControl from "./components/VoiceControl";
import { INITIAL_JOBS, STAGES, type JobItem, type JobStage } from "./data";
import { filterJobs, groupJobsByStage } from "./utils";
import "./tracker.css";

const TrackerPage = () => {
    const [jobs, setJobs] = useState<JobItem[]>(INITIAL_JOBS);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStage, setSelectedStage] = useState<JobStage | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (window.innerWidth < 1100) {
            setIsSidebarOpen(false);
        }
    }, []);

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

    const handleDrop = (stage: JobStage, event: DragEvent<HTMLElement>) => {
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
        <div className="tracker-page" data-sidebar-open={isSidebarOpen}>
            <div className="tracker-backdrop" aria-hidden />
            <main className="tracker-shell">
                <aside
                    id="tracker-navigation"
                    className="tracker-sidebar"
                    aria-label="Tracker navigation"
                    data-open={isSidebarOpen}
                >
                    <button
                        type="button"
                        className="tracker-sidebar__dismiss"
                        onClick={() => setIsSidebarOpen(false)}
                        aria-label="Close navigation"
                    >
                        <X aria-hidden />
                    </button>
                    <div className="tracker-sidebar__brand">
                        <span className="tracker-sidebar__brand-mark">K</span>
                        <div className="tracker-sidebar__brand-text">
                            <p>Karyo Tracker</p>
                            <span>Stay on top of every opportunity.</span>
                        </div>
                    </div>

                    <nav className="tracker-sidebar__section" aria-label="Overview">
                        <p className="tracker-sidebar__section-label">Overview</p>
                        <button
                            type="button"
                            className={`tracker-sidebar__item${selectedStage === null ? " tracker-sidebar__item--active" : ""}`}
                            onClick={() => setSelectedStage(null)}
                        >
                            <LayoutDashboard aria-hidden />
                            <span>Board</span>
                        </button>
                        <button type="button" className="tracker-sidebar__item tracker-sidebar__item--muted" disabled>
                            <Calendar aria-hidden />
                            <span>Calendar (coming soon)</span>
                        </button>
                        <button type="button" className="tracker-sidebar__item tracker-sidebar__item--muted" disabled>
                            <Bell aria-hidden />
                            <span>Reminders (coming soon)</span>
                        </button>
                        <button type="button" className="tracker-sidebar__item tracker-sidebar__item--muted" disabled>
                            <Settings aria-hidden />
                            <span>Settings</span>
                        </button>
                    </nav>

                    <div className="tracker-sidebar__footer">
                        <button type="button" className="tracker-sidebar__cta" onClick={handleAddJob}>
                            Add new opportunity
                        </button>
                        <p className="tracker-sidebar__summary">
                            Tracking <strong>{jobs.length}</strong> roles across your pipeline.
                        </p>
                    </div>
                </aside>

                {isSidebarOpen ? (
                    <div className="tracker-sidebar__overlay" aria-hidden onClick={() => setIsSidebarOpen(false)} />
                ) : null}
                <div className="tracker-content">
                    <header className="tracker-header">
                        <button
                            type="button"
                            className="tracker-sidebar-toggle"
                            onClick={() => setIsSidebarOpen((prev) => !prev)}
                            aria-label={isSidebarOpen ? "Collapse navigation" : "Expand navigation"}
                            aria-expanded={isSidebarOpen}
                            aria-controls="tracker-navigation"
                        >
                            <Menu aria-hidden />
                        </button>
                        <nav className="tracker-breadcrumbs" aria-label="Breadcrumb">
                            <ol>
                                <li>
                                    <span>Home</span>
                                </li>
                                <li>
                                    <span>Products</span>
                                </li>
                                <li aria-current="page">
                                    <span>Job Tracker</span>
                                </li>
                            </ol>
                        </nav>

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
                        <div className="tracker-filter-select">
                            <label htmlFor="tracker-stage-filter">Stage</label>
                            <select
                                id="tracker-stage-filter"
                                value={selectedStage ?? ""}
                                onChange={(event) =>
                                    setSelectedStage(event.target.value ? (event.target.value as JobStage) : null)
                                }
                            >
                                <option value="">All ({jobs.length})</option>
                                {STAGES.map((stage) => (
                                    <option key={stage.key} value={stage.key}>
                                        {stage.label} ({stageCounts[stage.key]})
                                    </option>
                                ))}
                            </select>
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
                </div>
            </main>
        </div>
    );
};

export default TrackerPage;
