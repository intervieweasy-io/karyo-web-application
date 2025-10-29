import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { LucideIcon } from "lucide-react";
import {
    ArrowUpRight,
    BarChart3,
    Bookmark,
    CalendarCheck2,
    CheckCircle2,
    Clock3,
    Compass,
    FileText,
    Flag,
    GraduationCap,
    ImageIcon,
    MessageSquare,
    Paperclip,
    Plus,
    Share2,
    Sparkles,
    Target,
    ThumbsUp,
} from "lucide-react";

const composerTopics = [
    "Currently Working On",
    "Learning Journey",
    "Problem I'm Solving",
    "Milestone Achieved",
];

const posts = [
    {
        id: "post-1",
        author: {
            name: "Priya Sharma",
            role: "Frontend Developer",
            company: "Product Manager",
            initials: "PS",
        },
        status: { label: "Currently Working On", tone: "info" },
        timeAgo: "2h ago",
        title: "Building a React component library for our startup.",
        summary:
            "Struggling with making components truly reusable across different themes. Any tips on prop API design?",
        tags: ["React", "TypeScript", "Component Design"],
        highlights: [
            "Audited 32 shared components and refactored 18 for consistency.",
            "Shipped new dark mode tokens with automated visual regression tests.",
            "Next up: build interactive documentation using Storybook MDX.",
        ],
        metrics: {
            cheers: 42,
            comments: 18,
            shares: 6,
        },
    },
    {
        id: "post-2",
        author: {
            name: "Rahul Gupta",
            role: "Product Manager",
            company: "GrowthOps",
            initials: "RG",
        },
        status: { label: "Learning Journey", tone: "success" },
        timeAgo: "5h ago",
        title: "Mapping experiment backlog to company-level outcomes.",
        summary:
            "Documented how each growth hypothesis rolls up to north-star revenue metrics. Would love feedback on the scoring rubric!",
        tags: ["Growth", "Experimentation", "Strategy"],
        highlights: [
            "Built a Notion dashboard that connects Amplitude data with weekly rituals.",
            "Piloted a cross-functional retro with sales + support leads for faster learning loops.",
            "Working on an AI summary to recap experiment health for exec reviews.",
        ],
        metrics: {
            cheers: 35,
            comments: 11,
            shares: 4,
        },
    },
];

const upcomingRituals = [
    {
        id: "ritual-1",
        title: "Design system office hours",
        cadence: "Today · 4:00 PM",
        facilitator: "Figma Pod",
    },
    {
        id: "ritual-2",
        title: "Weekly growth retro",
        cadence: "Tomorrow · 9:30 AM",
        facilitator: "North-star Squad",
    },
    {
        id: "ritual-3",
        title: "Founder accountability standup",
        cadence: "Friday · 7:45 AM",
        facilitator: "Build Mode Circle",
    },
];

type IconCard = {
    id: string;
    title: string;
    description: string;
    icon: LucideIcon;
};

const curatedPlaylists: IconCard[] = [
    {
        id: "playlist-1",
        title: "Product storytelling essentials",
        description: "Narratives that help your portfolio come alive",
        icon: Sparkles,
    },
    {
        id: "playlist-2",
        title: "Deep work hacks for builders",
        description: "Rituals and systems to protect your maker time",
        icon: Target,
    },
    {
        id: "playlist-3",
        title: "Learning loops for leadership",
        description: "Frameworks to coach and unblock your team",
        icon: GraduationCap,
    },
];

const focusWins: IconCard[] = [
    {
        id: "focus-1",
        title: "3 active applications",
        description: "Stripe, Linear, and Vercel have fresh updates.",
        icon: Compass,
    },
    {
        id: "focus-2",
        title: "2 warm intros lined up",
        description: "Dani and Marcus ready to refer you this week.",
        icon: BarChart3,
    },
    {
        id: "focus-3",
        title: "Portfolio revamp",
        description: "Add the AI design sprint story before Friday.",
        icon: Flag,
    },
];

