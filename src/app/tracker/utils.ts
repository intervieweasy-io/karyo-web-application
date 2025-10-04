import type { JobItem, JobStage } from "./data";

export const filterJobs = (jobs: JobItem[], query: string, stage: JobStage | null) => {
    const normalisedQuery = query.trim().toLowerCase();
    return jobs.filter((job) => {
        const matchesQuery =
            !normalisedQuery ||
            job.role.toLowerCase().includes(normalisedQuery) ||
            job.company.toLowerCase().includes(normalisedQuery) ||
            job.location.toLowerCase().includes(normalisedQuery);
        const matchesStage = !stage || job.stage === stage;
        return matchesQuery && matchesStage;
    });
};

export const groupJobsByStage = (jobs: JobItem[]) => {
    return jobs.reduce<Record<JobStage, JobItem[]>>(
        (acc, job) => {
            acc[job.stage].push(job);
            return acc;
        },
        {
            WISHLIST: [],
            APPLIED: [],
            INTERVIEW: [],
            OFFER: [],
            ARCHIVED: [],
        }
    );
};

export const formatDisplayDate = (date: string) => {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "Unknown";
    return parsed.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });
};

export const daysSince = (date: string) => {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "-";
    const diff = Date.now() - parsed.getTime();
    const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
    return `${days}d`;
};

export const findJobByText = (jobs: JobItem[], phrase: string) => {
    const lower = phrase.toLowerCase();
    return (
        jobs.find((job) => lower.includes(job.role.toLowerCase())) ||
        jobs.find((job) => lower.includes(job.company.toLowerCase()))
    );
};
