"use client";

import { useState, useCallback, useEffect, use } from "react";
import ReactFlow, {
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    MiniMap
} from 'reactflow';
import 'reactflow/dist/style.css';

import * as Dialog from "@radix-ui/react-dialog";
import {
    ChevronLeft,
    LayoutTemplate,
    Map,
    Users,
    Trash2,
    Activity,
    FolderOpen,
    MessageSquare,
    Sparkles,
    GitBranch,
    FileText,
    Plus,
    History,
    Search,
    Send,
    Lightbulb,
    X,
    Pencil,
    Check,
    Zap,
    GraduationCap,
    Clock,
    TrendingUp,
    Bot,
    ShieldAlert,
    CheckCircle2,
    Github,
    GitPullRequest,
    ChevronDown,
    ChevronRight,
    Tag,
    Trophy,
    List,
    ListOrdered,
    Image as ImageIcon,
    Undo2,
    Redo2,
    Edit3,
    RotateCw,
    Copy,
    Download,
    Lock
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
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
import { API_BASE_URL } from "@/lib/config";

// Hardcoded fallback data deleted... 

// --- FLOW MOCK DATA ---
const initialNodes = [
    { id: '1', position: { x: 50, y: 50 }, data: { label: 'Backend API Service' }, style: { background: '#fff', border: '1px solid #777', width: 180 } },
    { id: '2', position: { x: 300, y: 50 }, data: { label: 'HTTPInterceptor.tsx' }, style: { background: '#eef2ff', border: '1px solid #6366f1', width: 180 } },
    { id: '3', position: { x: 550, y: 50 }, data: { label: 'ScenaraioAuthorization.tsx' }, style: { background: '#eef2ff', border: '1px solid #6366f1', width: 180 } },
    { id: '4', position: { x: 300, y: 200 }, data: { label: 'ResponseInterceptor.tsx' }, style: { background: '#eef2ff', border: '1px solid #6366f1', width: 180 } },
    { id: '5', position: { x: 50, y: 350 }, data: { label: 'RunManagementContextStore.ts' }, style: { background: '#fffbeb', border: '1px solid #f59e0b', width: 220 } },
    { id: '6', position: { x: 350, y: 350 }, data: { label: 'AddRunDialog.tsx' }, style: { background: '#fff7ed', border: '1px solid #f97316', width: 180 } },
];

const initialEdges = [
    { id: 'e1-2', source: '2', target: '1', label: 'Sends request' },
    { id: 'e2-3', source: '2', target: '3', label: 'Adds auth token' },
    { id: 'e1-4', source: '1', target: '4', label: 'Responds with data/error' },
    { id: 'e4-5', source: '4', target: '5', label: 'Handles response/error' },
    { id: 'e5-6', source: '5', target: '6', label: 'Updates UI state' },
];

function InfoIcon({ className }: { className?: string }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
}

interface Repository {
    id: number;
    name: string;
    url: string;
    username: string;
    main_branch: string;
    status: string;
    commit_analysis: string;
    repo_scan: string;
    added_at: string;
    scanned_at: string;
    analysis_metrics?: {
        effort_manual_hours: number;
        ai_savings_percentage: number;
        complexity_score: number;
        high_risk_commits: number;
        medium_risk_commits: number;
        low_risk_commits: number;
    };
    tech_stack?: { name: string; fte: number; commits: number; complexity: number; color: string }[];
    vulnerabilities?: { id: string; severity: string; package: string; version: string; description: string }[];
    secrets?: { file: string; line: number; type: string; snippet: string }[];
    compliance?: { label: string; status: string }[];
    team_staffing?: { id: number; title: string; level: string; initials: string; skills: string[]; fte: string; description: string }[];
    dead_code?: { type: string; name: string; file: string; line: number }[];
    duplication_blocks?: { similarity: number; files: string[]; lines: number }[];
    complexity_by_file?: { name: string; complexity: number }[];
    test_coverage?: { total: number; by_folder: { folder: string; coverage: number; files: number }[] };
    code_flows?: { nodes: any[]; edges: any[] };
    chat_history: { id: string; title: string; text: string; date: string }[];
    feature_requests: {
        id: string;
        title: string;
        description: string;
        date: string;
        status: string;
        complexity: string;
        type: string;
        summary: string;
        identifiedFiles: string[];
        prompt: string;
    }[];
    code_flow_requests: { id: string; title: string; description: string; date: string; status: string }[];
    dependency_stats?: { total: number; internal: number; external: number; circular: number };
    dependency_graph?: { nodes: any[]; edges: any[] };
    circular_dependencies?: { files: string[]; description: string }[];
    import_export_analysis?: { name: string; exports: number; usedBy: number; maturity: string }[];
    security_score?: string;
    overview_analysis?: {
        stack_complexity_text: string;
        ai_impact_text: string;
        recommendations: { title: string; text: string }[];
        project_state: string;
    };
    pull_requests?: {
        id: string;
        title: string;
        status: string;
        author: string;
        date: string;
        files_changed: number;
        additions: number;
        deletions: number;
    }[];
    feature_map?: {
        nodes: any[];
        edges: any[];
    };
}

export default function RepositoryDetailPage({
    params,
    searchParams
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ tab?: string; scanSuccess?: string }>;
}) {
    const { id } = use(params);
    const { tab: tabParam, scanSuccess } = use(searchParams);

    const [activeTab, setActiveTab] = useState(tabParam || "overview");
    const [repo, setRepo] = useState<Repository | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showSuccess, setShowSuccess] = useState(false);
    const [visibleTabs, setVisibleTabs] = useState<Record<string, boolean>>({});
    const [aiFeatures, setAiFeatures] = useState<any[]>([]);

    useEffect(() => {
        if (activeTab === 'ai-features' && id) {
            fetch(`${API_BASE_URL}/api/v1/repositories/${id}/ai-features`)
                .then(res => res.json())
                .then(data => setAiFeatures(data))
                .catch(err => console.error("Failed to fetch AI features:", err));
        }
    }, [activeTab, id]);

    useEffect(() => {
        const savedTabs = localStorage.getItem('repo_tabs');
        if (savedTabs) {
            setVisibleTabs(JSON.parse(savedTabs));
        } else {
            // Default all to true if not set
            setVisibleTabs({
                overview: true,
                technologies: true,
                'code-flows': true,
                'team-staffing': true,
                'code-quality': true,
                'feature-map': true,
                dependencies: true,
                security: true, // Note: pulled from tabs list, might differ from settings if list evolved
                'ai-features': true,
                'ask-questions': true,
                'prompt-generation': true,
                'pull-requests': true
            });
        }
    }, []);

    useEffect(() => {
        if (scanSuccess === 'true') {
            setShowSuccess(true);
            const timer = setTimeout(() => {
                setShowSuccess(false);
                window.history.replaceState({}, '', `/repositories/${id}${activeTab !== 'overview' ? `?tab=${activeTab}` : ''}`);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [scanSuccess, id, activeTab]);

    useEffect(() => {
        if (tabParam) {
            setActiveTab(tabParam);
        }
    }, [tabParam]);

    useEffect(() => {
        const fetchRepo = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/v1/repositories/${id}`);
                if (response.ok) {
                    const data = await response.json();
                    setRepo(data);

                    // Sync AI Features & Flow state if data exists
                    if (data.code_flows?.nodes) setNodes(data.code_flows.nodes);
                    if (data.code_flows?.edges) setEdges(data.code_flows.edges);
                    if (data.chat_history) setChatHistory(data.chat_history);
                    if (data.feature_requests) setFeatureRequests(data.feature_requests);
                    if (data.code_flow_requests) setCodeFlows(data.code_flow_requests);

                    // Sync Feature Map nodes/edges
                    if (data.feature_map?.nodes) setFeatureNodes(data.feature_map.nodes);
                    if (data.feature_map?.edges) setFeatureEdges(data.feature_map.edges);
                }
            } catch (error) {
                console.error("Error fetching repository:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRepo();
    }, [id]);
    // Ask Questions State
    const [input, setInput] = useState("");
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [chatState, setChatState] = useState<'idle' | 'new' | 'viewing'>('idle');
    const [chatHistory, setChatHistory] = useState<Repository['chat_history']>([]);

    const handleNewChat = () => {
        setActiveChatId(null);
        setChatState('new');
        setInput("");
    };

    const handleChatClick = (chat: any) => {
        setActiveChatId(chat.id);
        setChatState('viewing');
        setInput(chat.text);
    };

    const handleDeleteChat = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setChatHistory(prev => prev.filter(c => c.id !== id));
        if (activeChatId === id) {
            setActiveChatId(null);
            setChatState('idle');
        }
    };

    // ReactFlow State (General / Code Flow)
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const onConnect = useCallback((params: any) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

    // ReactFlow State (Feature Map)
    const [featureNodes, setFeatureNodes, onFeatureNodesChange] = useNodesState([]);
    const [featureEdges, setFeatureEdges, onFeatureEdgesChange] = useEdgesState([]);

    // Modal State
    const [isNewFlowOpen, setIsNewFlowOpen] = useState(false);

    // Prompt Generation State
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
    const [featureRequests, setFeatureRequests] = useState<Repository['feature_requests']>([]);
    const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
    const [generationState, setGenerationState] = useState<'idle' | 'generating' | 'result'>('idle');
    const [loadingSteps, setLoadingSteps] = useState([
        { label: 'Starting feature request analysis...', status: 'pending' },
        { label: 'Loading project/repository context...', status: 'pending' },
        { label: 'Context loaded: 1 repository(ies)', status: 'pending' },
        { label: 'Identifying affected repositories...', status: 'pending' },
        { label: 'Identified 1 affected repository(ies): msg-zen-test-ai-proxy', status: 'pending' },
        { label: 'Identifying involved files...', status: 'pending' },
        { label: 'Using feature-based approach for 126 files across 3 features...', status: 'pending' },
        { label: 'Analyzing 3 features to find relevant ones...', status: 'pending' },
    ]);

    // Code Flows State
    const [codeFlows, setCodeFlows] = useState<Repository['code_flow_requests']>([]);
    const [selectedCodeFlowId, setSelectedCodeFlowId] = useState<string | null>('1');
    const [flowAnalysisState, setFlowAnalysisState] = useState<'idle' | 'analyzing' | 'result'>('result');
    const [flowLoadingSteps, setFlowLoadingSteps] = useState([
        { label: 'Starting code flow analysis...', status: 'pending', time: '' },
        { label: 'Loading project/repository context...', status: 'pending', time: '' },
    ]);

    const handleAnalyzeCodeFlow = (title: string, description: string) => {
        setIsNewFlowOpen(false);
        setIsEditFlowOpen(false);
        setFlowAnalysisState('analyzing');

        const newId = Date.now().toString();
        const newFlow = {
            id: newId,
            title: title || 'Untitled Code Flow',
            description: description,
            date: new Date().toLocaleDateString('de-DE'),
            status: 'analyzing'
        };
        setCodeFlows(prev => [newFlow, ...prev]);
        setSelectedCodeFlowId(newId);

        // Reset and animate loading steps
        const steps = [
            { label: 'Starting code flow analysis...', status: 'pending', time: '' },
            { label: 'Loading project/repository context...', status: 'pending', time: '' },
        ];
        setFlowLoadingSteps(steps);

        let currentStep = 0;
        const interval = setInterval(() => {
            const now = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            setFlowLoadingSteps(prev => prev.map((step, index) => {
                if (index < currentStep) return { ...step, status: 'done', time: now };
                if (index === currentStep) return { ...step, status: 'active', time: now };
                return { ...step, status: 'pending', time: '' };
            }));
            currentStep++;

            if (currentStep > steps.length) {
                clearInterval(interval);
                setTimeout(() => {
                    setCodeFlows(prev => prev.map(f => f.id === newId ? { ...f, status: 'completed' } : f));
                    setFlowAnalysisState('result');
                }, 500);
            }
        }, 1200);
    };

    // Edit Code Flow State
    const [isEditFlowOpen, setIsEditFlowOpen] = useState(false);

    const handleEditCodeFlow = (newTitle: string, newDescription: string) => {
        if (!selectedCodeFlowId) return;
        setCodeFlows(prev => prev.map(f =>
            f.id === selectedCodeFlowId
                ? { ...f, title: newTitle || f.title, description: newDescription || f.description }
                : f
        ));
        setIsEditFlowOpen(false);
    };

    const handleRegenerateCodeFlow = () => {
        if (!selectedCodeFlowId) return;
        const currentFlow = codeFlows.find(f => f.id === selectedCodeFlowId);
        if (!currentFlow) return;

        setFlowAnalysisState('analyzing');
        setCodeFlows(prev => prev.map(f => f.id === selectedCodeFlowId ? { ...f, status: 'analyzing' } : f));

        // Reset and animate loading steps
        const steps = [
            { label: 'Starting code flow analysis...', status: 'pending', time: '' },
            { label: 'Loading project/repository context...', status: 'pending', time: '' },
        ];
        setFlowLoadingSteps(steps);

        let currentStep = 0;
        const interval = setInterval(() => {
            const now = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            setFlowLoadingSteps(prev => prev.map((step, index) => {
                if (index < currentStep) return { ...step, status: 'done', time: now };
                if (index === currentStep) return { ...step, status: 'active', time: now };
                return { ...step, status: 'pending', time: '' };
            }));
            currentStep++;

            if (currentStep > steps.length) {
                clearInterval(interval);
                setTimeout(() => {
                    setCodeFlows(prev => prev.map(f => f.id === selectedCodeFlowId ? { ...f, status: 'completed' } : f));
                    setFlowAnalysisState('result');
                }, 500);
            }
        }, 1200);
    };

    const handleGeneratePrompt = (title: string, description: string) => {
        setIsNewRequestOpen(false);
        setGenerationState('generating');

        let currentStep = 0;
        const interval = setInterval(() => {
            setLoadingSteps(prev => prev.map((step, index) => {
                if (index < currentStep) return { ...step, status: 'done' };
                if (index === currentStep) return { ...step, status: 'active' };
                return { ...step, status: 'pending' };
            })); // @ts-ignore
            currentStep++;

            if (currentStep > loadingSteps.length) {
                clearInterval(interval);
                setTimeout(() => {
                    const newId = Date.now().toString();
                    const newRequest = {
                        id: newId,
                        title: title || "New Feature Request",
                        description: description,
                        date: "Just now",
                        status: "Generated",
                        complexity: "medium",
                        type: "enhancement",
                        summary: "AI analysis completed. Click to view generated implementation prompt.",
                        identifiedFiles: ["src/app/api/new-feature.ts", "src/components/FeatureView.tsx"],
                        prompt: `Implementation prompt for: ${description}`
                    };
                    setFeatureRequests(prev => [newRequest, ...prev]);
                    setSelectedRequestId(newId);
                    setGenerationState('result');
                }, 800);
            }
        }, 600);
    };

    const handleSendMessage = () => {
        if (!input.trim()) return;

        if (activeChatId === null) {
            const newChatId = Date.now().toString();
            const newChat = {
                id: newChatId,
                title: input.length > 30 ? input.substring(0, 27) + "..." : input,
                text: input,
                date: new Date().toLocaleDateString('de-DE')
            };
            setChatHistory(prev => [newChat, ...prev]);
            setActiveChatId(newChatId);
        } else {
            // Just update current chat text for mock behavior
            setChatHistory(prev => prev.map(c =>
                c.id === activeChatId ? { ...c, text: input } : c
            ));
        }
    };
    const handleGenerate = () => {
        let currentStep = 0;
        setGenerationState('generating');
        const interval = setInterval(() => {
            setLoadingSteps(prev => prev.map((step, index) => {
                if (index < currentStep) return { ...step, status: 'done' };
                if (index === currentStep) return { ...step, status: 'active' };
                return { ...step, status: 'pending' };
            })); // @ts-ignore
            currentStep++;

            if (currentStep > loadingSteps.length) {
                clearInterval(interval);
                setTimeout(() => setGenerationState('result'), 500);
            }
        }, 800);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-800"></div>
            </div>
        );
    }

    if (!repo) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold text-gray-900">Repository not found</h1>
                <Link href="/repositories" className="text-red-800 hover:underline mt-4 inline-block">Back to Repositories</Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] bg-white relative">
            {/* Success Notification */}
            {showSuccess && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-6 py-3 rounded-full shadow-lg flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <div className="flex flex-col">
                            <span className="font-semibold tracking-wide text-sm text-gray-900">
                                Scan successful for <span className="text-emerald-700 font-bold italic">{repo.name}</span>! Analysis updated.
                            </span>
                            <span className="text-[10px] text-emerald-600 font-medium">Redirecting to analysis dashboard...</span>
                        </div>
                    </div>
                </div>
            )}

            {/* --- GITHUB STYLE HEADER --- */}
            <div className="bg-[#f6f8fa] border-b border-gray-200 px-8 pt-4 pb-0">
                <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
                    <Link href="/repositories" className="flex items-center hover:text-blue-600 transition-colors">
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Back to Repositories
                    </Link>
                </div>

                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-white border border-gray-200 rounded-lg shadow-sm">
                            <Github className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-semibold text-gray-900">Code Analysis: {repo.name}</h1>
                                <span className="bg-emerald-50 text-emerald-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                                    {repo.status}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-sm">
                                <p className="text-gray-500 font-medium">{repo.url}</p>
                                {repo.main_branch && (
                                    <span className="flex items-center gap-1 bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-blue-100">
                                        <GitBranch className="w-3 h-3" />
                                        {repo.main_branch}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* TABS */}
                <div className="flex items-center space-x-1 mt-4 -mb-[1px] overflow-x-auto no-scrollbar">
                    {[
                        { id: 'overview', label: 'Overview', icon: LayoutTemplate },
                        { id: 'technologies', label: 'Technologies', icon: Zap },
                        { id: 'ask-questions', label: 'Ask Questions', icon: MessageSquare },
                        { id: 'prompt-generation', label: 'Prompt Generation', icon: Sparkles },
                        { id: 'code-flows', label: 'Code Flows', icon: GitBranch },
                        { id: 'team-staffing', label: 'Team Staffing', icon: Users },
                        { id: 'code-quality', label: 'Code Quality', icon: ShieldAlert },
                        { id: 'dependencies', label: 'Dependencies', icon: GitPullRequest },
                        { id: 'security', label: 'Security', icon: Lock },
                        { id: 'pull-requests', label: 'Pull Requests', icon: GitPullRequest },
                        { id: 'feature-map', label: 'Feature Map', icon: Map },
                        { id: 'ai-features', label: 'AI Features', icon: Bot },
                    ].filter(tab => visibleTabs[tab.id] !== false).map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-t border-x rounded-t-lg whitespace-nowrap",
                                activeTab === tab.id
                                    ? "bg-white text-gray-900 border-gray-200"
                                    : "text-gray-500 border-transparent hover:bg-gray-100 hover:text-gray-900"
                            )}
                        >
                            <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-gray-900" : "text-gray-400")} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* --- CONTENT AREA --- */}
            <div className="flex-1 bg-white overflow-y-auto">
                <div className="p-8">

                    {/* 1. OVERVIEW TAB */}
                    {activeTab === "overview" && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            {/* Detailed Metrics Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="relative overflow-hidden border-none shadow-sm ring-1 ring-gray-100">
                                    <div className="absolute top-4 left-4 p-2 bg-blue-100 rounded-full text-blue-600">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <CardContent className="pt-8 text-right">
                                        <div className="text-sm text-gray-500">Total Hours spent last year (Without AI)</div>
                                        <div className="text-4xl font-bold text-gray-900 mt-1">{repo.analysis_metrics?.effort_manual_hours || 'N/A'}</div>
                                        <div className="text-xs text-gray-400 mt-1">336 working days</div>
                                    </CardContent>
                                </Card>

                                <Card className="relative overflow-hidden border-none shadow-sm ring-1 ring-gray-100">
                                    <div className="absolute top-4 left-4 p-2 bg-orange-100 rounded-full text-orange-600">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <CardContent className="pt-8 text-right">
                                        <div className="text-sm text-gray-500">Estimated Team Size (With AI)</div>
                                        <div className="text-4xl font-bold text-gray-900 mt-1">{repo.team_staffing?.length || 'N/A'}</div>
                                        <div className="text-xs text-gray-400 mt-1">AI-recommended staffing</div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Stack Complexity Analysis */}
                            <Card className="bg-gradient-to-r from-red-50 to-white border border-red-100">
                                <CardContent className="p-8">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="font-bold text-gray-900">Stack Complexity Analysis</h3>
                                        <span className="bg-red-500 text-white text-[10px] font-extrabold px-3 py-1 rounded-md uppercase tracking-wider">Score: {repo.analysis_metrics?.complexity_score || '7'}/10</span>
                                    </div>
                                    <p className="text-sm text-gray-600 leading-relaxed font-medium">
                                        {repo.overview_analysis?.stack_complexity_text || "This project utilizes a modern and comprehensive stack. The integration of various tools for linting, formatting, testing, and API generation adds to the complexity. Dockerization indicates a structured deployment approach."}
                                    </p>
                                </CardContent>
                            </Card>

                            {/* AI-Assisted Development Impact (Redesigned) */}
                            <div className="bg-white rounded-2xl border-2 border-red-100 p-8 shadow-[0_4px_20px_rgba(185,28,28,0.04)] relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-red-50/50 rounded-bl-[100px] -mr-10 -mt-10 transition-all group-hover:scale-110" />
                                <div className="flex items-start gap-6 relative">
                                    <div className="p-4 bg-red-100 rounded-2xl text-red-700 shadow-sm border border-red-200">
                                        <Bot className="w-8 h-8" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-extrabold text-gray-900 text-lg mb-2 flex items-center gap-2">
                                            AI-Assisted Development Impact
                                            <span className="text-[10px] bg-red-800 text-white px-2 py-0.5 rounded uppercase tracking-widest font-bold">New</span>
                                        </h3>
                                        <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-3xl">
                                            {repo.overview_analysis?.ai_impact_text || "Original development was likely done WITHOUT AI coding assistants. Using tools like Claude Code or GitHub Copilot for the transition could significantly reduce effort."}
                                        </p>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8 border-t border-gray-100 pt-8">
                                            <div>
                                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Standard OSS Technologies</h4>
                                                <div className="text-3xl font-extrabold text-gray-900">95%</div>
                                            </div>
                                            <div>
                                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Estimated Time Savings with AI</h4>
                                                <div className="text-3xl font-extrabold text-red-600 flex items-baseline gap-1.5">
                                                    {repo.analysis_metrics?.ai_savings_percentage || '30'}% <span className="text-sm text-red-500 font-bold tracking-tight">
                                                        (~{Math.round((repo.analysis_metrics?.effort_manual_hours || 2685) * (repo.analysis_metrics?.ai_savings_percentage || 30) / 100 / 8)} days)
                                                    </span>
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">AI-Adjusted Effort</h4>
                                                <div className="text-3xl font-extrabold text-gray-900">
                                                    {Math.round((repo.analysis_metrics?.effort_manual_hours || 2685) * (1 - (repo.analysis_metrics?.ai_savings_percentage || 30) / 100))}h
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Risk Assessment Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm ring-1 ring-gray-900/5 hover:shadow-md transition-shadow relative overflow-hidden group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">High Risk</h4>
                                            <div className="text-4xl font-extrabold text-gray-900">{repo.analysis_metrics?.high_risk_commits || 0}</div>
                                            <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">0.1% of commits</p>
                                        </div>
                                        <div className="p-3 bg-red-50 rounded-full border border-red-100">
                                            <ShieldAlert className="w-5 h-5 text-red-600" />
                                        </div>
                                    </div>
                                    <button className="text-[10px] font-bold text-red-700 uppercase tracking-widest flex items-center gap-1.5 hover:gap-2 transition-all">
                                        View commits <ChevronRight className="w-3 h-3" />
                                    </button>
                                </div>

                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm ring-1 ring-gray-900/5 hover:shadow-md transition-shadow relative overflow-hidden group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Medium Risk</h4>
                                            <div className="text-4xl font-extrabold text-gray-900">{repo.analysis_metrics?.medium_risk_commits || 0}</div>
                                            <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">24.7% of commits</p>
                                        </div>
                                        <div className="p-3 bg-orange-50 rounded-full border border-orange-100">
                                            <ShieldAlert className="w-5 h-5 text-orange-600" />
                                        </div>
                                    </div>
                                    <button className="text-[10px] font-bold text-orange-700 uppercase tracking-widest flex items-center gap-1.5 hover:gap-2 transition-all">
                                        View commits <ChevronRight className="w-3 h-3" />
                                    </button>
                                </div>

                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm ring-1 ring-gray-900/5 hover:shadow-md transition-shadow relative overflow-hidden group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Low Risk</h4>
                                            <div className="text-4xl font-extrabold text-gray-900">{repo.analysis_metrics?.low_risk_commits || 0}</div>
                                            <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">75.2% of commits</p>
                                        </div>
                                        <div className="p-3 bg-emerald-50 rounded-full border border-emerald-100">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.2)]" />
                                        </div>
                                    </div>
                                    <button className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-1.5 hover:gap-2 transition-all">
                                        View commits <ChevronRight className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>

                            {/* AI-Powered Recommendations */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm ring-1 ring-gray-900/5 p-8">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="p-2 bg-red-50 rounded-xl">
                                        <Lightbulb className="w-5 h-5 text-red-700" />
                                    </div>
                                    <h3 className="font-extrabold text-gray-900 text-lg">AI-Powered Recommendations</h3>
                                </div>
                                <div className="space-y-6">
                                    <p className="text-sm text-gray-500 font-medium">Here are 7 concise, actionable recommendations for the project transition team:</p>
                                    <ul className="space-y-4">
                                        {(repo.overview_analysis?.recommendations || [
                                            { title: "Mitigate Key Contributor Risk", text: "Prioritize comprehensive knowledge transfer from core maintainers on architecture and deployments." },
                                            { title: "Leverage AI for Unit Tests", text: "AI coding assistants can accelerate the creation of unit tests for new features." }
                                        ]).map((rec, i) => (
                                            <li key={i} className="flex gap-4 group">
                                                <div className="h-1.5 w-1.5 rounded-full bg-red-800 mt-2 shrink-0 group-hover:scale-125 transition-transform" />
                                                <p className="text-sm text-gray-600 leading-relaxed font-medium">
                                                    <strong className="text-gray-900 font-bold">{rec.title}:</strong> {rec.text}
                                                </p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Project State Badge */}
                            <div className="flex items-center gap-4 border-t border-gray-100 pt-8">
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Project State</h4>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-sky-50 border border-sky-100 rounded-lg">
                                    <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse" />
                                    <span className="text-[10px] font-extrabold text-sky-800 uppercase tracking-widest">{repo.overview_analysis?.project_state || "Active Project"}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 1.5 FEATURE MAP TAB */}
                    {activeTab === "feature-map" && (
                        <div className="flex flex-col h-full animate-in fade-in duration-300">
                            {/* Stats Header */}
                            <div className="px-8 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Features:</span>
                                    <span className="text-sm font-extrabold text-gray-900">{repo.feature_map?.nodes?.length || 0}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Connections:</span>
                                    <span className="text-sm font-extrabold text-gray-900">{repo.feature_map?.edges?.length || 0}</span>
                                </div>
                            </div>
                            <div className="flex-1 min-h-[500px] border-b border-gray-200 bg-gray-50/50">
                                <ReactFlow
                                    nodes={featureNodes}
                                    edges={featureEdges}
                                    onNodesChange={onFeatureNodesChange}
                                    onEdgesChange={onFeatureEdgesChange}
                                    fitView
                                >
                                    <Background color="#aaa" gap={16} />
                                    <Controls />
                                    <MiniMap nodeStrokeWidth={3} zoomable pannable />
                                </ReactFlow>
                            </div>
                        </div>
                    )}

                    {/* AI FEATURES TAB */}
                    {activeTab === "ai-features" && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            {aiFeatures.length === 0 && (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                                    <p className="text-sm text-muted-foreground">Loading AI analysis...</p>
                                </div>
                            )}

                            {aiFeatures.length > 0 && (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Auto-Documentation Generator */}
                                        {(() => {
                                            const feature = aiFeatures.find(f => f.type === 'documentation');
                                            return feature ? (
                                                <Card className="border-none shadow-sm ring-1 ring-gray-100">
                                                    <div className="p-6">
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <div className="p-2 bg-blue-50 rounded-lg">
                                                                <FileText className="w-5 h-5 text-blue-600" />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-bold text-gray-900">{feature.title}</h3>
                                                                <p className="text-xs text-gray-500">{feature.description}</p>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 font-mono text-xs text-gray-600">
                                                                {feature.content.example_file}
                                                            </div>
                                                            <div className="flex justify-end">
                                                                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors">
                                                                    <Sparkles className="w-3 h-3" /> Generate Docs
                                                                </button>
                                                            </div>
                                                            <div className="p-3 bg-gray-900 rounded-lg border border-gray-800 font-mono text-xs text-blue-300 overflow-x-auto">
                                                                <pre>{`/**
 * Manages user authentication sessions.
 * @param {string} token - The JWT token.
 * @returns {Promise<User>} The authenticated user.
 */
async validateSession(token: string): Promise<User> {
  // ...
}`}</pre>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ) : null;
                                        })()}

                                        {/* Code Review Suggestions */}
                                        {(() => {
                                            const feature = aiFeatures.find(f => f.type === 'review');
                                            return feature ? (
                                                <Card className="border-none shadow-sm ring-1 ring-gray-100">
                                                    <div className="p-6">
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <div className="p-2 bg-purple-50 rounded-lg">
                                                                <MessageSquare className="w-5 h-5 text-purple-600" />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-bold text-gray-900">{feature.title}</h3>
                                                                <p className="text-xs text-gray-500">{feature.description}</p>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-3">
                                                            <div className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                                <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-orange-500" />
                                                                <div>
                                                                    <p className="text-sm text-gray-800 font-medium">Issues Found: {feature.content.issues_found}</p>
                                                                    <p className="text-[10px] text-gray-500 mt-1 font-mono">Critical Severity: {feature.content.critical_severity}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ) : null;
                                        })()}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Refactoring Recommendations */}
                                        {(() => {
                                            const feature = aiFeatures.find(f => f.type === 'refactor');
                                            return feature ? (
                                                <Card className="border-none shadow-sm ring-1 ring-gray-100">
                                                    <div className="p-6">
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <div className="p-2 bg-emerald-50 rounded-lg">
                                                                <RotateCw className="w-5 h-5 text-emerald-600" />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-bold text-gray-900">{feature.title}</h3>
                                                                <p className="text-xs text-gray-500">{feature.description}</p>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <div className="p-4 bg-emerald-50/50 rounded-lg border border-emerald-100">
                                                                <h4 className="text-sm font-bold text-gray-900 mb-1">Recommendation</h4>
                                                                <p className="text-xs text-gray-600 mb-3">{feature.content.recommendation}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ) : null;
                                        })()}

                                        {/* Bug Prediction */}
                                        {(() => {
                                            const feature = aiFeatures.find(f => f.type === 'bug-prediction');
                                            return feature ? (
                                                <Card className="border-none shadow-sm ring-1 ring-gray-100">
                                                    <div className="p-6">
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <div className="p-2 bg-red-50 rounded-lg">
                                                                <ShieldAlert className="w-5 h-5 text-red-600" />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-bold text-gray-900">{feature.title}</h3>
                                                                <p className="text-xs text-gray-500">{feature.description}</p>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-3">
                                                            {feature.content.high_risk_files && feature.content.high_risk_files.map((file: string, i: number) => (
                                                                <div key={i} className="flex items-center justify-between p-3 bg-red-50/30 rounded-lg border border-red-100">
                                                                    <div>
                                                                        <div className="font-mono text-xs font-bold text-gray-800">{file}</div>
                                                                        <div className="text-[10px] text-gray-500 mt-0.5">High Risk</div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </Card>
                                            ) : null;
                                        })()}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* 1.6 PULL REQUESTS TAB */}
                    {activeTab === "pull-requests" && (
                        <div className="p-8 space-y-4 animate-in fade-in duration-300">
                            {/* Filter Bar */}
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex flex-1 items-center border border-gray-300 rounded-lg overflow-hidden h-9 shadow-sm">
                                    <button className="px-3 bg-gray-50 border-r border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 flex items-center gap-1">
                                        Filters <ChevronDown className="w-3.5 h-3.5" />
                                    </button>
                                    <div className="flex-1 relative flex items-center">
                                        <Search className="absolute left-3 w-3.5 h-3.5 text-gray-400" />
                                        <input
                                            type="text"
                                            defaultValue="is:pr is:open"
                                            className="w-full pl-9 pr-4 py-1.5 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex border border-gray-300 rounded-lg h-9 overflow-hidden shadow-sm">
                                        <button className="px-3 bg-white hover:bg-gray-50 text-sm font-semibold text-gray-700 border-r border-gray-300 flex items-center gap-1.5">
                                            <Tag className="w-4 h-4 text-gray-500" /> Labels <span className="bg-gray-100 text-gray-600 text-[10px] px-1.5 rounded-full">9</span>
                                        </button>
                                        <button className="px-3 bg-white hover:bg-gray-50 text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                                            <Trophy className="w-3.5 h-3.5 text-gray-500" /> Milestones <span className="bg-gray-100 text-gray-600 text-[10px] px-1.5 rounded-full">0</span>
                                        </button>
                                    </div>
                                    <button className="h-9 px-4 bg-[#2da44e] text-white text-sm font-semibold rounded-lg hover:bg-[#2c974b] shadow-sm transition-colors whitespace-nowrap">
                                        New pull request
                                    </button>
                                </div>
                            </div>

                            {/* PR List Container */}
                            <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
                                {/* Tab Row Header */}
                                <div className="bg-[#f6f8fa] px-4 py-2 border-b border-gray-300 flex items-center justify-between">
                                    <div className="flex items-center gap-4 text-sm font-medium text-gray-600">
                                        <div className="flex items-center gap-1 text-gray-900 font-semibold cursor-pointer">
                                            <GitPullRequest className="w-4 h-4" />
                                            <span>{(repo.pull_requests || []).filter(p => p.status === 'Open').length} Open</span>
                                        </div>
                                        <div className="flex items-center gap-1 cursor-pointer hover:text-gray-900">
                                            <Check className="w-4 h-4" />
                                            <span>{(repo.pull_requests || []).filter(p => p.status === 'Merged' || p.status === 'Closed').length} Closed</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                                        {['Author', 'Label', 'Projects', 'Milestones', 'Reviews', 'Assignee', 'Sort'].map(filter => (
                                            <div key={filter} className="flex items-center gap-0.5 cursor-pointer hover:text-gray-900 font-medium">
                                                {filter} <ChevronDown className="w-3 h-3" />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* List Body */}
                                <div className="divide-y divide-gray-200">
                                    {(repo.pull_requests || []).length > 0 ? (repo.pull_requests || []).map(pr => (
                                        <div key={pr.id} className="px-4 py-3 hover:bg-gray-50 group flex items-start gap-3">
                                            <GitPullRequest className="w-4 h-4 text-emerald-600 mt-1 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <Link href={`#`}>
                                                        <h4 className="font-bold text-gray-900 text-[15px] hover:text-blue-600 cursor-pointer">{pr.title}</h4>
                                                    </Link>
                                                    {pr.status === 'Merged' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                                                    {pr.status === 'Open' && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-50" />}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                                                    <span>#{pr.id} opened {pr.date} by {pr.author}</span>
                                                    <span className="flex items-center gap-1 ml-1 text-emerald-600 font-bold">+{pr.additions}</span>
                                                    <span className="flex items-center gap-1 text-red-600 font-bold">-{pr.deletions}</span>
                                                    <span className="text-gray-400">• {pr.files_changed} files</span>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="px-4 py-12 text-center">
                                            <GitPullRequest className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                            <p className="text-sm text-gray-500 font-medium">No pull requests found for this repository.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-center py-4 gap-2 text-xs text-gray-500 italic">
                                <Lightbulb className="w-3.5 h-3.5" />
                                <span>ProTip! Ears burning? Get @platzger mentions with <span className="text-blue-600 hover:underline cursor-pointer">mentions:platzger</span>.</span>
                            </div>
                        </div>
                    )}

                    {/* 2. TEAM STAFFING TAB */}
                    {activeTab === "team-staffing" && (
                        <div className="p-8 space-y-6 animate-in fade-in duration-300">
                            <div className="bg-sky-50 border border-sky-100 rounded-lg p-6">
                                <div className="flex items-start gap-4">
                                    <InfoIcon className="w-6 h-6 text-sky-500 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-semibold text-sky-900 text-sm mb-1">AI Recommendation Rationale</h4>
                                        <p className="text-sm text-sky-800 leading-relaxed">
                                            This highly optimized team consists of two mid-level specialists, strategically chosen to cover the project&apos;s full stack and infrastructure needs while leveraging AI coding assistants. Given the project&apos;s low complexity and minimal annual maintenance (approximately 600 hours), these roles will dedicate only a fraction of their full-time capacity to this specific project, achieving optimal resource utilization across the organization. AI tools significantly reduce the required person-hours for routine tasks, allowing mid-level talent to manage the project effectively.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm text-center">
                                    <div className="text-3xl font-bold text-sky-600 mb-1">{repo.team_staffing?.length || 0}</div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wide">Team Members</div>
                                </div>
                                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm text-center">
                                    <div className="text-3xl font-bold text-gray-900 mb-1">0.3 FTE</div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wide">Total Capacity</div>
                                </div>
                                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm text-center">
                                    <div className="text-3xl font-bold text-orange-500 mb-1">14%</div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wide">Avg Utilization</div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Recommended Post-Transition Team Composition</h3>
                                <div className="space-y-4">
                                    {(repo.team_staffing || []).map((role: any) => (
                                        <div key={role.id} className="p-6 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-700">
                                                        {role.initials}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 leading-tight">{role.title}</h4>
                                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-0.5">{role.level}</p>
                                                    </div>
                                                </div>
                                                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded">Recommended</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5 mb-4">
                                                {role.skills.map((skill: string, idx: number) => (
                                                    <span key={idx} className="bg-gray-50 text-gray-600 text-[10px] font-medium px-2 py-0.5 rounded border border-gray-100 italic">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="text-xs font-bold text-gray-900">Allocation:</span>
                                                <span className="text-xs font-medium text-gray-500">{role.fte}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 leading-relaxed border-t border-gray-50 pt-3">
                                                {role.description}
                                            </p>
                                        </div>
                                    ))}
                                    {(!repo.team_staffing || repo.team_staffing.length === 0) && (
                                        <div className="text-sm text-gray-400 italic">No staffing recommendations available.</div>
                                    )}
                                </div>
                                <div>
                                    <a href="#" className="inline-flex items-center gap-2 bg-red-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-900 transition-colors">
                                        <Users className="w-4 h-4" />
                                        <span>Match Colleagues in MSG Skill Database</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3. TECHNOLOGIES TAB */}
                    {activeTab === "technologies" && (
                        <div className="p-8 space-y-6 animate-in fade-in duration-300">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card className="shadow-sm">
                                    <CardContent className="p-6">
                                        <h3 className="font-semibold text-gray-900 mb-6">FTE Breakdown by Technology (Top 10)</h3>
                                        <div className="h-[300px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart
                                                    layout="vertical"
                                                    data={repo.tech_stack || []}
                                                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                                    <XAxis type="number" />
                                                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                                                    <Tooltip
                                                        formatter={(value: any) => [`${value} hours`, 'FTE Hours']}
                                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                    />
                                                    <Bar dataKey="fte" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="shadow-sm">
                                    <CardContent className="p-6">
                                        <h3 className="font-semibold text-gray-900 mb-6">Technology Distribution</h3>
                                        <div className="h-[300px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={repo.tech_stack || []}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={100}
                                                        paddingAngle={2}
                                                        dataKey="fte"
                                                    >
                                                        {(repo.tech_stack || []).map((entry: any, index: number) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card className="shadow-sm">
                                <CardContent className="p-6">
                                    <h3 className="font-semibold text-gray-900 mb-6">Technology Details</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                                                <tr>
                                                    <th className="px-6 py-3 font-medium">Technology</th>
                                                    <th className="px-6 py-3 font-medium text-right">FTE Hours</th>
                                                    <th className="px-6 py-3 font-medium text-right">Commits</th>
                                                    <th className="px-6 py-3 font-medium text-right">Avg Complexity</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {(repo.tech_stack || []).map((tech) => (
                                                    <tr key={tech.name} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                                                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tech.color }}></span>
                                                            {tech.name}
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-gray-600">{tech.fte.toFixed(1)}</td>
                                                        <td className="px-6 py-4 text-right text-gray-600">{tech.commits}</td>
                                                        <td className="px-6 py-4 text-right text-gray-600">{tech.complexity.toFixed(1)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )
                    }

                    {/* 4. SECURITY & BEST PRACTICES TAB */}
                    {
                        activeTab === "security" && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <Card className="border-none shadow-sm ring-1 ring-gray-100">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Vulnerabilities</p>
                                                    <div className="flex items-baseline gap-2 mt-2">
                                                        <p className="text-3xl font-bold text-gray-900">{repo.vulnerabilities?.length || 0}</p>
                                                        <span className="text-sm font-medium text-red-600">{repo.vulnerabilities?.filter(v => v.severity === 'High').length || 0} High</span>
                                                    </div>
                                                    <p className="text-xs text-gray-400 mt-1">Found in dependencies</p>
                                                </div>
                                                <div className="p-3 bg-red-50 rounded-xl">
                                                    <ShieldAlert className="w-6 h-6 text-red-600" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card className="border-none shadow-sm ring-1 ring-gray-100">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Secrets Detected</p>
                                                    <p className="text-3xl font-bold text-orange-600 mt-2">{repo.secrets?.length || 0}</p>
                                                    <p className="text-xs text-gray-400 mt-1">Hardcoded API keys</p>
                                                </div>
                                                <div className="p-3 bg-orange-50 rounded-xl">
                                                    <Lock className="w-6 h-6 text-orange-600" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card className="border-none shadow-sm ring-1 ring-gray-100">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Security Score</p>
                                                    <div className="flex items-baseline gap-1 mt-2">
                                                        <p className="text-3xl font-bold text-gray-900">{repo.security_score || "B+"}</p>
                                                        <p className="text-sm font-medium text-gray-500">
                                                            {repo.security_score?.startsWith('A') ? 'Excellent' :
                                                                repo.security_score?.startsWith('B') ? 'Good' :
                                                                    repo.security_score?.startsWith('C') ? 'Fair' : 'Needs Attention'}
                                                        </p>
                                                    </div>
                                                    <p className="text-xs text-gray-400 mt-1">Passing {repo.compliance?.filter(c => c.status === 'Pass').length || 0}/{repo.compliance?.length || 0} checks</p>
                                                </div>
                                                <div className="p-3 bg-green-50 rounded-xl">
                                                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                </div>

                                {/* Vulnerability Scanner */}
                                <Card className="border-none shadow-sm ring-1 ring-gray-100">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                                <ShieldAlert className="w-5 h-5 text-red-600" />
                                                Vulnerability Scanner
                                            </h3>
                                            <span className="text-xs font-medium text-red-700 bg-red-50 border border-red-100 px-2 py-1 rounded">{repo.vulnerabilities?.length || 0} Issues Found</span>
                                        </div>
                                        <div className="space-y-3">
                                            {(repo.vulnerabilities || []).map((vuln: any, i: number) => (
                                                <div key={i} className="flex items-start justify-between p-4 bg-white border border-gray-100 rounded-lg shadow-sm">
                                                    <div className="flex gap-4">
                                                        <div className={cn(
                                                            "w-1.5 h-1.5 mt-2 rounded-full shrink-0",
                                                            vuln.severity === 'High' ? "bg-red-600" :
                                                                vuln.severity === 'Medium' ? "bg-orange-500" : "bg-blue-500"
                                                        )}></div>
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="font-bold text-gray-900">{vuln.id}</span>
                                                                <span className={cn(
                                                                    "text-[10px] font-bold uppercase px-2 py-0.5 rounded",
                                                                    vuln.severity === 'High' ? "bg-red-100 text-red-700" :
                                                                        vuln.severity === 'Medium' ? "bg-orange-100 text-orange-700" :
                                                                            "bg-blue-100 text-blue-700"
                                                                )}>{vuln.severity}</span>
                                                                <span className="text-sm font-medium text-gray-500">in {vuln.package}@{vuln.version}</span>
                                                            </div>
                                                            <p className="text-sm text-gray-600 leading-relaxed">{vuln.description}</p>
                                                        </div>
                                                    </div>
                                                    <button className="px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-lg hover:bg-black transition-colors">
                                                        Auto-Fix
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Secret Detection */}
                                    <Card className="border-none shadow-sm ring-1 ring-gray-100">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                                    <Lock className="w-5 h-5 text-orange-600" />
                                                    Secret Detection
                                                </h3>
                                            </div>
                                            <div className="space-y-2">
                                                {(repo.secrets || []).map((secret, i) => (
                                                    <div key={i} className="p-3 bg-orange-50 border border-orange-100 rounded-lg">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-xs font-bold text-orange-800 uppercase">{secret.type}</span>
                                                            <span className="text-xs text-orange-600 font-mono">{secret.file}:{secret.line}</span>
                                                        </div>
                                                        <div className="bg-white p-2 rounded border border-orange-100 text-xs font-mono text-gray-500 break-all">
                                                            {secret.snippet}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Compliance Checklist */}
                                    <Card className="border-none shadow-sm ring-1 ring-gray-100">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                                    Best Practices
                                                </h3>
                                                <span className="text-xs font-medium text-gray-500">{repo.compliance?.filter(c => c.status === 'Pass').length || 0}/{repo.compliance?.length || 0} Passed</span>
                                            </div>
                                            <div className="space-y-3">
                                                {(repo.compliance || []).map((check, i) => (
                                                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                                        <span className="text-sm font-medium text-gray-700">{check.label}</span>
                                                        {check.status === 'Pass' ? (
                                                            <div className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                                                                <Check className="w-3 h-3" /> Pass
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                                                <X className="w-3 h-3" /> Fail
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        )
                    }


                    {/* CODE QUALITY TAB */}
                    {
                        activeTab === "code-quality" && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <Card className="border-none shadow-sm ring-1 ring-gray-100">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Dead Code</p>
                                                    <p className="text-2xl font-bold text-amber-600 mt-1">{repo.dead_code?.length || 0} items</p>
                                                </div>
                                                <div className="p-3 bg-amber-50 rounded-xl">
                                                    <Trash2 className="w-5 h-5 text-amber-500" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-none shadow-sm ring-1 ring-gray-100">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Code Duplication</p>
                                                    <p className="text-2xl font-bold text-orange-600 mt-1">
                                                        {repo.duplication_blocks?.reduce((acc, block) => acc + block.similarity, 0) ?
                                                            (repo.duplication_blocks.reduce((acc, block) => acc + block.similarity, 0) / repo.duplication_blocks.length).toFixed(1) : "0"}%
                                                    </p>
                                                </div>
                                                <div className="p-3 bg-orange-50 rounded-xl">
                                                    <Copy className="w-5 h-5 text-orange-500" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-none shadow-sm ring-1 ring-gray-100">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Complexity</p>
                                                    <p className="text-2xl font-bold text-blue-600 mt-1">
                                                        {repo.analysis_metrics?.complexity_score ? (repo.analysis_metrics.complexity_score / 2).toFixed(1) : "0"} / 5
                                                    </p>
                                                </div>
                                                <div className="p-3 bg-blue-50 rounded-xl">
                                                    <Activity className="w-5 h-5 text-blue-500" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-none shadow-sm ring-1 ring-gray-100">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Test Coverage</p>
                                                    <p className="text-2xl font-bold text-emerald-600 mt-1">{repo.test_coverage?.total || 0}%</p>
                                                </div>
                                                <div className="p-3 bg-emerald-50 rounded-xl">
                                                    <ShieldAlert className="w-5 h-5 text-emerald-500" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Dead Code Detection Section */}
                                <Card className="border-none shadow-sm ring-1 ring-gray-100">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                                <Trash2 className="w-5 h-5 text-amber-500" />
                                                Dead Code Detection
                                            </h3>
                                            <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded">{repo.dead_code?.length || 0} unused items found</span>
                                        </div>
                                        <div className="space-y-2">
                                            {(repo.dead_code || []).map((item, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-amber-50 transition-colors group">
                                                    <div className="flex items-center gap-3">
                                                        <span className={cn(
                                                            "text-[10px] font-bold uppercase px-2 py-0.5 rounded",
                                                            item.type === 'function' && "bg-purple-100 text-purple-700",
                                                            item.type === 'variable' && "bg-blue-100 text-blue-700",
                                                            item.type === 'import' && "bg-gray-200 text-gray-700"
                                                        )}>
                                                            {item.type}
                                                        </span>
                                                        <code className="text-sm font-medium text-gray-800">{item.name}</code>
                                                        <span className="text-xs text-gray-400">{item.file}:{item.line}</span>
                                                    </div>
                                                    <button className="text-xs font-medium text-red-600 opacity-0 group-hover:opacity-100 transition-opacity hover:underline">
                                                        Remove
                                                    </button>
                                                </div>
                                            ))}
                                            {(!repo.dead_code || repo.dead_code.length === 0) && (
                                                <div className="text-sm text-gray-400 italic">No dead code detected.</div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Code Duplication Section */}
                                <Card className="border-none shadow-sm ring-1 ring-gray-100">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                                <Copy className="w-5 h-5 text-orange-500" />
                                                Code Duplication Finder
                                            </h3>
                                            <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded">{repo.duplication_blocks?.length || 0} similar blocks found</span>
                                        </div>
                                        <div className="space-y-4">
                                            {(repo?.duplication_blocks || []).map((block, i) => (
                                                <div key={i} className="p-4 border border-orange-100 rounded-lg bg-orange-50/30">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm font-bold text-orange-700">{block.similarity}% Similar</span>
                                                        <span className="text-xs text-gray-500">{block.lines} lines</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        {block.files.map((file, j) => (
                                                            <div key={j} className="text-xs text-gray-600 font-mono bg-white px-2 py-1 rounded">{file}</div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                            {(!repo?.duplication_blocks || repo?.duplication_blocks.length === 0) && (
                                                <div className="text-sm text-gray-400 italic">No significant code duplication found.</div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Cyclomatic Complexity Chart */}
                                <Card className="border-none shadow-sm ring-1 ring-gray-100">
                                    <CardContent className="p-6">
                                        <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                                            <Activity className="w-5 h-5 text-blue-500" />
                                            Cyclomatic Complexity by File
                                        </h3>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart
                                                    data={repo?.complexity_by_file || []}
                                                    layout="vertical"
                                                    margin={{ left: 100 }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                                    <XAxis type="number" domain={[0, 5]} tickCount={6} />
                                                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} />
                                                    <Tooltip />
                                                    <Bar dataKey="complexity" radius={[0, 4, 4, 0]}>
                                                        {(repo?.complexity_by_file || []).map((entry, index) => (
                                                            <Cell
                                                                key={`cell-${index}`}
                                                                fill={entry.complexity > 3.5 ? '#f59e0b' : entry.complexity > 2.5 ? '#3b82f6' : '#22c55e'}
                                                            />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="flex items-center justify-center gap-6 mt-4 text-xs">
                                            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500"></span> Low (&lt;2.5)</div>
                                            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-500"></span> Medium (2.5-3.5)</div>
                                            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500"></span> High (&gt;3.5)</div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Test Coverage Dashboard */}
                                <Card className="border-none shadow-sm ring-1 ring-gray-100">
                                    <CardContent className="p-6">
                                        <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                                            <ShieldAlert className="w-5 h-5 text-emerald-500" />
                                            Test Coverage Dashboard
                                        </h3>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Donut Chart */}
                                            <div className="h-48">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={[
                                                                { name: 'Covered', value: repo?.test_coverage?.total || 0, fill: '#22c55e' },
                                                                { name: 'Uncovered', value: 100 - (repo?.test_coverage?.total || 0), fill: '#e5e7eb' },
                                                            ]}
                                                            innerRadius={50}
                                                            outerRadius={70}
                                                            dataKey="value"
                                                            startAngle={90}
                                                            endAngle={-270}
                                                        >
                                                        </Pie>
                                                        <Legend />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>

                                            {/* Coverage by Folder */}
                                            <div className="space-y-2">
                                                {(repo?.test_coverage?.by_folder || []).map((item, i) => (
                                                    <div key={i} className="flex items-center gap-3">
                                                        <FolderOpen className="w-4 h-4 text-gray-400 shrink-0" />
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between text-sm mb-1">
                                                                <span className="font-medium text-gray-700">{item.folder}</span>
                                                                <span className={cn(
                                                                    "font-bold",
                                                                    item.coverage >= 80 ? "text-emerald-600" : item.coverage >= 50 ? "text-amber-600" : "text-red-600"
                                                                )}>{item.coverage}%</span>
                                                            </div>
                                                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className={cn(
                                                                        "h-full rounded-full transition-all",
                                                                        item.coverage >= 80 ? "bg-emerald-500" : item.coverage >= 50 ? "bg-amber-500" : "bg-red-500"
                                                                    )}
                                                                    style={{ width: `${item.coverage}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <span className="text-xs text-gray-400 shrink-0">{item.files} files</span>
                                                    </div>
                                                ))}
                                                {(!repo?.test_coverage?.by_folder || repo?.test_coverage?.by_folder.length === 0) && (
                                                    <div className="text-sm text-gray-400 italic">No folder-level coverage data available.</div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )
                    }


                    {/* DEPENDENCIES TAB */}
                    {
                        activeTab === "dependencies" && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <Card className="border-none shadow-sm ring-1 ring-gray-100">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Packages</p>
                                                    <p className="text-3xl font-bold text-gray-900 mt-2">{repo.dependency_stats?.total || 0}</p>
                                                    <p className="text-xs text-gray-400 mt-1">{repo.dependency_stats?.internal || 0} internal, {repo.dependency_stats?.external || 0} external</p>
                                                </div>
                                                <div className="p-3 bg-blue-50 rounded-xl">
                                                    <FolderOpen className="w-6 h-6 text-blue-600" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card className="border-none shadow-sm ring-1 ring-gray-100">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Circular Dependencies</p>
                                                    <p className={cn("text-3xl font-bold mt-2", (repo.dependency_stats?.circular || 0) > 0 ? "text-red-600" : "text-emerald-600")}>
                                                        {repo.dependency_stats?.circular || 0}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">{(repo.dependency_stats?.circular || 0) > 0 ? "Requires attention" : "No issues detected"}</p>
                                                </div>
                                                <div className="p-3 bg-red-50 rounded-xl">
                                                    <RotateCw className="w-6 h-6 text-red-600" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card className="border-none shadow-sm ring-1 ring-gray-100">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">External vs Internal</p>
                                                    <div className="flex items-baseline gap-1 mt-2">
                                                        <p className="text-3xl font-bold text-gray-900">
                                                            {repo.dependency_stats?.total ? Math.round((repo.dependency_stats.external / repo.dependency_stats.total) * 100) : 0}%
                                                        </p>
                                                        <p className="text-sm font-medium text-gray-500">External</p>
                                                    </div>
                                                    <p className="text-xs text-gray-400 mt-1">Healthy ratio</p>
                                                </div>
                                                <div className="p-3 bg-green-50 rounded-xl">
                                                    <Activity className="w-6 h-6 text-green-600" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Dependency Graph */}
                                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden h-[500px] flex flex-col">
                                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                        <div>
                                            <h3 className="font-bold text-gray-900">Module Dependency Graph</h3>
                                            <p className="text-xs text-gray-500">Visualizing high-level module interactions</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="flex items-center gap-1.5 px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600 font-medium">
                                                <div className="w-2 h-2 rounded-full bg-blue-500"></div> Module
                                            </span>
                                            <span className="flex items-center gap-1.5 px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600 font-medium">
                                                <div className="w-2 h-2 rounded-full bg-indigo-500"></div> Service
                                            </span>
                                            <span className="flex items-center gap-1.5 px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600 font-medium">
                                                <div className="w-2 h-2 rounded-full bg-gray-500"></div> Utility
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex-1 bg-gray-50">
                                        <ReactFlow
                                            defaultNodes={repo.dependency_graph?.nodes || [
                                                { id: 'd1', position: { x: 250, y: 0 }, data: { label: 'App.tsx' }, style: { background: '#fff', border: '1px solid #94a3b8', width: 140, borderRadius: 8, fontSize: 12, fontWeight: 600 } },
                                                { id: 'd2', position: { x: 100, y: 100 }, data: { label: 'AuthContext' }, style: { background: '#eff6ff', border: '1px solid #3b82f6', width: 140, borderRadius: 8, fontSize: 12 } }
                                            ]}
                                            defaultEdges={repo.dependency_graph?.edges || [
                                                { id: 'e1-2', source: 'd1', target: 'd2', animated: true }
                                            ]}
                                            fitView
                                            attributionPosition="bottom-right"
                                        >
                                            <Background color="#ccc" gap={20} />
                                            <Controls />
                                            <MiniMap style={{ height: 100 }} zoomable pannable />
                                        </ReactFlow>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Circular Dependencies */}
                                    <Card className="border-none shadow-sm ring-1 ring-gray-100">
                                        <CardContent className="p-6">
                                            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                                                <RotateCw className="w-5 h-5 text-red-600" />
                                                Circular Dependency Detection
                                            </h3>
                                            <div className="space-y-3">
                                                {(repo.circular_dependencies || []).length === 0 && (
                                                    <div className="text-center py-8 bg-emerald-50 rounded-lg border border-emerald-100">
                                                        <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                                                        <p className="text-sm font-medium text-emerald-800">No circular dependencies found!</p>
                                                    </div>
                                                )}
                                                {(repo.circular_dependencies || []).map((circ, i) => (
                                                    <div key={i} className="p-3 bg-red-50 border border-red-100 rounded-lg">
                                                        <div className="flex items-center gap-2 mb-2 text-red-800 text-sm font-bold">
                                                            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                                                            {circ.files.join(' ↔ ')}
                                                        </div>
                                                        <p className="text-xs text-red-600 mb-3 ml-4 leading-relaxed">
                                                            {circ.description}
                                                        </p>
                                                        <div className="ml-4 space-y-1">
                                                            {circ.files.map((file, j) => (
                                                                <div key={j} className="flex items-center gap-2 text-xs text-gray-600 bg-white px-2 py-1 rounded border border-red-100">
                                                                    <FileText className="w-3 h-3" /> {file}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Import/Export Analysis */}
                                    <Card className="border-none shadow-sm ring-1 ring-gray-100">
                                        <CardContent className="p-6">
                                            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                                                <GitPullRequest className="w-5 h-5 text-gray-700" />
                                                Import/Export Analysis
                                            </h3>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm text-left">
                                                    <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                                                        <tr>
                                                            <th className="px-4 py-2 rounded-l-lg">Module</th>
                                                            <th className="px-4 py-2">Exports</th>
                                                            <th className="px-4 py-2">Used By</th>
                                                            <th className="px-4 py-2 rounded-r-lg text-right">Maturity</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {(repo.import_export_analysis || [
                                                            { name: 'Loading...', exports: 0, usedBy: 0, maturity: 'Low' }
                                                        ]).map((row, i) => (
                                                            <tr key={i} className="hover:bg-gray-50">
                                                                <td className="px-4 py-3 font-medium text-gray-800">{row.name}</td>
                                                                <td className="px-4 py-3 text-gray-600">{row.exports}</td>
                                                                <td className="px-4 py-3 text-gray-600">{row.usedBy} files</td>
                                                                <td className="px-4 py-3 text-right">
                                                                    <span className={cn(
                                                                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                                                        row.maturity === 'High' ? "bg-green-100 text-green-700" :
                                                                            row.maturity === 'Med' ? "bg-blue-100 text-blue-700" :
                                                                                "bg-gray-100 text-gray-700"
                                                                    )}>{row.maturity}</span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        )
                    }


                    {/* 5. ASK QUESTIONS TAB */}
                    {
                        activeTab === "ask-questions" && (
                            <div className="flex h-full min-h-0">
                                <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full bg-[#fcfcfc]">
                                    <div className="p-4">
                                        <button
                                            onClick={handleNewChat}
                                            className="w-full flex items-center justify-center gap-2 bg-red-800 text-white py-2.5 rounded-lg font-medium hover:bg-red-900 transition-colors shadow-sm"
                                        >
                                            <Plus className="w-5 h-5" />
                                            New Chat
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto px-2 pb-4">
                                        <div className="space-y-1">
                                            {chatHistory.map((chat) => (
                                                <div
                                                    key={chat.id}
                                                    onClick={() => handleChatClick(chat)}
                                                    className={cn(
                                                        "flex justify-between items-start p-3 rounded-lg group cursor-pointer transition-all border",
                                                        activeChatId === chat.id
                                                            ? "bg-red-50/50 border-red-100 ring-1 ring-red-100"
                                                            : "bg-white border-transparent hover:bg-gray-50 hover:border-gray-100"
                                                    )}
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className={cn(
                                                            "text-sm font-medium truncate mb-1",
                                                            activeChatId === chat.id ? "text-red-900" : "text-gray-700"
                                                        )}>
                                                            {chat.title}
                                                        </h4>
                                                        <p className="text-[10px] text-gray-400 font-medium">{chat.date}</p>
                                                    </div>
                                                    <button
                                                        onClick={(e) => handleDeleteChat(e, chat.id)}
                                                        className="text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-all p-1"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col h-full relative bg-[#fdfdfd]">
                                    <div className="h-14 border-b border-gray-200 bg-white flex items-center px-6 shrink-0 shadow-sm z-10">
                                        <History className="w-5 h-5 text-gray-400 mr-2" />
                                        <span className="font-bold text-gray-900">
                                            {activeChatId ? chatHistory.find(c => c.id === activeChatId)?.title : "New Chat"}
                                        </span>
                                    </div>

                                    <div className="flex-1 overflow-y-auto w-full">
                                        {chatState === 'idle' && (
                                            <div className="h-full flex flex-col items-center justify-center p-8 bg-[#fdfdfd]">
                                                <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-6 text-gray-200">
                                                    <MessageSquare className="w-10 h-10" />
                                                </div>
                                                <h3 className="text-lg font-bold text-gray-400 mb-2">Ready to ask questions?</h3>
                                                <p className="text-gray-400 text-sm font-medium">Select a chat or create a new one to get started.</p>
                                            </div>
                                        )}

                                        {chatState === 'new' && (
                                            <div className="min-h-full p-8 flex flex-col items-center justify-center text-center max-w-5xl mx-auto w-full animate-in fade-in duration-500">
                                                <div className="mb-10">
                                                    <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-600">
                                                        <Bot className="w-10 h-10" />
                                                    </div>
                                                    <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">
                                                        Hello! I&apos;m here to help you understand the <span className="text-red-700 font-mono italic">msg-zen-test-ai-proxy</span> repository.
                                                    </h2>
                                                    <p className="text-gray-500 text-lg">Ask me anything about the codebase</p>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                                                    {[
                                                        "What is the main purpose of this codebase?",
                                                        "What are the key features of this application?",
                                                        "What technologies are used in this project?",
                                                        "Can you explain the folder structure?",
                                                        "What are the main entry points?",
                                                        "Are there any patterns or conventions used?"
                                                    ].map((question, i) => (
                                                        <button
                                                            key={i}
                                                            className="flex items-start text-left gap-3 p-5 bg-white border border-gray-200 rounded-xl hover:border-red-300 hover:shadow-md transition-all group scale-100 active:scale-[0.98]"
                                                            onClick={() => setInput(question)}
                                                        >
                                                            <Lightbulb className="w-5 h-5 text-red-600 shrink-0 group-hover:text-red-700 transition-colors" />
                                                            <span className="text-sm text-gray-700 font-semibold group-hover:text-gray-900">{question}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {chatState === 'viewing' && activeChatId && (
                                            <div className="p-8 max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm ring-1 ring-gray-900/5">
                                                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-50">
                                                        <div className="w-8 h-8 rounded-full bg-red-800 text-white flex items-center justify-center font-bold text-xs uppercase">
                                                            {repo.username?.[0] || 'U'}
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-bold text-gray-900 mb-0.5">{repo.username}</h4>
                                                            <p className="text-[10px] text-gray-400 font-medium">Chat started on {chatHistory.find(c => c.id === activeChatId)?.date}</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-gray-800 leading-relaxed font-medium">
                                                        {chatHistory.find(c => c.id === activeChatId)?.text}
                                                    </p>
                                                </div>

                                                <div className="mt-8 flex justify-center">
                                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                                        <Sparkles className="w-3 h-3 text-red-600" />
                                                        AI analysis active
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-6 bg-white border-t border-gray-200">
                                        <div className="max-w-4xl mx-auto relative">
                                            <input
                                                type="text"
                                                placeholder="Ask about the codebase"
                                                className="w-full pl-6 pr-14 py-4 rounded-xl border-2 border-gray-200 focus:border-red-600 focus:ring-0 outline-none text-gray-900 shadow-sm transition-colors text-lg"
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                            />
                                            <button
                                                onClick={handleSendMessage}
                                                className="absolute right-3 top-3 p-2 bg-transparent text-gray-400 hover:text-red-600 transition-colors"
                                                disabled={!input.trim()}
                                            >
                                                <Send className="w-6 h-6" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    {/* 6. PROMPT GENERATION TAB */}
                    {
                        activeTab === "prompt-generation" && (
                            <div className="flex h-full overflow-hidden bg-[#f8f9fa]">
                                {/* Feature Requests Sidebar */}
                                <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full shrink-0">
                                    <div className="p-4 border-b border-gray-100">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="p-1.5 bg-red-50 rounded-lg">
                                                <Sparkles className="w-4 h-4 text-red-600" />
                                            </div>
                                            <h3 className="font-bold text-gray-900 text-sm">Feature Requests</h3>
                                        </div>
                                        <Dialog.Root open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen}>
                                            <Dialog.Trigger asChild>
                                                <button className="w-full flex items-center justify-center gap-2 bg-red-800 text-white py-2.5 rounded-lg font-bold hover:bg-red-900 transition-all shadow-sm text-sm">
                                                    <Plus className="w-4 h-4 stroke-[3px]" />
                                                    New Feature Request
                                                </button>
                                            </Dialog.Trigger>
                                            <Dialog.Portal>
                                                <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
                                                <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl w-[640px] max-w-[95vw] z-[101] overflow-hidden border border-gray-100">
                                                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
                                                                <Sparkles className="w-5 h-5 text-red-600" />
                                                            </div>
                                                            <Dialog.Title className="text-lg font-bold text-gray-900">New Feature Request</Dialog.Title>
                                                        </div>
                                                        <Dialog.Close asChild>
                                                            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors">
                                                                <X className="w-5 h-5" />
                                                            </button>
                                                        </Dialog.Close>
                                                    </div>

                                                    <div className="p-8 space-y-6">
                                                        <p className="text-sm text-gray-500 leading-relaxed font-medium">
                                                            Describe a feature or bug fix. AI will analyze your request and generate an implementation prompt with relevant codebase context.
                                                        </p>

                                                        <div className="space-y-4">
                                                            <input
                                                                id="new-feature-title"
                                                                type="text"
                                                                placeholder="Title (optional)"
                                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400"
                                                            />

                                                            <div className="flex flex-col gap-1.5">
                                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Feature Request Description</label>
                                                                <div className="border border-red-800 rounded-2xl overflow-hidden shadow-sm ring-1 ring-red-800/20">
                                                                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-4">
                                                                        <div className="flex items-center gap-3 border-r border-gray-200 pr-4">
                                                                            <button className="p-1 text-gray-400 hover:text-gray-600 font-bold text-sm">B</button>
                                                                            <button className="p-1 text-gray-400 hover:text-gray-600 font-italic text-sm italic">I</button>
                                                                            <button className="p-1 text-gray-400 hover:text-gray-600">
                                                                                <code className="text-xs font-bold">&lt;/&gt;</code>
                                                                            </button>
                                                                        </div>
                                                                        <div className="flex items-center gap-3 border-r border-gray-200 pr-4">
                                                                            <List className="w-4 h-4 text-gray-400" />
                                                                            <ListOrdered className="w-4 h-4 text-gray-400" />
                                                                        </div>
                                                                        <ImageIcon className="w-4 h-4 text-gray-400" />
                                                                        <div className="ml-auto flex items-center gap-2">
                                                                            <Undo2 className="w-4 h-4 text-gray-300" />
                                                                            <Redo2 className="w-4 h-4 text-gray-300" />
                                                                        </div>
                                                                    </div>
                                                                    <textarea
                                                                        id="new-feature-desc"
                                                                        className="w-full min-h-[180px] p-4 bg-white outline-none resize-none text-gray-700 font-medium placeholder:text-gray-300"
                                                                        placeholder="Describe what you want to implement... You can paste or drag images here."
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-5 items-center">
                                                                <input
                                                                    type="checkbox"
                                                                    className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-600"
                                                                />
                                                            </div>
                                                            <div className="text-sm leading-6">
                                                                <label className="font-bold text-gray-700 flex items-center gap-2">
                                                                    <Sparkles className="w-3.5 h-3.5 text-gray-400" />
                                                                    Solution Design Mode
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-3">
                                                        <Dialog.Close asChild>
                                                            <button className="px-5 py-2.5 text-red-800 font-bold text-sm hover:bg-red-50 rounded-xl transition-colors">
                                                                Cancel
                                                            </button>
                                                        </Dialog.Close>
                                                        <button
                                                            onClick={() => {
                                                                const title = (document.getElementById('new-feature-title') as HTMLInputElement)?.value;
                                                                const desc = (document.getElementById('new-feature-desc') as HTMLTextAreaElement)?.value;
                                                                handleGeneratePrompt(title, desc);
                                                            }}
                                                            className="px-6 py-2.5 bg-red-800 hover:bg-red-900 text-white font-bold rounded-xl transition-all flex items-center gap-2"
                                                        >
                                                            <Sparkles className="w-4 h-4" />
                                                            Generate Prompt
                                                        </button>
                                                    </div>
                                                </Dialog.Content>
                                            </Dialog.Portal>
                                        </Dialog.Root>
                                    </div>
                                    <div className="flex-1 overflow-y-auto px-2 py-4 space-y-1 bg-[#fcfcfc]">
                                        {featureRequests.map((req) => (
                                            <div
                                                key={req.id}
                                                onClick={() => {
                                                    setSelectedRequestId(req.id);
                                                    setGenerationState('result');
                                                }}
                                                className={cn(
                                                    "p-4 rounded-xl border-2 transition-all cursor-pointer group",
                                                    selectedRequestId === req.id
                                                        ? "bg-red-50/30 border-red-100 shadow-sm"
                                                        : "bg-white border-transparent hover:border-gray-100 hover:bg-gray-50/50"
                                                )}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className={cn(
                                                        "text-sm font-bold truncate pr-6",
                                                        selectedRequestId === req.id ? "text-gray-900" : "text-gray-700 group-hover:text-gray-900"
                                                    )}>
                                                        {req.title}
                                                    </h4>
                                                    <button className="text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-all">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                                <p className="text-[10px] text-gray-400 font-bold mb-3">{req.date}</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{req.status}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Main Content Area */}
                                <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
                                    <div className="h-full overflow-y-auto">
                                        {generationState === 'idle' && (
                                            <div className="h-full flex flex-col items-center justify-center p-8 bg-[#fdfdfd]">
                                                <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-6 text-gray-200">
                                                    <Sparkles className="w-10 h-10" />
                                                </div>
                                                <h3 className="text-lg font-bold text-gray-400 mb-2">Ready to generate prompts?</h3>
                                                <p className="text-gray-400 text-sm font-medium">Select a request or create a new one to generate a prompt.</p>
                                            </div>
                                        )}

                                        {generationState === 'generating' && (
                                            <div className="h-full flex flex-col items-center justify-center bg-white">
                                                <div className="w-full max-w-xl mx-auto p-12 bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-gray-900/5">
                                                    <div className="flex items-center gap-4 mb-10 pb-6 border-b border-gray-50">
                                                        <div className="relative">
                                                            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
                                                                <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-bold text-red-800">Analyzing feature request...</h3>
                                                            <p className="text-xs text-gray-400 font-bold mt-0.5">ESTIMATED TIME: 12S</p>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4">
                                                        {loadingSteps.map((step, i) => (
                                                            <div
                                                                key={i}
                                                                className={cn(
                                                                    "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-500 bg-gray-50/50",
                                                                    step.status === 'pending' ? "opacity-30 blur-[0.5px]" : "opacity-100 shadow-sm border border-white"
                                                                )}
                                                            >
                                                                <div className="relative shrink-0">
                                                                    {step.status === 'done' ? (
                                                                        <div className="w-5 h-5 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100">
                                                                            <Check className="w-3 h-3 text-emerald-600 stroke-[3px]" />
                                                                        </div>
                                                                    ) : step.status === 'active' ? (
                                                                        <div className="w-5 h-5 flex items-center justify-center">
                                                                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin shadow-[0_0_8px_rgba(185,28,28,0.2)]" />
                                                                        </div>
                                                                    ) : (
                                                                        <div className="w-5 h-5 flex items-center justify-center">
                                                                            <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <span className={cn(
                                                                    "text-[13px] font-semibold tracking-tight",
                                                                    step.status === 'active' ? "text-gray-900" : "text-gray-500"
                                                                )}>
                                                                    {step.label}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {generationState === 'result' && selectedRequestId && (
                                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 h-full flex flex-col">
                                                <div className="p-8 border-b border-gray-100 flex items-center justify-between shrink-0 bg-[#fdfdfd]">
                                                    <div>
                                                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                                                            {featureRequests.find(r => r.id === selectedRequestId)?.title}
                                                        </h2>
                                                        <div className="flex items-center gap-3 mt-1.5">
                                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                                Created {featureRequests.find(r => r.id === selectedRequestId)?.date}
                                                            </span>
                                                            <div className="h-3 w-px bg-gray-200" />
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Analysis Ready</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm font-bold transition-all shadow-sm">
                                                            <Edit3 className="w-4 h-4" /> Edit
                                                        </button>
                                                        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm font-bold transition-all shadow-sm">
                                                            <RotateCw className="w-4 h-4" /> Regenerate
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                                                    {/* Analysis Overview */}
                                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm ring-1 ring-gray-900/5 overflow-hidden">
                                                        <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                                                            <h3 className="font-bold text-gray-900">Original Request & Analysis</h3>
                                                            <div className="flex gap-2">
                                                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase rounded-md border border-emerald-100">
                                                                    {featureRequests.find(r => r.id === selectedRequestId)?.complexity || 'low'}
                                                                </span>
                                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded-md border border-gray-200">
                                                                    {featureRequests.find(r => r.id === selectedRequestId)?.type || 'enhancement'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="p-8 space-y-8">
                                                            <div>
                                                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Original Request</h4>
                                                                <p className="text-sm text-gray-800 leading-relaxed font-medium bg-gray-50/50 p-4 rounded-xl border border-gray-100/50 italic">
                                                                    &quot;{featureRequests.find(r => r.id === selectedRequestId)?.description}&quot;
                                                                </p>
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                                                <div>
                                                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Type</h4>
                                                                    <div className="flex items-center gap-2 text-sm text-gray-700 font-bold capitalize">
                                                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                                        {featureRequests.find(r => r.id === selectedRequestId)?.type}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Complexity</h4>
                                                                    <div className="flex items-center gap-2 text-sm text-gray-700 font-bold capitalize">
                                                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                                        {featureRequests.find(r => r.id === selectedRequestId)?.complexity}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Summary</h4>
                                                                <p className="text-sm text-gray-700 leading-relaxed font-medium">
                                                                    {featureRequests.find(r => r.id === selectedRequestId)?.summary || "AI analysis of the request flow..."}
                                                                </p>
                                                            </div>

                                                            <div>
                                                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Identified Files</h4>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {featureRequests.find(r => r.id === selectedRequestId)?.identifiedFiles?.map((file, idx) => (
                                                                        <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-default">
                                                                            <FileText className="w-3.5 h-3.5 text-gray-400" />
                                                                            {file}
                                                                        </div>
                                                                    ))}
                                                                    <div className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-bold border border-red-100">
                                                                        +8 more
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Implementation Prompt */}
                                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm ring-1 ring-gray-900/5 overflow-hidden">
                                                        <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                                                            <h3 className="font-bold text-gray-900">Generated Implementation Prompt</h3>
                                                            <div className="flex gap-2">
                                                                <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-100 text-[10px] font-bold transition-all shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                                                                    <Copy className="w-3 h-3" /> Copy
                                                                </button>
                                                                <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-100 text-[10px] font-bold transition-all shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                                                                    <Download className="w-3 h-3" /> Download
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="p-10 font-sans">
                                                            <h2 className="text-4xl font-extrabold text-gray-900 mb-8 border-b border-gray-100 pb-6 tracking-tight">
                                                                Business Requirements & Clarifications
                                                            </h2>
                                                            <div className="text-sm text-gray-600 leading-relaxed font-medium space-y-6">
                                                                <p>The following clarifications were provided during the requirements gathering phase:</p>

                                                                <div className="space-y-4">
                                                                    <h4 className="text-xl font-bold text-gray-900">What specific &apos;Run ID&apos; should be displayed to make scenarios distinguishable?</h4>
                                                                    <p className="pl-4 border-l-4 border-red-800 bg-red-50/10 py-2">
                                                                        <strong>Context:</strong> The current <code className="text-red-700 bg-red-50 px-1 rounded">RunRequestDto</code> likely already contains a unique technical <code className="italic">id</code> (e.g., a UUID). Clarifying whether this existing id should be used or if a new, more user-friendly identifier is required will determine the scope of work...
                                                                    </p>
                                                                </div>

                                                                <div className="space-y-4">
                                                                    <h4 className="text-xl font-bold text-gray-900">Should the Run ID be editable by the user?</h4>
                                                                    <p className="pl-4 border-l-4 border-red-800 bg-red-50/10 py-2">
                                                                        <strong>Perspective:</strong> Allowing users to assign their own descriptive IDs might further improve distinguishability. However, if IDs must remain immutable and unique...
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    {/* 7. CODE FLOWS TAB */}
                    {
                        activeTab === "code-flows" && (
                            <div className="flex h-full overflow-hidden bg-[#f8f9fa]">
                                {/* Sidebar */}
                                <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full shrink-0">
                                    <div className="p-4 border-b border-gray-100">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="p-1.5 bg-red-50 rounded-lg">
                                                <GitBranch className="w-4 h-4 text-red-600" />
                                            </div>
                                            <h3 className="font-bold text-gray-900 text-sm">Code Flow Graphs</h3>
                                        </div>
                                        <Dialog.Root open={isNewFlowOpen} onOpenChange={setIsNewFlowOpen}>
                                            <Dialog.Trigger asChild>
                                                <button className="w-full flex items-center justify-center gap-2 bg-red-800 text-white py-2.5 rounded-lg font-bold hover:bg-red-900 transition-all shadow-sm text-sm">
                                                    <Plus className="w-4 h-4 stroke-[3px]" />
                                                    New Code Flow
                                                </button>
                                            </Dialog.Trigger>
                                            <Dialog.Portal>
                                                <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
                                                <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl w-[640px] max-w-[95vw] z-[101] overflow-hidden border border-gray-100">
                                                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
                                                                <GitBranch className="w-5 h-5 text-red-600" />
                                                            </div>
                                                            <Dialog.Title className="text-lg font-bold text-gray-900">New Code Flow Analysis</Dialog.Title>
                                                        </div>
                                                        <Dialog.Close asChild>
                                                            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors">
                                                                <X className="w-5 h-5" />
                                                            </button>
                                                        </Dialog.Close>
                                                    </div>

                                                    <div className="p-8 space-y-6">
                                                        <p className="text-sm text-gray-500 leading-relaxed font-medium">
                                                            Describe a use-case or scenario to analyze the code flow across your codebase.
                                                        </p>

                                                        <div className="space-y-4">
                                                            <input
                                                                id="new-flow-title"
                                                                type="text"
                                                                placeholder="Title (optional)"
                                                                className="w-full px-4 py-3 bg-white border-2 border-red-600 rounded-xl focus:ring-2 focus:ring-red-100 outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400"
                                                                defaultValue="Run Management Creation Flow"
                                                            />

                                                            <div className="flex flex-col gap-1.5">
                                                                <label className="text-xs font-bold text-red-700 uppercase tracking-wider ml-1">Use-Case Description *</label>
                                                                <textarea
                                                                    id="new-flow-desc"
                                                                    className="w-full min-h-[120px] px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none resize-none text-gray-700 font-medium placeholder:text-gray-300"
                                                                    placeholder="Describe the flow..."
                                                                    defaultValue="What is the flow of creating a new run? From creation to save call?"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-3">
                                                        <Dialog.Close asChild>
                                                            <button className="px-5 py-2.5 text-gray-600 font-bold text-sm hover:bg-gray-100 rounded-xl transition-colors">
                                                                Cancel
                                                            </button>
                                                        </Dialog.Close>
                                                        <button
                                                            onClick={() => {
                                                                const title = (document.getElementById('new-flow-title') as HTMLInputElement)?.value;
                                                                const desc = (document.getElementById('new-flow-desc') as HTMLTextAreaElement)?.value;
                                                                handleAnalyzeCodeFlow(title, desc);
                                                            }}
                                                            className="px-6 py-2.5 bg-red-800 hover:bg-red-900 text-white font-bold rounded-xl transition-all flex items-center gap-2"
                                                        >
                                                            <GitBranch className="w-4 h-4" />
                                                            Analyze
                                                        </button>
                                                    </div>
                                                </Dialog.Content>
                                            </Dialog.Portal>
                                        </Dialog.Root>
                                    </div>
                                    <div className="flex-1 overflow-y-auto px-2 py-4 space-y-1 bg-[#fcfcfc]">
                                        {codeFlows.map((flow) => (
                                            <div
                                                key={flow.id}
                                                onClick={() => {
                                                    setSelectedCodeFlowId(flow.id);
                                                    if (flow.status?.toLowerCase() === 'completed') setFlowAnalysisState('result');
                                                }}
                                                className={cn(
                                                    "p-4 rounded-xl border-2 transition-all cursor-pointer group",
                                                    selectedCodeFlowId === flow.id
                                                        ? "bg-red-50/30 border-red-100 shadow-sm"
                                                        : "bg-white border-transparent hover:border-gray-100 hover:bg-gray-50/50"
                                                )}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <div className="flex items-start gap-3">
                                                        {flow.status?.toLowerCase() === 'completed' ? (
                                                            <Check className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                                                        ) : (
                                                            <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin shrink-0" />
                                                        )}
                                                        <div>
                                                            <h4 className={cn(
                                                                "text-sm font-bold",
                                                                selectedCodeFlowId === flow.id ? "text-gray-900" : "text-gray-700 group-hover:text-gray-900"
                                                            )}>
                                                                {flow.title}
                                                            </h4>
                                                            <p className="text-[10px] text-gray-400 font-bold mt-1">{flow.date}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button className="p-1 text-gray-400 hover:text-gray-600"><Pencil className="w-3.5 h-3.5" /></button>
                                                        <button className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Main Content Area */}
                                <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
                                    {flowAnalysisState === 'analyzing' && (
                                        <div className="h-full flex flex-col p-8 bg-[#fdfdfd]">
                                            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
                                                <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                                <span className="font-bold text-red-800">Loading project/repository context...</span>
                                            </div>
                                            <div className="space-y-3">
                                                {flowLoadingSteps.map((step, i) => (
                                                    <div key={i} className={cn(
                                                        "flex items-center justify-between py-2",
                                                        step.status === 'pending' ? "opacity-40" : "opacity-100"
                                                    )}>
                                                        <div className="flex items-center gap-3">
                                                            {step.status === 'done' ? (
                                                                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                                            ) : step.status === 'active' ? (
                                                                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                                            ) : (
                                                                <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                                                            )}
                                                            <span className={cn(
                                                                "text-sm font-medium",
                                                                step.status === 'active' ? "text-red-800" : "text-gray-600"
                                                            )}>{step.label}</span>
                                                        </div>
                                                        {step.time && (
                                                            <span className="text-xs text-gray-400 font-medium">{step.time}</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {flowAnalysisState === 'result' && selectedCodeFlowId && (
                                        <>
                                            <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-start shrink-0">
                                                <div>
                                                    <h2 className="text-lg font-bold text-gray-900 mb-1">
                                                        {codeFlows.find(f => f.id === selectedCodeFlowId)?.title}
                                                    </h2>
                                                    <p className="text-sm text-gray-500">
                                                        {codeFlows.find(f => f.id === selectedCodeFlowId)?.description}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Dialog.Root open={isEditFlowOpen} onOpenChange={setIsEditFlowOpen}>
                                                        <Dialog.Trigger asChild>
                                                            <button className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-1">
                                                                <Pencil className="w-3 h-3" /> Edit
                                                            </button>
                                                        </Dialog.Trigger>
                                                        <Dialog.Portal>
                                                            <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
                                                            <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl w-[640px] max-w-[95vw] z-[101] overflow-hidden border border-gray-100">
                                                                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
                                                                            <Pencil className="w-5 h-5 text-red-600" />
                                                                        </div>
                                                                        <Dialog.Title className="text-lg font-bold text-gray-900">Edit Code Flow</Dialog.Title>
                                                                    </div>
                                                                    <Dialog.Close asChild>
                                                                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors">
                                                                            <X className="w-5 h-5" />
                                                                        </button>
                                                                    </Dialog.Close>
                                                                </div>

                                                                <div className="p-8 space-y-6">
                                                                    <div className="space-y-4">
                                                                        <input
                                                                            id="edit-flow-title"
                                                                            type="text"
                                                                            placeholder="Title"
                                                                            className="w-full px-4 py-3 bg-white border-2 border-red-600 rounded-xl focus:ring-2 focus:ring-red-100 outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400"
                                                                            defaultValue={codeFlows.find(f => f.id === selectedCodeFlowId)?.title}
                                                                        />

                                                                        <div className="flex flex-col gap-1.5">
                                                                            <label className="text-xs font-bold text-red-700 uppercase tracking-wider ml-1">Use-Case Description</label>
                                                                            <textarea
                                                                                id="edit-flow-desc"
                                                                                className="w-full min-h-[120px] px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none resize-none text-gray-700 font-medium placeholder:text-gray-300"
                                                                                placeholder="Describe the flow..."
                                                                                defaultValue={codeFlows.find(f => f.id === selectedCodeFlowId)?.description}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-3">
                                                                    <Dialog.Close asChild>
                                                                        <button className="px-5 py-2.5 text-gray-600 font-bold text-sm hover:bg-gray-100 rounded-xl transition-colors">
                                                                            Cancel
                                                                        </button>
                                                                    </Dialog.Close>
                                                                    <button
                                                                        onClick={() => {
                                                                            const title = (document.getElementById('edit-flow-title') as HTMLInputElement)?.value;
                                                                            const desc = (document.getElementById('edit-flow-desc') as HTMLTextAreaElement)?.value;
                                                                            handleEditCodeFlow(title, desc);
                                                                        }}
                                                                        className="px-6 py-2.5 bg-red-800 hover:bg-red-900 text-white font-bold rounded-xl transition-all flex items-center gap-2"
                                                                    >
                                                                        <Check className="w-4 h-4" />
                                                                        Save Changes
                                                                    </button>
                                                                </div>
                                                            </Dialog.Content>
                                                        </Dialog.Portal>
                                                    </Dialog.Root>
                                                    <button
                                                        onClick={handleRegenerateCodeFlow}
                                                        className="px-3 py-1.5 text-xs font-medium text-red-700 bg-white border border-gray-300 rounded hover:bg-red-50 flex items-center gap-1"
                                                    >
                                                        <History className="w-3 h-3" /> Regenerate
                                                    </button>
                                                </div>
                                            </div>


                                            {/* Red Info/Summary Box */}
                                            <div className="px-6 py-4">
                                                <div className="bg-red-50 border border-red-100 rounded-lg p-4 text-sm text-red-800 leading-relaxed">
                                                    <div className="flex gap-3">
                                                        <InfoIcon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                                                        <p>
                                                            The flow begins with a user initiating a new run from the RunsView, opening a dialog for configuration. After filling out the form, the save action triggers an API call through the state management store, which is then processed by global HTTP interceptors before reaching the backend. Upon receiving a response, the store updates the UI and displays a notification.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* How the Code Flows Section */}
                                            <div className="px-6 pb-4">
                                                <h3 className="text-base font-bold text-gray-900 mb-3">How the Code Flows</h3>
                                                <div className="flex gap-3">
                                                    <div className="flex-shrink-0 w-7 h-7 bg-red-800 text-white rounded flex items-center justify-center font-bold text-sm">1</div>
                                                    <p className="text-sm text-gray-700 leading-relaxed">
                                                        The process of creating a new run starts when a user, interacting with the <code className="bg-gray-100 px-1 rounded text-gray-800">RunsView.tsx</code> (0) component, clicks the &apos;New Run&apos; button. This action opens the <code className="bg-gray-100 px-1 rounded text-gray-800">AddRunDialog.tsx</code> (1), which serves as the central UI for configuring the run. Within this dialog, the user populates various fields using specialized components like <code className="bg-gray-100 px-1 rounded text-gray-800">RunDemands.tsx</code> (3) for demand selection, <code className="bg-gray-100 px-1 rounded text-gray-800">RunCapacity.tsx</code> (4) for capacity settings, <code className="bg-gray-100 px-1 rounded text-gray-800">RunParameterization.tsx</code> (5) for prioritization, <code className="bg-gray-100 px-1 rounded text-gray-800">RunSelectIntervals.tsx</code> (6) for time ranges, and <code className="bg-gray-100 px-1 rounded text-gray-800">RunSpecialOptions.tsx</code> (7) for advanced options. All collected data is structured according to the <code className="bg-gray-100 px-1 rounded text-gray-800">RunFormData.ts</code> (8) interface. Once the user clicks &apos;Save&apos; in the <code className="bg-gray-100 px-1 rounded text-gray-800">AddRunDialog.tsx</code> (1), client-side validation occurs. If successful, the dialog dispatches a &apos;createRun&apos; action to the <code className="bg-gray-100 px-1 rounded text-gray-800">RunManagementContextStore.ts</code> (2), which manages the application&apos;s run-related state. The <code className="bg-gray-100 px-1 rounded text-gray-800">RunManagementContextStore.ts</code> (2) then initiates an asynchronous API call to the backend to persist the new run. This outgoing request is first intercepted by <code className="bg-gray-100 px-1 rounded text-gray-800">HTTPInterceptor.tsx</code> (20), which acts as a central point for request modification. It leverages <code className="bg-gray-100 px-1 rounded text-gray-800">RequestInterceptor.ts</code> (21) to attach the necessary authentication token and <code className="bg-gray-100 px-1 rounded text-gray-800">ScenarioAuthorization.tsx</code> (23) to include the current scenario ID in the request headers. The fully prepared request is then sent to the &apos;Backend API Service&apos;. After the &apos;Backend API Service&apos; processes the request, it sends a response back, which is again intercepted by <code className="bg-gray-100 px-1 rounded text-gray-800">HTTPInterceptor.tsx</code> (20). The <code className="bg-gray-100 px-1 rounded text-gray-800">HTTPInterceptor.tsx</code> (20) delegates to <code className="bg-gray-100 px-1 rounded text-gray-800">ResponseInterceptor.ts</code> (22) to handle the server&apos;s response, specifically managing errors (e.g., displaying user-friendly messages for 4xx or 5xx status codes). The processed result is then returned to the <code className="bg-gray-100 px-1 rounded text-gray-800">RunManagementContextStore.ts</code> (2). Finally, the store updates the application state to reflect the newly created run, triggers a success or error notification via <code className="bg-gray-100 px-1 rounded text-gray-800">NotificationService.tsx</code> (19), and the <code className="bg-gray-100 px-1 rounded text-gray-800">AddRunDialog.tsx</code> (1) navigates the user to the new run&apos;s detail view or closes, completing the user&apos;s interaction.
                                                    </p>
                                                </div>
                                            </div>


                                            <div className="p-6 pt-2 min-h-[400px]">
                                                <div className="bg-white border border-gray-200 rounded-lg shadow-sm h-[400px] w-full overflow-hidden relative">
                                                    <div className="absolute top-4 left-4 z-10 flex gap-2">
                                                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded border border-gray-200 font-medium">14 files</span>
                                                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded border border-gray-200 font-medium">17 connections</span>
                                                        <span className="bg-red-800 text-white text-xs px-2 py-1 rounded font-bold">100%</span>
                                                    </div>

                                                    <ReactFlow
                                                        nodes={nodes}
                                                        edges={edges}
                                                        onNodesChange={onNodesChange}
                                                        onEdgesChange={onEdgesChange}
                                                        onConnect={onConnect}
                                                        fitView
                                                        attributionPosition="bottom-right"
                                                    >
                                                        <MiniMap />
                                                        <Controls />
                                                        <Background />
                                                    </ReactFlow>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {flowAnalysisState === 'idle' && (
                                        <div className="h-full flex flex-col items-center justify-center p-8 bg-[#fdfdfd]">
                                            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-6 text-gray-200">
                                                <GitBranch className="w-10 h-10" />
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-400 mb-2">Ready to analyze code flows?</h3>
                                            <p className="text-gray-400 text-sm font-medium">Select a flow or create a new one to analyze.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    }


                    {/* 8. PULL REQUESTS TAB */}
                    {
                        activeTab === "pull-requests" && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-gray-900">Open Pull Requests</h3>
                                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                        {repo.pull_requests?.filter(pr => pr.status === 'Open').length || 0} Open
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {(repo.pull_requests || []).map((pr) => (
                                        <Card key={pr.id} className="border-none shadow-sm ring-1 ring-gray-100 hover:ring-blue-200 transition-all cursor-pointer">
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-3">
                                                        <GitPullRequest className={cn(
                                                            "w-5 h-5 mt-1",
                                                            pr.status === 'Open' ? "text-emerald-500" : "text-purple-500"
                                                        )} />
                                                        <div>
                                                            <h4 className="font-bold text-gray-900 leading-tight mb-1">{pr.title}</h4>
                                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                                <span className="font-mono">#{pr.id}</span>
                                                                <span>•</span>
                                                                <span className="font-medium">by {pr.author}</span>
                                                                <span>•</span>
                                                                <span>opened on {pr.date}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right">
                                                            <div className="flex items-center gap-2 text-[10px] font-bold">
                                                                <span className="text-emerald-600">+{pr.additions}</span>
                                                                <span className="text-red-600">-{pr.deletions}</span>
                                                            </div>
                                                            <p className="text-[10px] text-gray-400 font-medium">{pr.files_changed} files changed</p>
                                                        </div>
                                                        <span className={cn(
                                                            "text-[10px] font-bold uppercase px-2 py-0.5 rounded",
                                                            pr.status === 'Open' ? "bg-emerald-50 text-emerald-700" : "bg-purple-50 text-purple-700"
                                                        )}>{pr.status}</span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    {(!repo.pull_requests || repo.pull_requests.length === 0) && (
                                        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-100">
                                            <GitPullRequest className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                            <p className="text-gray-400 font-medium">No pull requests found.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    }

                    {/* 9. FEATURE MAP TAB */}
                    {
                        activeTab === "feature-map" && (
                            <div className="h-full flex flex-col animate-in fade-in duration-300">
                                <div className="flex items-center justify-between mb-4 px-6 pt-6">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">Feature Architecture Map</h3>
                                        <p className="text-sm text-gray-500">Visualizing the logical relationship between core features and services.</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-1 rounded border border-gray-200">
                                            {repo.feature_map?.nodes.length || 0} Nodes
                                        </span>
                                        <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-1 rounded border border-gray-200">
                                            {repo.feature_map?.edges.length || 0} Connections
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-1 p-6">
                                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm h-full w-full overflow-hidden relative">
                                        <ReactFlow
                                            defaultNodes={repo.feature_map?.nodes || []}
                                            defaultEdges={repo.feature_map?.edges || []}
                                            fitView
                                        >
                                            <Background />
                                            <Controls />
                                            <MiniMap />
                                        </ReactFlow>
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    {/* Placeholders for other tabs */}
                    {
                        !["overview", "team-staffing", "technologies", "complexity", "code-quality", "ask-questions", "prompt-generation", "code-flows", "pull-requests", "feature-map"].includes(activeTab) && (
                            <div className="flex h-full items-center justify-center text-gray-400">
                                <p>Placeholder content for {activeTab}</p>
                            </div>
                        )
                    }
                </div >
            </div >
        </div >
    );
}
