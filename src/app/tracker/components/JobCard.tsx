import { Calendar, Clock, GripVertical, MapPin, MessageSquare, Star } from "lucide-react";
import type { DragEvent } from "react";
import type { JobItem } from "../data";
import { daysSince, formatDisplayDate } from "../utils";

interface JobCardProps {
    job: JobItem;
    isDragging: boolean;
    onDragStart: (id: string, event: DragEvent<HTMLDivElement>) => void;
    onDragEnd: () => void;
}

const JobCard = ({ job, isDragging, onDragStart, onDragEnd }: JobCardProps) => {
    return (
        <div
            className={`job-card${isDragging ? " job-card--dragging" : ""}`}
            draggable
            onDragStart={(event) => onDragStart(job.id, event)}
            onDragEnd={onDragEnd}
        >
            <header className="job-card__header">
                <div className="job-card__title">
                    <GripVertical className="job-card__drag-handle" aria-hidden />
                    <div>
                        <h3 className="job-card__role">{job.role}</h3>
                        <p className="job-card__company">{job.company}</p>
                    </div>
                </div>
                {job.isSaved && <Star className="job-card__saved" aria-hidden />}
            </header>

            <div className="job-card__meta">
                <span className="job-card__meta-item">
                    <MapPin aria-hidden />
                    {job.location}
                </span>
                <span className="job-card__meta-item">
                    <Clock aria-hidden />
                    {daysSince(job.appliedDate)}
                </span>
            </div>

            <footer className="job-card__footer">
                <span className="job-card__date">
                    <Calendar aria-hidden />
                    {formatDisplayDate(job.appliedDate)}
                </span>
                {job.notes > 0 && (
                    <span className="job-card__notes">
                        <MessageSquare aria-hidden />
                        {job.notes}
                    </span>
                )}
            </footer>
        </div>
    );
};

export default JobCard;
