import type { DragEvent } from "react";
import type { JobItem, JobStage, StageDefinition } from "../data";
import JobCard from "./JobCard";

interface StageColumnProps {
    stage: StageDefinition;
    jobs: JobItem[];
    activeId: string | null;
    onDrop: (stage: JobStage, event: React.DragEvent<HTMLElement>) => void;
    onDragStart: (id: string, event: DragEvent<HTMLDivElement>) => void;
    onDragEnd: () => void;
    onAdd?: () => void;
}

const StageColumn = ({ stage, jobs, activeId, onDrop, onDragStart, onDragEnd, onAdd }: StageColumnProps) => {
    return (
        <section
            className="stage-column"
            data-stage={stage.key}
            style={{
                borderColor: stage.accent,
                backgroundColor: stage.background,
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
                event.preventDefault();
                onDrop(stage.key, event);
            }}
        >
            <header className="stage-column__header">
                <div>
                    <p className="stage-column__label" style={{ color: stage.accent }}>
                        {stage.label}
                    </p>
                    <p className="stage-column__description">{stage.description}</p>
                </div>
                <div className="stage-column__count" style={{ color: stage.accent }}>
                    {jobs.length}
                </div>
                {stage.key === "WISHLIST" && onAdd && (
                    <button type="button" className="stage-column__add" onClick={onAdd} aria-label="Add job to wishlist">
                        +
                    </button>
                )}
            </header>

            <div className="stage-column__content">
                {jobs.map((job) => (
                    <JobCard
                        key={job.id}
                        job={job}
                        isDragging={activeId === job.id}
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                    />
                ))}
                {jobs.length === 0 && (
                    <div className="stage-column__empty">
                        <p>Drop a card here</p>
                        <span>or say “Move [job] to {stage.label}”</span>
                    </div>
                )}
            </div>
        </section>
    );
};

export default StageColumn;