export default function Home() {
    return (
        <section className="home-feed-page">
            <div className="home-feed-grid">
                <aside className="home-feed-column home-feed-column--left">
                    <Card className="home-feed__card home-feed__card--profile">
                        <div className="home-feed__profile">
                            <Avatar className="home-feed__avatar" aria-hidden>
                                <AvatarFallback>U</AvatarFallback>
                            </Avatar>

                            <div className="home-feed__profile-meta">
                                <h2 className="home-feed__profile-name">You</h2>
                                <p className="home-feed__profile-role">Product tinkerer · Bay Area</p>
                            </div>
                        </div>

                        <div className="home-feed__profile-metrics">
                            <div>
                                <span className="home-feed__metric-value">12</span>
                                <span className="home-feed__metric-label">Ongoing streak</span>
                            </div>
                            <div>
                                <span className="home-feed__metric-value">48</span>
                                <span className="home-feed__metric-label">Community kudos</span>
                            </div>
                            <div>
                                <span className="home-feed__metric-value">7</span>
                                <span className="home-feed__metric-label">Pods joined</span>
                            </div>
                        </div>

                        <Button className="home-feed__primary-action">Update profile</Button>
                    </Card>

                    <Card className="home-feed__card">
                        <CardHeader>
                            <CardTitle className="home-feed__card-title">Focus for this week</CardTitle>
                            <CardDescription className="home-feed__card-description">
                                Quick glance at the plays that move your search forward.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="home-feed__card-list">
                            {focusWins.map((item) => {
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
                                <AvatarFallback>U</AvatarFallback>
                            </Avatar>

                            <div>
                                <p className="home-feed__composer-title">
                                    Share your progress, challenges, or what you&apos;re learning…
                                </p>
                                <div className="home-feed__topic-chips">
                                    {composerTopics.map((topic) => (
                                        <span key={topic} className="home-feed__topic-chip">
                                            {topic}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <Tabs defaultValue="text" className="home-feed__composer-tabs">
                            <TabsList className="home-feed__composer-tablist">
                                <TabsTrigger value="text">
                                    <FileText aria-hidden /> Text
                                </TabsTrigger>
                                <TabsTrigger value="media">
                                    <ImageIcon aria-hidden /> Media
                                </TabsTrigger>
                                <TabsTrigger value="poll">
                                    <BarChart3 aria-hidden /> Poll
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="text" className="home-feed__composer-panel">
                                <Textarea
                                    rows={4}
                                    placeholder="Start typing your update…"
                                    aria-label="Share an update"
                                />

                                <div className="home-feed__composer-footer">
                                    <div className="home-feed__composer-actions">
                                        <Button variant="ghost" className="home-feed__icon-button">
                                            <Paperclip aria-hidden />
                                            Attach files
                                        </Button>
                                        <Button variant="ghost" className="home-feed__icon-button">
                                            <ImageIcon aria-hidden />
                                            Add media
                                        </Button>
                                    </div>

                                    <Button className="home-feed__primary-action">Share progress</Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="media" className="home-feed__composer-panel">
                                <div className="home-feed__dropzone">
                                    <ImageIcon aria-hidden />
                                    <p className="home-feed__dropzone-title">Drag and drop media files</p>
                                    <p className="home-feed__dropzone-description">
                                        Supported formats: PNG, JPG, GIF, MP4 (max 25 MB).
                                    </p>
                                    <Button variant="outline">Choose files</Button>
                                </div>
                                <Button className="home-feed__primary-action">Share progress</Button>
                            </TabsContent>

                            <TabsContent value="poll" className="home-feed__composer-panel">
                                <div className="home-feed__poll">
                                    <Input placeholder="Ask a question for the community…" />
                                    <div className="home-feed__poll-options">
                                        <Input placeholder="Option A" />
                                        <Input placeholder="Option B" />
                                    </div>
                                    <div className="home-feed__poll-footer">
                                        <Button variant="ghost" className="home-feed__icon-button">
                                            <Plus aria-hidden />
                                            Add option
                                        </Button>
                                        <div className="home-feed__poll-meta">
                                            <Clock3 aria-hidden />
                                            Poll closes in 48 hours
                                        </div>
                                    </div>
                                </div>
                                <Button className="home-feed__primary-action">Launch poll</Button>
                            </TabsContent>
                        </Tabs>
                    </Card>

                    <div className="home-feed__posts">
                        {posts.map((post) => (
                            <Card key={post.id} className="home-feed__card home-feed__card--post">
                                <header className="home-feed__post-header">
                                    <Avatar className="home-feed__avatar" aria-hidden>
                                        <AvatarFallback>{post.author.initials}</AvatarFallback>
                                    </Avatar>
                                    <div className="home-feed__post-meta">
                                        <div className="home-feed__post-heading">
                                            <p className="home-feed__post-author">{post.author.name}</p>
                                            <Badge className={`home-feed__status home-feed__status--${post.status.tone}`}>
                                                {post.status.label}
                                            </Badge>
                                        </div>
                                        <p className="home-feed__post-role">
                                            {post.author.role} · {post.timeAgo}
                                        </p>
                                    </div>
                                    <Button variant="ghost" className="home-feed__icon-button">
                                        <Bookmark aria-hidden />
                                        Save
                                    </Button>
                                </header>

                                <div className="home-feed__post-body">
                                    <h3 className="home-feed__post-title">{post.title}</h3>
                                    <p className="home-feed__post-summary">{post.summary}</p>

                                    <ul className="home-feed__post-highlights">
                                        {post.highlights.map((highlight, index) => (
                                            <li key={index}>
                                                <CheckCircle2 aria-hidden />
                                                <span>{highlight}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="home-feed__post-tags">
                                    {post.tags.map((tag) => (
                                        <span key={tag} className="home-feed__tag">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>

                                <footer className="home-feed__post-footer">
                                    <button type="button" className="home-feed__post-action">
                                        <ThumbsUp aria-hidden />
                                        Cheer
                                        <span className="home-feed__post-count">{post.metrics.cheers}</span>
                                    </button>
                                    <button type="button" className="home-feed__post-action">
                                        <MessageSquare aria-hidden />
                                        Comment
                                        <span className="home-feed__post-count">{post.metrics.comments}</span>
                                    </button>
                                    <button type="button" className="home-feed__post-action">
                                        <Share2 aria-hidden />
                                        Share
                                        <span className="home-feed__post-count">{post.metrics.shares}</span>
                                    </button>
                                </footer>
                            </Card>
                        ))}
                    </div>
                </div>

                <aside className="home-feed-column home-feed-column--right">
                    <Card className="home-feed__card">
                        <CardHeader>
                            <CardTitle className="home-feed__card-title">Growth rituals</CardTitle>
                            <CardDescription className="home-feed__card-description">
                                Show up, share progress, and celebrate momentum with your pods.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="home-feed__card-list">
                            {upcomingRituals.map((ritual) => (
                                <div key={ritual.id} className="home-feed__card-row">
                                    <div className="home-feed__card-icon-wrap home-feed__card-icon-wrap--accent">
                                        <CalendarCheck2 aria-hidden className="home-feed__card-icon" />
                                    </div>
                                    <div>
                                        <p className="home-feed__card-row-title">{ritual.title}</p>
                                        <p className="home-feed__card-row-description">{ritual.cadence}</p>
                                        <span className="home-feed__card-subtext">Hosted by {ritual.facilitator}</span>
                                    </div>
                                    <Button variant="ghost" className="home-feed__icon-button home-feed__icon-button--small">
                                        <ArrowUpRight aria-hidden />
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="home-feed__card">
                        <CardHeader>
                            <CardTitle className="home-feed__card-title">Curated playbooks</CardTitle>
                            <CardDescription className="home-feed__card-description">
                                Hand-picked resources to level up your storytelling.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="home-feed__card-list">
                            {curatedPlaylists.map((playlist) => {
                                const Icon = playlist.icon;
                                return (
                                    <div key={playlist.id} className="home-feed__card-row">
                                        <div className="home-feed__card-icon-wrap home-feed__card-icon-wrap--soft">
                                            <Icon aria-hidden className="home-feed__card-icon" />
                                        </div>
                                        <div>
                                            <p className="home-feed__card-row-title">{playlist.title}</p>
                                            <p className="home-feed__card-row-description">{playlist.description}</p>
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
}
