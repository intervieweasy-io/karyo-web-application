"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
    Download,
    History,
    Loader2,
    MessageSquarePlus,
    RefreshCcw,
    Send,
} from "lucide-react";
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

const formatDateTime = (value?: string | null) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }
    return date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    });
};

const formatDate = (value?: string | null) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }
    return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

const escapeCsv = (value: string) => {
    if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
};

const JobDetailsModal = ({
    jobId,
    jobSummary,
    isOpen,
    tab,
    onClose,
    onTabChange,
    onCommentAdded,
    onJobLoaded,
}: JobDetailsModalProps) => {
    const [jobDetails, setJobDetails] = useState<ApiJob | null>(null);
    const [jobLoading, setJobLoading] = useState(false);
    const [jobError, setJobError] = useState<string | null>(null);

    const [comments, setComments] = useState<ApiJobComment[]>([]);
    const [commentsCursor, setCommentsCursor] = useState<string | null>(null);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [commentsError, setCommentsError] = useState<string | null>(null);
    const [isAddingComment, setIsAddingComment] = useState(false);
    const [commentText, setCommentText] = useState("");

    const [auditEvents, setAuditEvents] = useState<ApiJobAuditEvent[]>([]);
    const [auditCursor, setAuditCursor] = useState<string | null>(null);
    const [auditLoading, setAuditLoading] = useState(false);
    const [auditError, setAuditError] = useState<string | null>(null);

    const jobForDisplay = jobDetails ?? jobSummary;

    const resetState = useCallback(() => {
        setJobDetails(null);
        setJobLoading(false);
        setJobError(null);
        setComments([]);
        setCommentsCursor(null);
        setCommentsLoading(false);
        setCommentsError(null);
        setCommentText("");
        setAuditEvents([]);
        setAuditCursor(null);
        setAuditLoading(false);
        setAuditError(null);
    }, []);

    const fetchJobDetails = useCallback(async () => {
        if (!jobId) return;
        setJobLoading(true);
        setJobError(null);
        try {
            const data = await getJob(jobId);
            if (data) {
                setJobDetails(data);
                onJobLoaded?.(data);
            } else {
                setJobError("This job could not be found.");
            }
        } catch (error) {
            console.error("Failed to load job", error);
            setJobError("We ran into an issue fetching the job details.");
        } finally {
            setJobLoading(false);
        }
    }, [jobId, onJobLoaded]);

    const fetchComments = useCallback(
        async (options?: { append?: boolean }) => {
            if (!jobId) return;
            const append = options?.append ?? false;
            setCommentsLoading(true);
            setCommentsError(null);
            try {
                const { comments: fetched, nextCursor } = await listJobComments(jobId, {
                    limit: 20,
                    cursor: append ? commentsCursor ?? undefined : undefined,
                });
                setComments((prev) => (append ? [...prev, ...fetched] : fetched));
                setCommentsCursor(nextCursor);
            } catch (error) {
                console.error("Failed to load comments", error);
                setCommentsError("Unable to load comments right now.");
            } finally {
                setCommentsLoading(false);
            }
        },
        [commentsCursor, jobId]
    );

    const fetchAuditEvents = useCallback(
        async (options?: { append?: boolean }) => {
            if (!jobId) return;
            const append = options?.append ?? false;
            setAuditLoading(true);
            setAuditError(null);
            try {
                const { events, nextCursor } = await listJobAuditTrail(jobId, {
                    limit: 20,
                    cursor: append ? auditCursor ?? undefined : undefined,
                });
                setAuditEvents((prev) => (append ? [...prev, ...events] : events));
                setAuditCursor(nextCursor);
            } catch (error) {
                console.error("Failed to load audit events", error);
                setAuditError("Unable to load audit history.");
            } finally {
                setAuditLoading(false);
            }
        },
        [auditCursor, jobId]
    );

    useEffect(() => {
        if (!isOpen || !jobId) {
            resetState();
            return;
        }

        resetState();
        void fetchJobDetails();
        void fetchComments();
    }, [fetchComments, fetchJobDetails, isOpen, jobId, resetState]);

    useEffect(() => {
        if (!isOpen || !jobId || tab !== "history" || auditEvents.length > 0 || auditLoading) {
            return;
        }
        void fetchAuditEvents();
    }, [auditEvents.length, auditLoading, fetchAuditEvents, isOpen, jobId, tab]);

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            onClose();
        }
    };

    const handleAddComment = async () => {
        if (!jobId) return;
        const text = commentText.trim();
        if (!text) return;
        setIsAddingComment(true);
        setCommentsError(null);
        try {
            const comment = await addJobComment(jobId, { text });
            if (comment) {
                setComments((prev) => [comment, ...prev]);
            } else {
                await fetchComments();
            }
            setCommentText("");
            onCommentAdded?.(jobId);
        } catch (error) {
            console.error("Failed to add comment", error);
            setCommentsError("We couldn’t save your comment. Please try again.");
        } finally {
            setIsAddingComment(false);
        }
    };

    const handleCommentSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        void handleAddComment();
    };

    const handleExport = (format: "json" | "csv") => {
        if (!jobId || auditEvents.length === 0) return;
        const timestamp = new Date().toISOString().split("T")[0];
        let content = "";
        let mime = "application/json";
        let extension = "json";

        if (format === "json") {
            content = JSON.stringify(auditEvents, null, 2);
            mime = "application/json";
            extension = "json";
        } else {
            const header = ["id", "type", "actor", "createdAt", "payload"];
            const rows = auditEvents.map((event) => {
                const payload = event.payload ? JSON.stringify(event.payload) : "";
                return [
                    escapeCsv(event.id ?? ""),
                    escapeCsv(event.type ?? ""),
                    escapeCsv((event.actor ?? "") as string),
                    escapeCsv(event.createdAt ?? ""),
                    escapeCsv(payload),
                ].join(",");
            });
            content = [header.join(","), ...rows].join("\n");
            mime = "text/csv";
            extension = "csv";
        }

        const blob = new Blob([content], { type: `${mime};charset=utf-8;` });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${jobId}-audit-${timestamp}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const commentList = useMemo(() => {
        return comments.slice().sort((a, b) => {
            const first = new Date(a.createdAt ?? "").getTime();
            const second = new Date(b.createdAt ?? "").getTime();
            return second - first;
        });
    }, [comments]);

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="job-details__content">
                <DialogHeader className="job-details__header">
                    <div className="job-details__title">
                        <DialogTitle>Opportunity details</DialogTitle>
                        {jobForDisplay ? (
                            <p className="job-details__subtitle">
                                {jobForDisplay.role} · {jobForDisplay.company}
                            </p>
                        ) : (
                            <p className="job-details__subtitle">Select a role to view its timeline.</p>
                        )}
                    </div>
                    <div className="job-details__header-actions">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => onTabChange("history")}
                            title="Open audit history"
                            aria-label="Open audit history"
                        >
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

                <Tabs value={tab} onValueChange={(value) => onTabChange(value as TabKey)} className="job-details__tabs">
                    <TabsList className="job-details__tabs-list">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="comments">Comments</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="job-details__tab-panel">
                        <ScrollArea className="job-details__scroll-area">
                            {jobForDisplay ? (
                                <div className="job-details__overview">
                                    <div className="job-details__overview-header">
                                        <Badge className="job-details__stage">{jobForDisplay.stage}</Badge>
                                        {jobDetails?.priority && (
                                            <Badge variant="secondary" className="job-details__badge">
                                                Priority: {String(jobDetails.priority)}
                                            </Badge>
                                        )}
                                    </div>
                                    <dl className="job-details__properties">
                                        <div>
                                            <dt>Role</dt>
                                            <dd>{jobForDisplay.role}</dd>
                                        </div>
                                        <div>
                                            <dt>Company</dt>
                                            <dd>{jobForDisplay.company}</dd>
                                        </div>
                                        <div>
                                            <dt>Location</dt>
                                            <dd>{jobDetails?.location ?? jobForDisplay.location ?? "—"}</dd>
                                        </div>
                                        <div>
                                            <dt>Applied on</dt>
                                            <dd>{formatDate(jobDetails?.appliedOn ?? jobForDisplay.appliedDate)}</dd>
                                        </div>
                                        <div>
                                            <dt>Created</dt>
                                            <dd>{formatDateTime(jobDetails?.createdAt)}</dd>
                                        </div>
                                        <div>
                                            <dt>Updated</dt>
                                            <dd>{formatDateTime(jobDetails?.updatedAt)}</dd>
                                        </div>
                                        <div>
                                            <dt>Notes</dt>
                                            <dd>{jobDetails?.notesCount ?? jobForDisplay.notes ?? 0}</dd>
                                        </div>
                                    </dl>
                                    {jobDetails?.description && (
                                        <div className="job-details__description">
                                            <h3>Summary</h3>
                                            <p>{jobDetails.description as string}</p>
                                        </div>
                                    )}
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
                                    onChange={(event) => setCommentText(event.target.value)}
                                    disabled={!jobId || isAddingComment}
                                    aria-label="Add a comment"
                                />
                                <Button
                                    type="submit"
                                    disabled={!jobId || !commentText.trim() || isAddingComment}
                                    className="job-details__comment-submit"
                                >
                                    {isAddingComment ? (
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
                            {commentsError && <p className="job-details__error">{commentsError}</p>}
                            <ScrollArea className="job-details__comments-list">
                                {commentList.length === 0 && !commentsLoading ? (
                                    <div className="job-details__empty">No comments yet. Start the conversation above.</div>
                                ) : (
                                    <ul>
                                        {commentList.map((comment) => (
                                            <li key={comment.id} className="job-details__comment-item">
                                                <div className="job-details__comment-meta">
                                                    <span className="job-details__comment-author">
                                                        {comment.authorName ?? "Someone"}
                                                    </span>
                                                    <time dateTime={comment.createdAt}>
                                                        {formatDateTime(comment.createdAt)}
                                                    </time>
                                                </div>
                                                <p>{comment.text}</p>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </ScrollArea>
                            <div className="job-details__list-footer">
                                {commentsLoading && (
                                    <span className="job-details__status" role="status">
                                        <Loader2 className="job-details__spinner" /> Loading comments…
                                    </span>
                                )}
                                {commentsCursor && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => void fetchComments({ append: true })}
                                        disabled={commentsLoading}
                                    >
                                        <MessageSquarePlus className="job-details__icon" /> Load more
                                    </Button>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="history" className="job-details__tab-panel">
                        <div className="job-details__history">
                            <div className="job-details__history-actions">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => void fetchAuditEvents()}
                                    disabled={auditLoading}
                                >
                                    <RefreshCcw className="job-details__icon" /> Refresh
                                </Button>
                                <div className="job-details__export-group">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => handleExport("csv")}
                                        disabled={auditEvents.length === 0}
                                    >
                                        <Download className="job-details__icon" /> CSV
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => handleExport("json")}
                                        disabled={auditEvents.length === 0}
                                    >
                                        <Download className="job-details__icon" /> JSON
                                    </Button>
                                </div>
                            </div>
                            {auditError && <p className="job-details__error">{auditError}</p>}
                            <ScrollArea className="job-details__history-list">
                                {auditEvents.length === 0 && !auditLoading ? (
                                    <div className="job-details__empty">Audit history will appear here once available.</div>
                                ) : (
                                    <ul>
                                        {auditEvents.map((event) => (
                                            <li key={event.id} className="job-details__history-item">
                                                <div className="job-details__history-header">
                                                    <span className="job-details__history-type">{event.type}</span>
                                                    <time dateTime={event.createdAt}>
                                                        {formatDateTime(event.createdAt)}
                                                    </time>
                                                </div>
                                                <div className="job-details__history-meta">
                                                    <span>Actor: {event.actor ?? "System"}</span>
                                                    {event.payload && (
                                                        <pre>{JSON.stringify(event.payload, null, 2)}</pre>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </ScrollArea>
                            <div className="job-details__list-footer">
                                {auditLoading && (
                                    <span className="job-details__status" role="status">
                                        <Loader2 className="job-details__spinner" /> Loading audit log…
                                    </span>
                                )}
                                {auditCursor && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => void fetchAuditEvents({ append: true })}
                                        disabled={auditLoading}
                                    >
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
