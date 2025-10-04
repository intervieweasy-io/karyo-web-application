export type JobStage = "WISHLIST" | "APPLIED" | "INTERVIEW" | "OFFER" | "ARCHIVED";

export interface StageDefinition {
    key: JobStage;
    label: string;
    accent: string;
    background: string;
    description: string;
}

export interface JobItem {
    id: string;
    role: string;
    company: string;
    location: string;
    stage: JobStage;
    appliedDate: string;
    notes: number;
    isSaved: boolean;
    logoUrl?: string;
}

export const STAGES: StageDefinition[] = [
    {
        key: "WISHLIST",
        label: "Wishlist",
        accent: "#c4b5fd",
        background: "rgba(129, 140, 248, 0.12)",
        description: "Roles that have caught your eye",
    },
    {
        key: "APPLIED",
        label: "Applied",
        accent: "#60a5fa",
        background: "rgba(96, 165, 250, 0.12)",
        description: "Applications submitted and awaiting response",
    },
    {
        key: "INTERVIEW",
        label: "Interview",
        accent: "#fbbf24",
        background: "rgba(251, 191, 36, 0.12)",
        description: "In conversation with the team",
    },
    {
        key: "OFFER",
        label: "Offer",
        accent: "#34d399",
        background: "rgba(52, 211, 153, 0.14)",
        description: "Offers on the table to review",
    },
    {
        key: "ARCHIVED",
        label: "Archived",
        accent: "#f87171",
        background: "rgba(248, 113, 113, 0.1)",
        description: "Roles that didn\'t work out",
    },
];

export const INITIAL_JOBS: JobItem[] = [
    {
        id: "1",
        role: "Senior Product Manager",
        company: "Linear",
        location: "San Francisco, CA",
        stage: "INTERVIEW",
        appliedDate: "2024-01-15",
        notes: 2,
        isSaved: true,
    },
    {
        id: "2",
        role: "Frontend Engineer",
        company: "Vercel",
        location: "Remote",
        stage: "APPLIED",
        appliedDate: "2024-01-14",
        notes: 1,
        isSaved: false,
    },
    {
        id: "3",
        role: "Design System Lead",
        company: "Figma",
        location: "New York, NY",
        stage: "WISHLIST",
        appliedDate: "2024-01-13",
        notes: 0,
        isSaved: true,
    },
    {
        id: "4",
        role: "Full Stack Developer",
        company: "Supabase",
        location: "Remote",
        stage: "OFFER",
        appliedDate: "2024-01-10",
        notes: 5,
        isSaved: false,
    },
];
