"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
    ArrowUpRight,
    BarChart3,
    CheckCircle2,
    Clock3,
    Compass,
    FileText,
    ImageIcon,
    MessageSquare,
    Paperclip,
    Plus,
    Share2,
    Sparkles,
    Target,
    ThumbsUp,
} from "lucide-react";
import {
    createTextPost,
    getHomeFeed,
    likePost,
    unlikePost,
    type ApiFeedPost,
} from "@/services/feed.service";
import { getMyProfile, type ApiProfile } from "@/services/profile.service";

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;

const sanitizeString = (value: unknown): string | undefined => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
};

const sanitizeNumber = (value: unknown): number | undefined => {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === "string") {
        const parsed = Number.parseInt(value, 10);
        if (!Number.isNaN(parsed)) {
            return parsed;
        }
    }
    return undefined;
};

const extractTextLines = (value: unknown): string[] => {
    const text = sanitizeString(value);
    if (!text) return [];
    return text
        .split(/\r?\n+/)
        .map((line) => line.trim())
        .filter(Boolean);
};

const extractTags = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return value
            .map((item) => sanitizeString(item))
            .filter((item): item is string => Boolean(item))
            .map((item) => item.replace(/^#/, ""));
    }
    const text = sanitizeString(value);
    if (!text) return [];
    return text
        .split(/[\s,#]+/)
        .map((tag) => tag.trim().replace(/^#/, ""))
        .filter(Boolean);
};

const toCount = (value: unknown): number => {
    const numberValue = sanitizeNumber(value);
    if (typeof numberValue === "number") {
        return Math.max(0, Math.round(numberValue));
    }
    if (Array.isArray(value)) {
        return value.length;
    }
    return 0;
};

const formatTimeAgo = (value?: string): string | undefined => {
    if (!value) return undefined;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return undefined;
    const now = Date.now();
    const diffMs = now - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    if (diffSeconds < 60) return "Just now";
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 5) return `${diffWeeks}w ago`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths}mo ago`;
    const diffYears = Math.floor(diffDays / 365);
    return `${diffYears}y ago`;
};

const deriveTone = (label?: string): "info" | "success" | "warning" => {
    if (!label) return "info";
    const normalized = label.toLowerCase();
    if (
        normalized.includes("win") ||
        normalized.includes("shipped") ||
        normalized.includes("launch") ||
        normalized.includes("success")
    ) {
        return "success";
    }
    if (
        normalized.includes("help") ||
        normalized.includes("blocker") ||
        normalized.includes("ask") ||
        normalized.includes("feedback") ||
        normalized.includes("poll")
    ) {
        return "warning";
    }
    if (normalized.includes("learn") || normalized.includes("learning")) {
        return "info";
    }
    if (normalized.includes("media")) {
        return "success";
    }
    return "info";
};

const getInitials = (name: string): string => {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("")
        .padEnd(2, "");
};

type FeedMetrics = {
    cheers: number;
    comments: number;
    shares: number;
    viewerHasLiked: boolean;
};

type FeedPost = {
    id: string;
    authorName: string;
    authorHeadline?: string;
    authorHandle?: string;
    authorInitials: string;
    title?: string;
    summary?: string;
    highlights: string[];
    tags: string[];
    createdAt?: string;
    createdAtLabel?: string;
    topicLabel?: string;
    topicTone: "info" | "success" | "warning";
    metrics: FeedMetrics;
};

const mapApiPostToFeedPost = (post: ApiFeedPost): FeedPost => {
    const authorCandidates = [
        post.author,
        post.user,
        post.profile,
        post.owner,
        post.createdBy,
    ].find((candidate) => isRecord(candidate));

    const authorName =
        sanitizeString(authorCandidates?.name) ??
        sanitizeString(authorCandidates?.fullName) ??
        "Community member";

    const authorHeadline =
        sanitizeString(authorCandidates?.headline) ??
        sanitizeString(authorCandidates?.title) ??
        sanitizeString(authorCandidates?.role);

    const authorHandle =
        sanitizeString(authorCandidates?.handle) ??
        sanitizeString(authorCandidates?.username) ??
        sanitizeString(authorCandidates?.slug);

    const createdAt =
        sanitizeString(post.createdAt) ??
        sanitizeString(post.created_at) ??
        sanitizeString(post.publishedAt) ??
        sanitizeString(post.updatedAt) ??
        sanitizeString(post.createdOn);

    const lines = extractTextLines(post.text);
    const title = sanitizeString(post.title) ?? lines.shift();
    const summary = sanitizeString(post.summary) ?? lines.shift();

    const highlightCandidates = extractTextLines(post.summary);
    const highlights = (
        (Array.isArray(post.highlights) ? post.highlights : []) as unknown[]
    )
        .map((item) => sanitizeString(item))
        .filter((item): item is string => Boolean(item));

    const detailHighlights = (
        (Array.isArray(post.details) ? post.details : []) as unknown[]
    )
        .map((item) => sanitizeString(item))
        .filter((item): item is string => Boolean(item));

    const aggregatedHighlights =
        highlights.length > 0
            ? highlights
            : detailHighlights.length > 0
            ? detailHighlights
            : highlightCandidates.length > 0
            ? highlightCandidates
            : lines;

    const tags = [
        ...extractTags(post.tags),
        ...extractTags(post.topics),
        ...extractTags(post.labels),
    ];
    const uniqueTags = Array.from(
        new Set(tags.map((tag) => tag.toLowerCase()))
    ).map((tag) => tag);

    const metricsSource = [
        post.metrics,
        post.stats,
        post.engagement,
        post.counts,
        post.totals,
    ].find((candidate) => isRecord(candidate));

    const viewerHasLiked =
        post.viewerHasLiked === true ||
        (metricsSource &&
            (metricsSource.viewerHasLiked === true ||
                metricsSource.liked === true ||
                metricsSource.hasLiked === true));

    const cheers = metricsSource
        ? toCount(
              metricsSource.cheers ??
                  metricsSource.likes ??
                  metricsSource.claps ??
                  metricsSource.upvotes ??
                  metricsSource.applause
          )
        : 0;

    const comments = metricsSource
        ? toCount(metricsSource.comments ?? metricsSource.replies)
        : 0;

    const shares = metricsSource
        ? toCount(metricsSource.shares ?? metricsSource.reposts)
        : 0;

    const topicCandidates: Array<unknown> = [
        post.topic,
        post.category,
        post.type,
        post.channel,
    ];

    if (isRecord(post.status) && typeof post.status.label === "string") {
        topicCandidates.unshift(post.status.label);
    }

    if (isRecord(post.context) && typeof post.context.label === "string") {
        topicCandidates.unshift(post.context.label);
    }

    const topicLabel = topicCandidates
        .map((candidate) => sanitizeString(candidate))
        .find((value) => value && value.length);

    return {
        id: post.id,
        authorName,
        authorHeadline,
        authorHandle,
        authorInitials: getInitials(authorName),
        title,
        summary,
        highlights: aggregatedHighlights.slice(0, 6),
        tags: uniqueTags.slice(0, 6),
        createdAt,
        createdAtLabel: formatTimeAgo(createdAt),
        topicLabel: topicLabel ?? (uniqueTags[0] ? `#${uniqueTags[0]}` : undefined),
        topicTone: deriveTone(topicLabel ?? uniqueTags[0]),
        metrics: {
            cheers,
            comments,
            shares,
            viewerHasLiked,
        },
    };
};

type ProfileOverview = {
    name: string;
    headline?: string;
    location?: string;
    podsJoined: number;
    kudos: number;
    streak: number;
    points: number;
};

type FocusItem = {
    id: string;
    title: string;
    description: string;
    icon: ComponentType<{ className?: string }>;
};

type CommunityLeader = {
    id: string;
    title: string;
    cadence: string;
    facilitator?: string;
};

type TrendingTopic = {
    id: string;
    title: string;
    description: string;
    icon: ComponentType<{ className?: string }>;
};

const defaultProfileOverview: ProfileOverview = {
    name: "Your profile",
    headline: "Share what you’re working on",
    location: undefined,
    podsJoined: 0,
    kudos: 0,
    streak: 0,
    points: 0,
};

const mapProfileToOverview = (profile: ApiProfile | null): ProfileOverview => {
    if (!profile) {
        return defaultProfileOverview;
    }

    const statsSource = [
        profile.stats,
        profile.metrics,
        profile.totals,
        profile.counts,
    ].find((candidate) => isRecord(candidate));

    const podsCollection =
        (Array.isArray(profile.pods) && profile.pods) ||
        (Array.isArray(profile.memberships) && profile.memberships) ||
        (Array.isArray(profile.podMemberships) && profile.podMemberships) ||
        null;

    return {
        name: sanitizeString(profile.name) ?? defaultProfileOverview.name,
        headline:
            sanitizeString(profile.headline) ??
            sanitizeString(profile.title) ??
            defaultProfileOverview.headline,
        location:
            sanitizeString(profile.location) ??
            sanitizeString(profile.city) ??
            defaultProfileOverview.location,
        podsJoined: Math.max(
            0,
            toCount(
                (statsSource &&
                    (statsSource.podsJoined ??
                        statsSource.pods ??
                        statsSource.podCount)) ??
                    podsCollection ??
                    0
            )
        ),
        kudos: Math.max(
            0,
            toCount(
                statsSource &&
                    (statsSource.kudos ??
                        statsSource.cheers ??
                        statsSource.likes ??
                        statsSource.applause ??
                        0)
            )
        ),
        streak: Math.max(
            0,
            toCount(
                statsSource &&
                    (statsSource.streak ??
                        statsSource.activeStreak ??
                        statsSource.weeklyStreak ??
                        0)
            )
        ),
        points: Math.max(
            0,
            toCount(
                profile.points ??
                    (statsSource &&
                        (statsSource.points ?? statsSource.score ?? 0)) ??
                    0
            )
        ),
    };
};

const fallbackFocus: FocusItem[] = [
    {
        id: "share-update",
        title: "Share a quick update",
        description: "Let your pods know what you’re tackling today.",
        icon: Compass,
    },
    {
        id: "celebrate-win",
        title: "Celebrate a recent win",
        description: "Drop a note about something that went well this week.",
        icon: BarChart3,
    },
    {
        id: "ask-support",
        title: "Ask for support",
        description: "Need help or a referral? Invite the community to chime in.",
        icon: Target,
    },
];

const fallbackLeaders: CommunityLeader[] = [
    {
        id: "ritual-1",
        title: "Daily standup",
        cadence: "Share your morning focus",
        facilitator: "Join any pod to get reminders",
    },
    {
        id: "ritual-2",
        title: "Weekly retro",
        cadence: "Reflect on wins and blockers",
        facilitator: "Invite peers to collaborate",
    },
    {
        id: "ritual-3",
        title: "Learning circle",
        cadence: "Trade tips on interviews and prep",
        facilitator: "Spin up a pod for your track",
    },
];

const fallbackTrending: TrendingTopic[] = [
    {
        id: "storytelling",
        title: "#storytelling",
        description: "Resources to pitch your work with clarity.",
        icon: Sparkles,
    },
    {
        id: "productops",
        title: "#productops",
        description: "Frameworks to keep experiments organized.",
        icon: Target,
    },
    {
        id: "designsystems",
        title: "#designsystems",
        description: "Examples to level up component reuse.",
        icon: BarChart3,
    },
];

const FeedPostSkeleton = () => (
    <Card className="home-feed__card home-feed__card--post" aria-hidden>
        <div className="home-feed__post-header">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-8 w-16 rounded-full" />
        </div>
        <div className="home-feed__post-body space-y-3">
            <Skeleton className="h-5 w-3/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
        </div>
        <div className="home-feed__post-tags space-x-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
        </div>
        <footer className="home-feed__post-footer">
            <Skeleton className="h-9 w-24 rounded-full" />
            <Skeleton className="h-9 w-24 rounded-full" />
            <Skeleton className="h-9 w-24 rounded-full" />
        </footer>
    </Card>
);

const Home = () => {
    const [profile, setProfile] = useState<ProfileOverview>(defaultProfileOverview);
    const [isProfileLoading, setIsProfileLoading] = useState(true);
    const [posts, setPosts] = useState<FeedPost[]>([]);
    const [cursor, setCursor] = useState<string | null>(null);
    const [isLoadingFeed, setIsLoadingFeed] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [pendingCheers, setPendingCheers] = useState<Record<string, boolean>>({});
    const [composerText, setComposerText] = useState("");
    const [isPublishing, setIsPublishing] = useState(false);
    const [feedError, setFeedError] = useState<string | null>(null);

    const fetchProfile = useCallback(async () => {
        try {
            setIsProfileLoading(true);
            const response = await getMyProfile();
            setProfile(mapProfileToOverview(response));
        } catch (error) {
            console.error("Failed to load profile", error);
            setProfile(defaultProfileOverview);
        } finally {
            setIsProfileLoading(false);
        }
    }, []);

    const fetchFeed = useCallback(
        async (options?: { cursor?: string; append?: boolean }) => {
            const shouldAppend = options?.append ?? false;
            const nextCursor = options?.cursor;

            if (shouldAppend && !nextCursor) {
                return;
            }

            setFeedError(null);
            if (shouldAppend) {
                setIsLoadingMore(true);
            } else {
                setIsLoadingFeed(true);
            }

            try {
                const { posts: apiPosts, nextCursor: apiCursor } = await getHomeFeed({
                    size: 10,
                    cursor: nextCursor ?? undefined,
                });
                const mapped = apiPosts.map(mapApiPostToFeedPost);

                setPosts((previous) => {
                    if (shouldAppend) {
                        const existingIds = new Set(previous.map((post) => post.id));
                        const merged = [...previous];
                        for (const item of mapped) {
                            if (!existingIds.has(item.id)) {
                                merged.push(item);
                                existingIds.add(item.id);
                            }
                        }
                        return merged;
                    }
                    return mapped;
                });

                setCursor(apiCursor ?? null);
            } catch (error) {
                console.error("Failed to load feed", error);
                setFeedError("We couldn’t load the community feed. Try again in a moment.");
                if (!shouldAppend) {
                    setPosts([]);
                }
            } finally {
                if (shouldAppend) {
                    setIsLoadingMore(false);
                } else {
                    setIsLoadingFeed(false);
                }
            }
        },
        []
    );

    useEffect(() => {
        void fetchProfile();
        void fetchFeed();
    }, [fetchFeed, fetchProfile]);

    const handlePublish = useCallback(async () => {
        const trimmed = composerText.trim();
        if (!trimmed || isPublishing) return;

        setIsPublishing(true);
        setFeedError(null);

        try {
            const tagMatches = Array.from(
                new Set((trimmed.match(/#([\p{L}0-9_]+)/gu) ?? []).map((tag) => tag.replace(/^#/, "")))
            );
            const created = await createTextPost({ text: trimmed, tags: tagMatches });
            if (created) {
                const mapped = mapApiPostToFeedPost(created);
                setPosts((previous) => {
                    const filtered = previous.filter((post) => post.id !== mapped.id);
                    return [mapped, ...filtered];
                });
                setComposerText("");
            } else {
                await fetchFeed();
            }
        } catch (error) {
            console.error("Failed to publish post", error);
            setFeedError("We couldn’t publish your update. Please try again.");
        } finally {
            setIsPublishing(false);
        }
    }, [composerText, fetchFeed, isPublishing]);

    const handleCheer = useCallback(
        (postId: string, liked: boolean) => {
            setPendingCheers((previous) => ({ ...previous, [postId]: true }));
            setFeedError(null);

            let previousMetrics: FeedMetrics | null = null;
            setPosts((prev) =>
                prev.map((post) => {
                    if (post.id !== postId) return post;
                    previousMetrics = post.metrics;
                    const nextCheers = Math.max(0, post.metrics.cheers + (liked ? -1 : 1));
                    return {
                        ...post,
                        metrics: {
                            ...post.metrics,
                            cheers: nextCheers,
                            viewerHasLiked: !liked,
                        },
                    };
                })
            );

            void (async () => {
                try {
                    if (liked) {
                        await unlikePost(postId);
                    } else {
                        await likePost(postId);
                    }
                } catch (error) {
                    console.error("Failed to update cheer", error);
                    if (previousMetrics) {
                        setPosts((prev) =>
                            prev.map((post) =>
                                post.id === postId
                                    ? {
                                          ...post,
                                          metrics: previousMetrics as FeedMetrics,
                                      }
                                    : post
                            )
                        );
                    }
                    setFeedError("Couldn’t update your cheer. Please try again.");
                } finally {
                    setPendingCheers((prev) => {
                        const next = { ...prev };
                        delete next[postId];
                        return next;
                    });
                }
            })();
        },
        []
    );

    const focusItems = useMemo<FocusItem[]>(() => {
        if (!posts.length) {
            return fallbackFocus;
        }
        const icons = [Compass, BarChart3, Target];
        return posts.slice(0, 3).map((post, index) => ({
            id: post.id,
            title: post.title ?? post.summary ?? "Community update",
            description:
                post.summary ??
                post.highlights[0] ??
                (post.createdAtLabel ? `Shared ${post.createdAtLabel}` : "Latest activity"),
            icon: icons[index] ?? Compass,
        }));
    }, [posts]);

    const communityLeaders = useMemo<CommunityLeader[]>(() => {
        if (!posts.length) {
            return fallbackLeaders;
        }
        const leaderMap = new Map<string, { count: number; headline?: string }>();
        for (const post of posts) {
            const entry = leaderMap.get(post.authorName) ?? {
                count: 0,
                headline: post.authorHeadline,
            };
            entry.count += 1;
            if (!entry.headline && post.authorHeadline) {
                entry.headline = post.authorHeadline;
            }
            leaderMap.set(post.authorName, entry);
        }
        const sorted = Array.from(leaderMap.entries())
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 3);
        if (!sorted.length) {
            return fallbackLeaders;
        }
        return sorted.map(([name, info]) => ({
            id: name,
            title: name,
            cadence: `${info.count} ${info.count === 1 ? "update" : "updates"} this week`,
            facilitator: info.headline ?? "Community member",
        }));
    }, [posts]);

    const trendingTopics = useMemo<TrendingTopic[]>(() => {
        if (!posts.length) {
            return fallbackTrending;
        }
        const counts = new Map<string, number>();
        for (const post of posts) {
            for (const tag of post.tags) {
                counts.set(tag, (counts.get(tag) ?? 0) + 1);
            }
        }
        const sorted = Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);
        if (!sorted.length) {
            return fallbackTrending;
        }
        const icons = [Sparkles, Target, BarChart3];
        return sorted.map(([tag, count], index) => ({
            id: tag,
            title: `#${tag}`,
            description: `${count} ${count === 1 ? "update" : "updates"} mentioning this topic`,
            icon: icons[index] ?? Sparkles,
        }));
    }, [posts]);

    const canPublish = composerText.trim().length > 0 && !isPublishing;

    return (
        <section className="home-feed-page">
            <div className="home-feed-grid">
                <aside className="home-feed-column home-feed-column--left">
                    <Card className="home-feed__card home-feed__card--profile">
                        <div className="home-feed__profile">
                            <Avatar className="home-feed__avatar" aria-hidden>
                                <AvatarFallback>
                                    {getInitials(profile.name || "You")}
                                </AvatarFallback>
                            </Avatar>

                            <div className="home-feed__profile-meta">
                                <h2 className="home-feed__profile-name">
                                    {isProfileLoading ? (
                                        <Skeleton className="h-5 w-32" />
                                    ) : (
                                        profile.name
                                    )}
                                </h2>
                                <p className="home-feed__profile-role">
                                    {isProfileLoading ? (
                                        <Skeleton className="h-4 w-48" />
                                    ) : (
                                        profile.headline ?? "Add a headline so others know you"
                                    )}
                                </p>
                                {profile.location && !isProfileLoading ? (
                                    <p className="home-feed__profile-role home-feed__profile-role--sub">
                                        {profile.location}
                                    </p>
                                ) : null}
                            </div>
                        </div>

                        <div className="home-feed__profile-metrics" aria-live="polite">
                            <div>
                                {isProfileLoading ? (
                                    <Skeleton className="h-6 w-10" />
                                ) : (
                                    <span className="home-feed__metric-value">{profile.streak}</span>
                                )}
                                <span className="home-feed__metric-label">Ongoing streak</span>
                            </div>
                            <div>
                                {isProfileLoading ? (
                                    <Skeleton className="h-6 w-10" />
                                ) : (
                                    <span className="home-feed__metric-value">{profile.kudos}</span>
                                )}
                                <span className="home-feed__metric-label">Community kudos</span>
                            </div>
                            <div>
                                {isProfileLoading ? (
                                    <Skeleton className="h-6 w-10" />
                                ) : (
                                    <span className="home-feed__metric-value">{profile.podsJoined}</span>
                                )}
                                <span className="home-feed__metric-label">Pods joined</span>
                            </div>
                        </div>

                        <Button
                            className="home-feed__primary-action"
                            onClick={() => {
                                window.location.href = "/app/profile";
                            }}
                        >
                            Update profile
                        </Button>
                    </Card>

                    <Card className="home-feed__card">
                        <CardHeader>
                            <CardTitle className="home-feed__card-title">Focus for this week</CardTitle>
                            <CardDescription className="home-feed__card-description">
                                Highlights pulled from the latest community updates.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="home-feed__card-list">
                            {focusItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div key={item.id} className="home-feed__card-row">
                                        <div className="home-feed__card-icon-wrap">
                                            <Icon aria-hidden className="home-feed__card-icon" />
                                        </div>
                                        <div>
                                            <p className="home-feed__card-row-title">{item.title}</p>
                                            <p className="home-feed__card-row-description">{item.description}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                </aside>

                <div className="home-feed-column home-feed-column--main">
                    <Card className="home-feed__card home-feed__card--composer">
                        <div className="home-feed__composer-header">
                            <Avatar className="home-feed__avatar" aria-hidden>
                                <AvatarFallback>{getInitials(profile.name || "You")}</AvatarFallback>
                            </Avatar>

                            <div>
                                <p className="home-feed__composer-title">
                                    Share your progress, challenges, or what you’re learning…
                                </p>
                                <div className="home-feed__topic-chips">
                                    <span className="home-feed__topic-chip">Win of the week</span>
                                    <span className="home-feed__topic-chip">What I’m shipping</span>
                                    <span className="home-feed__topic-chip">Need a hand</span>
                                </div>
                            </div>
                        </div>

                        <Tabs defaultValue="text" className="home-feed__composer-tabs">
                            <TabsList className="home-feed__composer-tablist">
                                <TabsTrigger value="text">
                                    <FileText aria-hidden /> Text
                                </TabsTrigger>
                                <TabsTrigger value="media" disabled>
                                    <ImageIcon aria-hidden /> Media
                                </TabsTrigger>
                                <TabsTrigger value="poll" disabled>
                                    <BarChart3 aria-hidden /> Poll
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="text" className="home-feed__composer-panel">
                                <Textarea
                                    rows={4}
                                    placeholder="Start typing your update…"
                                    aria-label="Share an update"
                                    value={composerText}
                                    onChange={(event) => setComposerText(event.target.value)}
                                />

                                <div className="home-feed__composer-footer">
                                    <div className="home-feed__composer-actions">
                                        <Button variant="ghost" className="home-feed__icon-button" disabled>
                                            <Paperclip aria-hidden />
                                            Attach files
                                        </Button>
                                        <Button variant="ghost" className="home-feed__icon-button" disabled>
                                            <ImageIcon aria-hidden />
                                            Add media
                                        </Button>
                                    </div>

                                    <Button
                                        className="home-feed__primary-action"
                                        onClick={handlePublish}
                                        disabled={!canPublish}
                                    >
                                        {isPublishing ? "Sharing…" : "Share progress"}
                                    </Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="media" className="home-feed__composer-panel">
                                <div className="home-feed__dropzone" aria-hidden>
                                    <ImageIcon aria-hidden />
                                    <p className="home-feed__dropzone-title">Media uploads coming soon</p>
                                    <p className="home-feed__dropzone-description">
                                        We’re working on first-class support for video and image posts.
                                    </p>
                                    <Button variant="outline" disabled>
                                        Choose files
                                    </Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="poll" className="home-feed__composer-panel">
                                <div className="home-feed__poll" aria-hidden>
                                    <Input placeholder="Ask a question for the community…" disabled />
                                    <div className="home-feed__poll-options">
                                        <Input placeholder="Option A" disabled />
                                        <Input placeholder="Option B" disabled />
                                    </div>
                                    <div className="home-feed__poll-footer">
                                        <Button variant="ghost" className="home-feed__icon-button" disabled>
                                            <Plus aria-hidden />
                                            Add option
                                        </Button>
                                        <div className="home-feed__poll-meta">
                                            <Clock3 aria-hidden />
                                            Polls will arrive soon
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>

                        {feedError ? (
                            <div className="home-feed__error" role="alert">
                                {feedError}
                            </div>
                        ) : null}
                    </Card>

                    <div className="home-feed__posts" aria-live="polite">
                        {isLoadingFeed ? (
                            Array.from({ length: 3 }).map((_, index) => (
                                <FeedPostSkeleton key={`post-skeleton-${index}`} />
                            ))
                        ) : posts.length === 0 ? (
                            <div className="home-feed__empty">
                                <p>No updates yet. Be the first to share something!</p>
                                <Button
                                    className="home-feed__primary-action"
                                    onClick={() => {
                                        const composer = document.querySelector<HTMLTextAreaElement>(
                                            ".home-feed__card--composer textarea"
                                        );
                                        composer?.focus();
                                    }}
                                >
                                    Start a conversation
                                </Button>
                            </div>
                        ) : (
                            posts.map((post) => {
                                const isCheerPending = pendingCheers[post.id] === true;
                                return (
                                    <Card key={post.id} className="home-feed__card home-feed__card--post">
                                        <header className="home-feed__post-header">
                                            <Avatar className="home-feed__avatar" aria-hidden>
                                                <AvatarFallback>{getInitials(post.authorName)}</AvatarFallback>
                                            </Avatar>
                                            <div className="home-feed__post-meta">
                                                <div className="home-feed__post-heading">
                                                    <p className="home-feed__post-author">{post.authorName}</p>
                                                    {post.topicLabel ? (
                                                        <Badge className={`home-feed__status home-feed__status--${post.topicTone}`}>
                                                            {post.topicLabel}
                                                        </Badge>
                                                    ) : null}
                                                </div>
                                                <p className="home-feed__post-role">
                                                    {post.authorHeadline ?? "Community member"}
                                                    {post.authorHandle ? ` · @${post.authorHandle}` : ""}
                                                    {post.createdAtLabel ? ` · ${post.createdAtLabel}` : ""}
                                                </p>
                                            </div>
                                        </header>

                                        <div className="home-feed__post-body">
                                            {post.title ? (
                                                <h3 className="home-feed__post-title">{post.title}</h3>
                                            ) : null}
                                            {post.summary ? (
                                                <p className="home-feed__post-summary">{post.summary}</p>
                                            ) : null}

                                            {post.highlights.length ? (
                                                <ul className="home-feed__post-highlights">
                                                    {post.highlights.map((highlight, index) => (
                                                        <li key={`${post.id}-highlight-${index}`}>
                                                            <CheckCircle2 aria-hidden />
                                                            <span>{highlight}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : null}
                                        </div>

                                        {post.tags.length ? (
                                            <div className="home-feed__post-tags">
                                                {post.tags.map((tag) => (
                                                    <span key={`${post.id}-${tag}`} className="home-feed__tag">
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : null}

                                        <footer className="home-feed__post-footer">
                                            <button
                                                type="button"
                                                className={`home-feed__post-action${
                                                    post.metrics.viewerHasLiked ? " home-feed__post-action--active" : ""
                                                }`}
                                                onClick={() => handleCheer(post.id, post.metrics.viewerHasLiked)}
                                                disabled={isCheerPending}
                                                aria-pressed={post.metrics.viewerHasLiked}
                                            >
                                                <ThumbsUp aria-hidden />
                                                Cheer
                                                <span className="home-feed__post-count">{post.metrics.cheers}</span>
                                            </button>
                                            <button
                                                type="button"
                                                className="home-feed__post-action"
                                                disabled
                                                title="Commenting coming soon"
                                            >
                                                <MessageSquare aria-hidden />
                                                Comment
                                                <span className="home-feed__post-count">{post.metrics.comments}</span>
                                            </button>
                                            <button
                                                type="button"
                                                className="home-feed__post-action"
                                                disabled
                                                title="Sharing coming soon"
                                            >
                                                <Share2 aria-hidden />
                                                Share
                                                <span className="home-feed__post-count">{post.metrics.shares}</span>
                                            </button>
                                        </footer>
                                    </Card>
                                );
                            })
                        )}
                    </div>

                    {cursor ? (
                        <Button
                            variant="outline"
                            className="home-feed__load-more"
                            onClick={() => fetchFeed({ cursor, append: true })}
                            disabled={isLoadingMore}
                        >
                            {isLoadingMore ? "Loading…" : "Load more updates"}
                        </Button>
                    ) : null}
                </div>

                <aside className="home-feed-column home-feed-column--right">
                    <Card className="home-feed__card">
                        <CardHeader>
                            <CardTitle className="home-feed__card-title">Community leaders</CardTitle>
                            <CardDescription className="home-feed__card-description">
                                Members keeping the conversation active this week.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="home-feed__card-list">
                            {communityLeaders.map((leader) => (
                                <div key={leader.id} className="home-feed__card-row">
                                    <div className="home-feed__card-icon-wrap home-feed__card-icon-wrap--accent">
                                        <Sparkles aria-hidden className="home-feed__card-icon" />
                                    </div>
                                    <div>
                                        <p className="home-feed__card-row-title">{leader.title}</p>
                                        <p className="home-feed__card-row-description">{leader.cadence}</p>
                                        {leader.facilitator ? (
                                            <span className="home-feed__card-subtext">{leader.facilitator}</span>
                                        ) : null}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        className="home-feed__icon-button home-feed__icon-button--small"
                                        disabled
                                        title="Following coming soon"
                                    >
                                        <ArrowUpRight aria-hidden />
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="home-feed__card">
                        <CardHeader>
                            <CardTitle className="home-feed__card-title">Trending topics</CardTitle>
                            <CardDescription className="home-feed__card-description">
                                Tags the community is rallying around right now.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="home-feed__card-list">
                            {trendingTopics.map((topic) => {
                                const Icon = topic.icon;
                                return (
                                    <div key={topic.id} className="home-feed__card-row">
                                        <div className="home-feed__card-icon-wrap home-feed__card-icon-wrap--soft">
                                            <Icon aria-hidden className="home-feed__card-icon" />
                                        </div>
                                        <div>
                                            <p className="home-feed__card-row-title">{topic.title}</p>
                                            <p className="home-feed__card-row-description">{topic.description}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                </aside>
            </div>
        </section>
    );
};

export default Home;
