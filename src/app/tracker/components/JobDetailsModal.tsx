"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
    addJobComment,
    getJob,
    listJobAuditTrail,
    listJobComments,
    type ApiJob,
    type ApiJobAuditEvent,
    type ApiJobComment,
} from "@/services/tracker.service";
import { JobItem } from "../data";
import { Download, History, Loader2, MessageSquarePlus, RefreshCcw, Send } from "lucide-react";
import "./job-details-modal.css";

type TabKey = "overview" | "comments" | "history";

type JobDetailsModalProps = {
    jobId: string | null;
    jobSummary: JobItem | null;
    isOpen: boolean;
    tab: TabKey;
    onClose: () => void;
    onTabChange: (tab: TabKey) => void;
    onCommentAdded?: (jobId: string) => void;
    onJobLoaded?: (job: ApiJob) => void;
};

const formatDateTime = (v?: string | null) => {
    if (!v) return "—";
    const d = new Date(v);
    return Number.isNaN(d.getTime())
        ? v
        : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};

const formatDate = (v?: string | null) => {
    if (!v) return "—";
    const d = new Date(v);
    return Number.isNaN(d.getTime())
        ? v
        : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const escapeCsv = (s: string) => (s.includes(",") || s.includes("\"") || s.includes("\n")) ? `"${s.replace(/"/g, '""')}"` : s;

const download = (name: string, mime: string, content: string) => {
    const blob = new Blob([content], { type: `${mime};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
};

type PageResult<T> = { items: T[]; nextCursor: string | null };

type PaginatedState<T> = {
    items: T[];
    cursor: string | null;
    loading: boolean;
    error: string | null;
};

const usePaginated = <T,>(loader: (cursor?: string) => Promise<PageResult<T>>) => {
    const [state, setState] = useState<PaginatedState<T>>({ items: [], cursor: null, loading: false, error: null });

    const refresh = useCallback(async () => {
        setState((s) => ({ ...s, loading: true, error: null }));
        try {
            const { items, nextCursor } = await loader(undefined);
            setState({ items, cursor: nextCursor, loading: false, error: null });
        } catch {
            setState((s) => ({ ...s, loading: false, error: "Something went wrong." }));
        }
    }, [loader]);

    const loadMore = useCallback(async () => {
        setState((s) => ({ ...s, loading: true, error: null }));
        try {
            const { items, nextCursor } = await loader(state.cursor ?? undefined);
            setState((s) => ({ items: [...s.items, ...items], cursor: nextCursor, loading: false, error: null }));
        } catch {
            setState((s) => ({ ...s, loading: false, error: "Something went wrong." }));
        }
    }, [loader, state.cursor]);

    const pushFront = useCallback((item: T) => {
        setState((s) => ({ ...s, items: [item, ...s.items] }));
    }, []);

    const reset = useCallback(() => setState({ items: [], cursor: null, loading: false, error: null }), []);

    return { ...state, refresh, loadMore, pushFront, reset };
};

const JobDetailsModal = ({ jobId, jobSummary, isOpen, tab, onClose, onTabChange, onCommentAdded, onJobLoaded }: JobDetailsModalProps) => {
    const [job, setJob] = useState<ApiJob | null>(null);
    const [jobLoading, setJobLoading] = useState(false);
    const [jobError, setJobError] = useState<string | null>(null);


    const commentLoader = useCallback(async (cursor?: string): Promise<PageResult<ApiJobComment>> => {
        if (!jobId) return { items: [], nextCursor: null };
        const { raw, nextCursor } = await listJobComments(jobId, { limit: 20, cursor });
        return { items: raw.items, nextCursor };
    }, [jobId]);

    const auditLoader = useCallback(async (cursor?: string): Promise<PageResult<ApiJobAuditEvent>> => {
        if (!jobId) return { items: [], nextCursor: null };
        const { raw, nextCursor } = await listJobAuditTrail(jobId, { limit: 20, cursor });
        return { items: raw.items, nextCursor };
    }, [jobId]);

    const comments = usePaginated<ApiJobComment>(commentLoader);
    const audits = usePaginated<ApiJobAuditEvent>(auditLoader);

    const mountedRef = useRef(false);

    useEffect(() => {
        if (!isOpen || !jobId) {
            setJob(null);
            setJobError(null);
            setJobLoading(false);
            comments.reset();
            audits.reset();
            return;
        }

        const run = async () => {
            setJobLoading(true);
            setJobError(null);
            try {
                const data = await getJob(jobId);
                if (!data) setJobError("This job could not be found.");
                else {
                    setJob(data);
                    onJobLoaded?.(data);
                }
            } catch {
                setJobError("We ran into an issue fetching the job details.");
            } finally {
                setJobLoading(false);
            }

            await comments.refresh();
        };

        run();
        mountedRef.current = true;
    }, [isOpen, jobId]);

    useEffect(() => {
        if (!isOpen || tab !== "history" || !jobId || audits.items.length > 0 || audits.loading) return;
        audits.refresh();
    }, [isOpen, tab, jobId, audits.items.length, audits.loading]);

    const sortedComments = useMemo(() => {
        return [...comments.items].sort((a, b) => new Date(b.createdAt ?? "").getTime() - new Date(a.createdAt ?? "").getTime());
    }, [comments.items]);

    const handleOpenChange = (open: boolean) => {
        if (!open) onClose();
    };

    const handleAddComment = async () => {
        if (!jobId) return;
        const text = commentText.trim();
        if (!text || addingComment) return;
        setAddingComment(true);
        comments.reset();
        try {
            const created = await addJobComment(jobId, { text });
            if (created) comments.pushFront(created);
            else await comments.refresh();
            setCommentText("");
            onCommentAdded?.(jobId);
        } catch {
            comments.reset();
        } finally {
            setAddingComment(false);
        }
    };

    const [commentText, setCommentText] = useState("");
    const [addingComment, setAddingComment] = useState(false);

    const handleCommentSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        void handleAddComment();
    };

    const handleExport = (fmt: "json" | "csv") => {
        if (!jobId || audits.items.length === 0) return;
        const date = new Date().toISOString().split("T")[0];
        if (fmt === "json") {
            download(`${jobId}-audit-${date}.json`, "application/json", JSON.stringify(audits.items, null, 2));
            return;
        }
        const header = ["id", "type", "actor", "createdAt", "payload"];
        const rows = audits.items.map((e) => [
            escapeCsv(e.id ?? ""),
            escapeCsv(e.type ?? ""),
            escapeCsv(String(e.action ?? "")),
            escapeCsv(String(e.message ?? "")),
            escapeCsv(e.createdAt ?? ""),
            escapeCsv(e.payload ? JSON.stringify(e.payload) : ""),
        ].join(","));
        const csv = [header.join(","), ...rows].join("\n");
        download(`${jobId}-audit-${date}.csv`, "text/csv", csv);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="job-details__content">
                <DialogHeader className="job-details__header">
                    <div className="job-details__title">
                        <DialogTitle>Opportunity details</DialogTitle>
                        {job ? (
                            <p className="job-details__subtitle">{job?.title} · {job?.company}</p>
                        ) : (
                            <p className="job-details__subtitle">Select a role to view its timeline.</p>
                        )}
                    </div>
                    <div className="job-details__header-actions">
                        <Button type="button" variant="ghost" size="icon" onClick={() => onTabChange("history")} title="Open audit history" aria-label="Open audit history">
                            <History className="job-details__icon" />
                        </Button>
                    </div>
                </DialogHeader>

                {jobLoading && (
                    <div className="job-details__status" role="status" aria-live="polite">
                        <Loader2 className="job-details__spinner" /> Loading job details…
                    </div>
                )}

                {jobError && <p className="job-details__error">{jobError}</p>}

                <Tabs defaultValue="overview" value={tab} onValueChange={(v) => onTabChange(v as TabKey)} className="job-details__tabs">
                    <TabsList className="job-details__tabs-list">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="comments">Comments</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="job-details__tab-panel">
                        <ScrollArea className="job-details__scroll-area">
                            {job ? (
                                <div className="job-details__overview">
                                    <div className="job-details__overview-header">
                                        <Badge className="job-details__stage">{job.stage}</Badge>
                                        {job?.priority && (
                                            <Badge variant="secondary" className="job-details__badge">{String(job.priority).toLocaleUpperCase()}</Badge>
                                        )}
                                    </div>
                                    <dl className="job-details__properties">
                                        <div>
                                            <dt>Role</dt>
                                            <dd>{job?.title}</dd>
                                        </div>
                                        <div>
                                            <dt>Company</dt>
                                            <dd>{job.company}</dd>
                                        </div>
                                        <div>
                                            <dt>Location</dt>
                                            <dd>{job?.location ?? "—"}</dd>
                                        </div>
                                        <div>
                                            <dt>Applied on</dt>
                                            <dd>{formatDate(job?.createdAt)}</dd>
                                        </div>
                                        <div>
                                            <dt>Created</dt>
                                            <dd>{formatDateTime(job?.createdAt)}</dd>
                                        </div>
                                        <div>
                                            <dt>Updated</dt>
                                            <dd>{formatDateTime(job?.updatedAt)}</dd>
                                        </div>
                                    </dl>
                                </div>
                            ) : (
                                <div className="job-details__empty">Select a job card to see more details.</div>
                            )}
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="comments" className="job-details__tab-panel">
                        <div className="job-details__comments">
                            <form className="job-details__comment-form" onSubmit={handleCommentSubmit}>
                                <Textarea
                                    placeholder="Share an update or leave a note…"
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    disabled={!jobId || addingComment}
                                    aria-label="Add a comment"
                                    onKeyDown={(e) => {
                                        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                                            e.preventDefault();
                                            void handleAddComment();
                                        }
                                    }}
                                />
                                <Button type="submit" disabled={!jobId || !commentText.trim() || addingComment} className="job-details__comment-submit">
                                    {addingComment ? (
                                        <>
                                            <Loader2 className="job-details__spinner" /> Saving…
                                        </>
                                    ) : (
                                        <>
                                            <Send className="job-details__icon" /> Add comment
                                        </>
                                    )}
                                </Button>
                            </form>
                            {comments.error && <p className="job-details__error">{comments.error}</p>}
                            <ScrollArea className="job-details__comments-list" aria-busy={comments.loading}>
                                {sortedComments.length === 0 && !comments.loading ? (
                                    <div className="job-details__empty">No comments yet. Start the conversation above.</div>
                                ) : (
                                    <ul>
                                        {sortedComments.map((c) => (
                                            <li key={c.id} className="job-details__comment-item">
                                                <div className="job-details__comment-meta">
                                                    <span className="job-details__comment-author">{c.userName ?? "Unknown"}</span>
                                                    <time dateTime={c.createdAt}>{formatDateTime(c.createdAt)}</time>
                                                </div>
                                                <p>{c.text}</p>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </ScrollArea>
                            <div className="job-details__list-footer">
                                {comments.loading && (
                                    <span className="job-details__status" role="status">
                                        <Loader2 className="job-details__spinner" /> Loading comments…
                                    </span>
                                )}
                                {comments.cursor && (
                                    <Button type="button" variant="outline" onClick={() => void comments.loadMore()} disabled={comments.loading}>
                                        <MessageSquarePlus className="job-details__icon" /> Load more
                                    </Button>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="history" className="job-details__tab-panel">
                        <div className="job-details__history">
                            <div className="job-details__history-actions">
                                <Button type="button" variant="outline" onClick={() => void audits.refresh()} disabled={audits.loading}>
                                    <RefreshCcw className="job-details__icon" /> Refresh
                                </Button>
                                <div className="job-details__export-group">
                                    <Button type="button" variant="outline" onClick={() => handleExport("csv")} disabled={audits.items.length === 0}>
                                        <Download className="job-details__icon" /> CSV
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => handleExport("json")} disabled={audits.items.length === 0}>
                                        <Download className="job-details__icon" /> JSON
                                    </Button>
                                </div>
                            </div>
                            {audits.error && <p className="job-details__error">{audits.error}</p>}
                            <ScrollArea className="job-details__history-list" aria-busy={audits.loading}>
                                {audits.items.length === 0 && !audits.loading ? (
                                    <div className="job-details__empty">Audit history will appear here once available.</div>
                                ) : (
                                    <ul>
                                        {audits.items.map((e) => (
                                            <li key={e.id} className="job-details__history-item">
                                                <div className="job-details__history-header">
                                                    <span className="job-details__history-type">{e.type}</span>
                                                    <time dateTime={e.createdAt}>{formatDateTime(e.createdAt)}</time>
                                                </div>
                                                <div className="job-details__history-meta">
                                                    <span>{e.action} : {e.message ?? "Unknown"}</span>
                                                    {e.payload && <pre>{JSON.stringify(e.payload, null, 2)}</pre>}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </ScrollArea>
                            <div className="job-details__list-footer">
                                {audits.loading && (
                                    <span className="job-details__status" role="status">
                                        <Loader2 className="job-details__spinner" /> Loading audit log…
                                    </span>
                                )}
                                {audits.cursor && (
                                    <Button type="button" variant="outline" onClick={() => void audits.loadMore()} disabled={audits.loading}>
                                        <History className="job-details__icon" /> Load more
                                    </Button>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

export default JobDetailsModal;
