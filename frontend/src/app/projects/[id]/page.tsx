"use client";

import { useState, useEffect, use, useMemo } from "react";
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import {
    ChevronLeft,
    Folder,
    Briefcase,
    BarChart2,
    Search,
    Eye,
    Github,
    Layout,
    CircleDot,
    GitPullRequest,
    Users,
    ArrowUpRight,
    Table,
    Kanban,
    Map,
    Plus,
    MoreHorizontal,
    CheckCircle2,
    Clock,
    User,
    X,
    Filter,
    Zap,
    AlertTriangle,
    FileText,
    GitCommit,
    TrendingUp,
    PieChart as PieChartIcon,
    History
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import ManageRepositoriesDialog from "@/components/ManageRepositoriesDialog";
import DragDropBoard from "@/components/DragDropBoard";
import DragDropRoadmap from "@/components/DragDropRoadmap";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "@/lib/config";

interface Repository {
    id: string;
    name: string;
    url: string;
    isCloned: boolean;
    commitAnalysis: { status: string; commitsAnalyzed?: number };
    repoScan: { status: string; filesScanned?: number; totalFiles?: number };
    createdAt: string;
    commits_count?: string;
    vulnerabilities_count?: number;
}

interface Project {
    id: string;
    name: string;
    description: string;
    status: string;
    updatedAt: string;
    tasks?: Task[];
    milestones?: { label: string; progress: number; date: string }[];
    stats?: {
        active_issues: number;
        open_prs: number;
        contributors: number;
    };
    repository_ids?: number[];
}

interface Task {
    id: string;
    title: string;
    status: 'Todo' | 'In Progress' | 'Done';
    assignee: string;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    dueDate: string;
}

const INITIAL_TASKS: Task[] = [
    { id: "1", title: "Implement Authentication Flow", status: "Done", assignee: "Sarah Chen", priority: "High", dueDate: "2025-12-15" },
    { id: "2", title: "Setup PostgreSQL Database", status: "Done", assignee: "Michael Ross", priority: "High", dueDate: "2025-12-10" },
    { id: "3", title: "Design Landing Page UI", status: "In Progress", assignee: "Elena Rodriguez", priority: "Medium", dueDate: "2025-12-25" },
    { id: "4", title: "API Integration for Repository Scan", status: "In Progress", assignee: "Sarah Chen", priority: "High", dueDate: "2025-12-28" },
    { id: "5", title: "User Documentation", status: "Todo", assignee: "John Doe", priority: "Low", dueDate: "2026-01-05" },
    { id: "6", title: "Fix Mobile Responsive Issues", status: "Todo", assignee: "Elena Rodriguez", priority: "Medium", dueDate: "2026-01-10" },
];

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { t } = useTranslation();
    const [project, setProject] = useState<Project | null>(null);
    const [repositories, setRepositories] = useState<Repository[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'repositories' | 'backlog' | 'board' | 'roadmap' | 'insights'>('repositories');

    // Task Management
    const [tasks, setTasks] = useState<Task[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredTasks = useMemo(() => {
        if (!searchQuery) return tasks;
        return tasks.filter(t =>
            t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.assignee.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [tasks, searchQuery]);

    const [visibleTabs, setVisibleTabs] = useState<Record<string, boolean>>({});
    const [projectInsights, setProjectInsights] = useState<any[]>([]);
    const [isManageReposOpen, setIsManageReposOpen] = useState(false);

    useEffect(() => {
        if (activeTab === 'insights' && id) {
            fetch(`${API_BASE_URL}/api/v1/projects/${id}/insights`)
                .then(res => res.json())
                .then(data => setProjectInsights(data))
                .catch(err => console.error("Failed to fetch project insights:", err));
        }
    }, [activeTab, id]);

    useEffect(() => {
        const savedTabs = localStorage.getItem('project_tabs');
        if (savedTabs) {
            setVisibleTabs(JSON.parse(savedTabs));
        } else {
            // Default all to true if not set
            setVisibleTabs({
                repositories: true,
                backlog: true,
                board: true,
                roadmap: true,
                insights: true
            });
        }

    }, []);

    useEffect(() => {
        const fetchProjectData = async () => {
            try {
                const projectRes = await fetch(`${API_BASE_URL}/api/v1/projects/${id}`);

                if (projectRes.ok) {
                    const projectData = await projectRes.json();
                    setProject({
                        id: String(projectData.id),
                        name: projectData.name,
                        description: projectData.description,
                        status: projectData.status,
                        updatedAt: projectData.start_date,
                        tasks: projectData.tasks || [],
                        milestones: projectData.milestones || [],
                        stats: projectData.stats,
                        repository_ids: projectData.repository_ids || []
                    });
                    if (projectData.tasks) {
                        const mappedTasks: Task[] = projectData.tasks.map((t: any) => ({
                            id: t.id,
                            title: t.title,
                            status: t.status,
                            assignee: t.assignee,
                            priority: t.priority,
                            dueDate: t.due_date || t.dueDate // Handle both potentially
                        }));
                        setTasks(mappedTasks);
                    }
                }

                // Fetch only linked repositories
                const reposRes = await fetch(`${API_BASE_URL}/api/v1/projects/${id}/repositories`);
                if (reposRes.ok) {
                    const reposData = await reposRes.json();
                    const mappedRepos: Repository[] = reposData.map((r: any) => ({
                        id: String(r.id),
                        name: r.name,
                        url: r.url,
                        isCloned: r.status === "Cloned",
                        commitAnalysis: { status: r.commit_analysis === "Completed" ? "completed" : "not_started" },
                        repoScan: {
                            status: r.repo_scan === "Completed" ? "completed" : r.repo_scan === "In Progress" ? "in_progress" : "not_started",
                            filesScanned: 0,
                            totalFiles: 100
                        },
                        createdAt: r.added_at,
                        commits_count: r.commits_count,
                        vulnerabilities_count: r.vulnerabilities_count
                    }));
                    setRepositories(mappedRepos);
                }
            } catch (error) {
                console.error("Error fetching project details:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProjectData();
    }, [id]);

    const handleAddTask = () => {
        const newTask: Task = {
            id: String(tasks.length + 1),
            title: "New Project Item",
            status: "Todo",
            assignee: "Unassigned",
            priority: "Medium",
            dueDate: new Date().toISOString().split('T')[0]
        };
        setTasks([newTask, ...tasks]);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-800"></div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="p-8 text-center bg-white h-screen">
                <h1 className="text-2xl font-bold text-gray-900">{t('project_detail.not_found.title')}</h1>
                <Link href="/projects" className="text-red-800 hover:underline mt-4 inline-block">{t('project_detail.not_found.back_link')}</Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] bg-white">

            {/* --- GITHUB STYLE HEADER --- */}
            <div className="bg-[#f6f8fa] border-b border-gray-200 px-8 pt-4">
                <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4 px-1">
                    <Link href="/projects" className="flex items-center hover:text-blue-600 transition-colors">
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        {t('project_detail.back_to_projects')}
                    </Link>
                </div>

                <div className="flex items-start justify-between mb-4 px-1">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-white border border-gray-200 rounded-lg shadow-sm">
                            <Briefcase className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-semibold text-gray-900">{project.name}</h1>
                                <span className={cn(
                                    "text-[10px] h-fit uppercase font-bold px-2 py-0.5 rounded-full border",
                                    project.status === 'active' || project.status === 'Active'
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : "bg-gray-50 text-gray-600 border-gray-200"
                                )}>
                                    {project.status}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-0.5">{project.description}</p>
                        </div>
                    </div>
                </div>

                {/* TABS */}
                <div className="flex items-center space-x-1 mt-2 -mb-[1px]">
                    {[
                        { id: 'repositories', label: t('project_detail.tabs.repositories'), icon: Folder },
                        { id: 'backlog', label: t('project_detail.tabs.backlog'), icon: Table },
                        { id: 'board', label: t('project_detail.tabs.board'), icon: Kanban },
                        { id: 'roadmap', label: t('project_detail.tabs.roadmap'), icon: Map },
                        { id: 'insights', label: t('project_detail.tabs.insights'), icon: PieChartIcon },
                    ].filter(tab => visibleTabs[tab.id] !== false).map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-t border-x rounded-t-lg",
                                activeTab === tab.id
                                    ? "bg-white text-gray-900 border-gray-200"
                                    : "text-gray-500 border-transparent hover:bg-gray-100 hover:text-gray-900"
                            )}
                        >
                            <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-gray-900" : "text-gray-400")} />
                            {tab.label}
                            {tab.id === 'repositories' && (
                                <span className="ml-1 bg-gray-200 text-gray-600 px-1.5 rounded-full text-[10px]">
                                    {repositories.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* --- CONTENT AREA --- */}
            <div className="flex-1 bg-white overflow-y-auto">
                <div className="p-8">

                    {/* 1. REPOSITORIES TAB */}
                    {activeTab === 'repositories' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {/* Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                <Card className="bg-[#f6f8fa] border-gray-200 shadow-none">
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                                            <Github className="w-5 h-5 text-gray-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500">Connected Repos</p>
                                            <p className="text-lg font-bold text-gray-900">{repositories.length}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-[#f6f8fa] border-gray-200 shadow-none">
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                                            <CircleDot className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500">Active Issues</p>
                                            <p className="text-lg font-bold text-gray-900">{project.stats?.active_issues || 0}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-[#f6f8fa] border-gray-200 shadow-none">
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                                            <GitPullRequest className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500">Open PRs</p>
                                            <p className="text-lg font-bold text-gray-900">{project.stats?.open_prs || 0}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-[#f6f8fa] border-gray-200 shadow-none">
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                                            <Users className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500">Contributors</p>
                                            <p className="text-lg font-bold text-gray-900">{project.stats?.contributors || 0}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Manage Repositories Button */}
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">{t('project_detail.tabs.repositories')}</h3>
                                <button
                                    onClick={() => setIsManageReposOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 transition-colors text-sm font-medium"
                                >
                                    <Plus className="w-4 h-4" />
                                    {t('project_detail.repositories.manage_button')}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {repositories.map((repo) => (
                                    <Card key={repo.id} className="border-gray-200 shadow-sm hover:border-blue-400 transition-colors">
                                        <CardContent className="p-6">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-gray-900 text-lg truncate flex-1 min-w-0 pr-4" title={repo.name}>
                                                    {repo.name}
                                                </h3>
                                                {repo.isCloned && (
                                                    <span className="shrink-0 bg-emerald-50 text-emerald-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-emerald-200">
                                                        Cloned
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-500 text-xs mb-6">
                                                <Folder className="w-3.5 h-3.5 shrink-0" />
                                                <span className="truncate">{repo.url}</span>
                                            </div>
                                            <div className="space-y-2 mb-6">
                                                <div className="flex justify-between items-center bg-gray-50 rounded px-3 py-2 border border-gray-100">
                                                    <span className="text-xs font-medium text-gray-600 flex items-center gap-2">
                                                        <BarChart2 className="w-3.5 h-3.5 text-gray-400" /> Commits
                                                    </span>
                                                    <span className="text-xs text-gray-900 font-medium">{repo.commits_count || "0"}</span>
                                                </div>
                                                <div className="flex justify-between items-center bg-gray-50 rounded px-3 py-2 border border-gray-100">
                                                    <span className="text-xs font-medium text-gray-600 flex items-center gap-2">
                                                        <Search className="w-3.5 h-3.5 text-gray-400" /> Vulnerabilities
                                                    </span>
                                                    <span className={cn(
                                                        "text-xs font-bold",
                                                        (repo.vulnerabilities_count || 0) > 0 ? "text-red-600" : "text-emerald-600"
                                                    )}>{repo.vulnerabilities_count || 0}</span>
                                                </div>
                                            </div>
                                            <Link href={`/repositories/${repo.id}`} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors w-full justify-center shadow-sm">
                                                <Eye className="w-4 h-4" />
                                                <span>View Repository Details</span>
                                            </Link>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 2. BACKLOG TAB */}
                    {activeTab === 'backlog' && (
                        <div className="animate-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="relative max-w-xl flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Filter by keyword or by field"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 bg-[#f6f8fa] border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 outline-none transition-all shadow-inner"
                                        />
                                        {searchQuery && (
                                            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                                            </button>
                                        )}
                                    </div>
                                    <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                                        <Filter className="w-4 h-4" /> {t('project_detail.backlog.filter')}
                                    </button>
                                    <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                        {t('project_detail.backlog.items_count', { count: filteredTasks.length })}
                                    </span>
                                </div>
                                <button
                                    onClick={handleAddTask}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm ml-4"
                                >
                                    <Plus className="w-4 h-4" /> {t('project_detail.backlog.add_item')}
                                </button>
                            </div>
                            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-[#f6f8fa] border-b border-gray-200 text-gray-500">
                                        <tr>
                                            <th className="px-6 py-3 font-medium w-12"></th>
                                            <th className="px-6 py-3 font-medium">{t('project_detail.backlog.table.title')}</th>
                                            <th className="px-6 py-3 font-medium">{t('project_detail.backlog.table.status')}</th>
                                            <th className="px-6 py-3 font-medium">{t('project_detail.backlog.table.assignee')}</th>
                                            <th className="px-6 py-3 font-medium text-right pr-12">{t('project_detail.backlog.table.priority')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredTasks.map((task) => (
                                            <tr key={task.id} className="hover:bg-[#f6f8fa]/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-900">{task.title}</td>
                                                <td className="px-6 py-4">
                                                    <span className={cn(
                                                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all",
                                                        task.status === 'Done' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                                                            task.status === 'In Progress' ? "bg-blue-50 text-blue-700 border border-blue-200" :
                                                                "bg-gray-50 text-gray-500 border border-gray-200"
                                                    )}>
                                                        {task.status === 'Done' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                        {task.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-600 uppercase">
                                                            {task.assignee.split(' ').map(n => n[0]).join('')}
                                                        </div>
                                                        <span className="text-gray-600">{task.assignee}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right pr-12">
                                                    <span className={cn(
                                                        "text-[10px] font-bold px-2 py-0.5 rounded",
                                                        task.priority === 'High' ? "text-red-600 bg-red-50" :
                                                            task.priority === 'Medium' ? "text-orange-600 bg-orange-50" :
                                                                "text-gray-500 bg-gray-50"
                                                    )}>
                                                        {task.priority}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* 3. BOARD TAB */}
                    {activeTab === 'board' && (
                        <div className="animate-in slide-in-from-right-4 duration-300">
                            <DragDropBoard
                                projectId={id}
                                tasks={tasks}
                                onTasksUpdate={(updatedTasks) => setTasks(updatedTasks)}
                            />
                        </div>
                    )}

                    {/* 4. ROADMAP TAB */}
                    {activeTab === 'roadmap' && (
                        <div className="animate-in slide-in-from-right-4 duration-300">
                            <DragDropRoadmap
                                projectId={id}
                                milestones={project.milestones || []}
                                onMilestonesUpdate={(updatedMilestones) => {
                                    setProject({ ...project, milestones: updatedMilestones });
                                }}
                            />
                        </div>
                    )}

                    {/* 5. INSIGHTS TAB */}
                    {activeTab === 'insights' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {projectInsights.length === 0 && (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                                    <p className="text-sm text-muted-foreground">{t('project_detail.insights.loading')}</p>
                                </div>
                            )}

                            {projectInsights.length > 0 && (
                                <>
                                    {/* Summary Cards (Partially Dynamic) */}
                                    {(() => {
                                        const debt = projectInsights.find(i => i.type === 'debt')?.data || {};
                                        const contributors = projectInsights.find(i => i.type === 'contributors')?.data || {};

                                        return (
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                <Card className="border-none shadow-sm ring-1 ring-gray-100">
                                                    <CardContent className="p-4">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('project_detail.insights.cards.tech_debt_ratio')}</p>
                                                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                                                        </div>
                                                        <div className="flex items-baseline gap-2">
                                                            <h3 className="text-2xl font-bold text-gray-900">{debt.debt_ratio || 'N/A'}</h3>
                                                            <span className="text-xs text-red-600 font-medium flex items-center">
                                                                <ArrowUpRight className="w-3 h-3 mr-0.5" /> +2.4%
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-400 mt-1">{t('project_detail.insights.cards.refactoring_needed')}</p>
                                                    </CardContent>
                                                </Card>
                                                <Card className="border-none shadow-sm ring-1 ring-gray-100">
                                                    <CardContent className="p-4">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('project_detail.insights.cards.deployment_freq')}</p>
                                                            <Zap className="w-4 h-4 text-blue-500" />
                                                        </div>
                                                        <div className="flex items-baseline gap-2">
                                                            <h3 className="text-2xl font-bold text-gray-900">{projectInsights.find(i => i.type === 'deployment')?.data.frequency || 'N/A'}</h3>
                                                            <span className="text-xs text-emerald-600 font-medium flex items-center">
                                                                <TrendingUp className="w-3 h-3 mr-0.5" /> {projectInsights.find(i => i.type === 'deployment')?.data.trend || '0%'}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-400 mt-1">{projectInsights.find(i => i.type === 'deployment')?.data.status || 'Checking...'}</p>
                                                    </CardContent>
                                                </Card>
                                                <Card className="border-none shadow-sm ring-1 ring-gray-100">
                                                    <CardContent className="p-4">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('project_detail.insights.cards.active_contributors')}</p>
                                                            <Users className="w-4 h-4 text-purple-500" />
                                                        </div>
                                                        <div className="flex items-baseline gap-2">
                                                            <h3 className="text-2xl font-bold text-gray-900">{contributors.labels?.length || 0}</h3>
                                                            <span className="text-xs text-emerald-600 font-medium flex items-center">
                                                                <TrendingUp className="w-3 h-3 mr-0.5" /> +2
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-400 mt-1">{t('project_detail.insights.cards.this_week')}</p>
                                                    </CardContent>
                                                </Card>
                                                <Card className="border-none shadow-sm ring-1 ring-gray-100">
                                                    <CardContent className="p-4">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('project_detail.insights.cards.refactor_est')}</p>
                                                            <Clock className="w-4 h-4 text-gray-500" />
                                                        </div>
                                                        <div className="flex items-baseline gap-2">
                                                            <h3 className="text-2xl font-bold text-gray-900">{debt.total_debt_hours ? `${debt.total_debt_hours}h` : 'N/A'}</h3>
                                                            <span className="text-xs text-gray-500 font-medium">
                                                                {t('project_detail.insights.cards.sprint_buffer')}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-400 mt-1">{t('project_detail.insights.cards.clear_debt')}</p>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        );
                                    })()}

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Contributor Analysis */}
                                        {(() => {
                                            const contributors = projectInsights.find(i => i.type === 'contributors')?.data;
                                            const chartData = contributors?.labels.map((name: string, i: number) => ({
                                                name,
                                                commits: contributors.datasets[0].data[i]
                                            })) || [];

                                            return (
                                                <Card className="border-none shadow-sm ring-1 ring-gray-100">
                                                    <CardContent className="p-6">
                                                        <div className="flex items-center justify-between mb-6">
                                                            <div>
                                                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                                                    <Users className="w-5 h-5 text-blue-600" />
                                                                    {t('project_detail.insights.charts.contributor_analysis')}
                                                                </h3>
                                                                <p className="text-xs text-gray-500 mt-1">{t('project_detail.insights.charts.commits_dist')}</p>
                                                            </div>
                                                        </div>
                                                        <div className="h-64">
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <BarChart
                                                                    data={chartData}
                                                                    layout="vertical"
                                                                    margin={{ left: 20 }}
                                                                >
                                                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                                                    <XAxis type="number" />
                                                                    <YAxis type="category" dataKey="name" width={60} />
                                                                    <Tooltip
                                                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                                    />
                                                                    <Bar dataKey="commits" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} name="Commits" />
                                                                </BarChart>
                                                            </ResponsiveContainer>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })()}

                                        {/* Code Churn / Hotspots */}
                                        {(() => {
                                            const churn = projectInsights.find(i => i.type === 'churn')?.data;
                                            const files = churn?.high_risk_files || [];

                                            return (
                                                <Card className="border-none shadow-sm ring-1 ring-gray-100">
                                                    <CardContent className="p-6">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div>
                                                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                                                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                                                                    {t('project_detail.insights.charts.code_churn')}
                                                                </h3>
                                                                <p className="text-xs text-gray-500 mt-1">{t('project_detail.insights.charts.churn_desc')}</p>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-3">
                                                            {files.map((file: any, i: number) => (
                                                                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                                    <div>
                                                                        <div className="font-mono text-xs font-bold text-gray-700">{file.name}</div>
                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            <span className="text-[10px] text-gray-500">{file.changes} recent changes</span>
                                                                        </div>
                                                                    </div>
                                                                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-red-100 text-red-700">
                                                                        {t('project_detail.insights.charts.high_risk')}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })()}
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        {/* Technical Debt Estimation */}
                                        {(() => {
                                            const debt = projectInsights.find(i => i.type === 'debt')?.data || {};
                                            return (
                                                <Card className="border-none shadow-sm ring-1 ring-gray-100 lg:col-span-1">
                                                    <CardContent className="p-6">
                                                        <div className="mb-6">
                                                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                                                <FileText className="w-5 h-5 text-gray-600" />
                                                                {t('project_detail.insights.debt.title')}
                                                            </h3>
                                                            <p className="text-xs text-gray-500 mt-1">{t('project_detail.insights.debt.subtitle')}</p>
                                                        </div>

                                                        <div className="space-y-6">
                                                            <div className="relative pt-2">
                                                                <div className="flex justify-between items-end mb-2">
                                                                    <span className="text-sm font-medium text-gray-700">{t('project_detail.insights.debt.code_smell_ratio')}</span>
                                                                    <span className="text-sm font-bold text-red-600">{debt.debt_ratio || '0%'}</span>
                                                                </div>
                                                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                                    <div className="h-full bg-red-500 w-[12.5%]" />
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="p-3 bg-red-50 rounded-lg text-center">
                                                                    <p className="text-xs text-red-600 font-bold uppercase mb-1">{t('project_detail.insights.debt.critical')}</p>
                                                                    <p className="text-xl font-bold text-gray-900">{debt.total_debt_hours ? Math.round(debt.total_debt_hours * 0.2) + 'h' : '0h'}</p>
                                                                </div>
                                                                <div className="p-3 bg-orange-50 rounded-lg text-center">
                                                                    <p className="text-xs text-orange-600 font-bold uppercase mb-1">{t('project_detail.insights.debt.major')}</p>
                                                                    <p className="text-xl font-bold text-gray-900">{debt.total_debt_hours ? Math.round(debt.total_debt_hours * 0.4) + 'h' : '0h'}</p>
                                                                </div>
                                                            </div>

                                                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                                                <h4 className="text-xs font-bold text-gray-700 mb-2 uppercase">{t('project_detail.insights.debt.top_areas')}</h4>
                                                                <div className="space-y-1">
                                                                    {debt.top_offenders?.map((offender: string, i: number) => (
                                                                        <p key={i} className="text-sm font-medium text-gray-900">{offender}</p>
                                                                    ))}
                                                                </div>
                                                                <p className="text-xs text-gray-500 mt-1">{t('project_detail.insights.debt.complex_logic')}</p>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })()}

                                        {/* Changelog Generator */}
                                        {(() => {
                                            const changelog = projectInsights.find(i => i.type === 'changelog')?.data;
                                            return (
                                                <Card className="border-none shadow-sm ring-1 ring-gray-100 lg:col-span-2">
                                                    <CardContent className="p-6 h-full flex flex-col">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div>
                                                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                                                    <History className="w-5 h-5 text-emerald-600" />
                                                                    {t('project_detail.insights.changelog.title')}
                                                                </h3>
                                                                <p className="text-xs text-gray-500 mt-1">{t('project_detail.insights.changelog.subtitle')}</p>
                                                            </div>
                                                            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-black transition-colors">
                                                                <Zap className="w-3 h-3" /> {t('project_detail.insights.changelog.generate')} {changelog?.next_version || 'v1.0.0'}
                                                            </button>
                                                        </div>

                                                        <div className="flex-1 bg-gray-50 rounded-xl border border-gray-100 p-4 font-mono text-sm overflow-y-auto max-h-[300px]">
                                                            <div className="space-y-4">
                                                                {changelog ? (
                                                                    <div>
                                                                        <h4 className="font-bold text-gray-900 mb-2">{changelog.version} <span className="text-xs font-normal text-gray-500 ml-2">({changelog.date})</span></h4>
                                                                        <ul className="list-disc pl-4 space-y-1 text-gray-600">
                                                                            {changelog.changes.map((change: any, i: number) => (
                                                                                <li key={i}>
                                                                                    <span className="text-[#0969da] font-medium">[{change.type}]</span> {change.text}
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-gray-400 italic">{t('project_detail.insights.changelog.no_data')}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })()}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                </div>
            </div>

            {/* Manage Repositories Dialog */}
            <ManageRepositoriesDialog
                isOpen={isManageReposOpen}
                onClose={() => setIsManageReposOpen(false)}
                projectId={id}
                currentRepositoryIds={project?.repository_ids || []}
                onSave={(newRepositoryIds) => {
                    // Refresh repositories after save
                    fetch(`${API_BASE_URL}/api/v1/projects/${id}/repositories`)
                        .then(res => res.json())
                        .then(reposData => {
                            const mappedRepos: Repository[] = reposData.map((r: any) => ({
                                id: String(r.id),
                                name: r.name,
                                url: r.url,
                                isCloned: r.status === "Cloned",
                                commitAnalysis: { status: r.commit_analysis || "Not Started" },
                                repoScan: { status: r.repo_scan || "Not Started" },
                                createdAt: r.added_at,
                                commits_count: r.commits_count,
                                vulnerabilities_count: r.vulnerabilities_count
                            }));
                            setRepositories(mappedRepos);
                            // Update project with new repository_ids
                            if (project) {
                                setProject({ ...project, repository_ids: newRepositoryIds });
                            }
                        })
                        .catch(err => console.error("Error refreshing repositories:", err));
                }}
            />
        </div >
    );
}
