"use client";

import { useState, useEffect, use } from "react";
import {
    Loader2,
    CheckCircle2,
    AlertCircle,
    ChevronRight,
    Search,
    Github,
    Database,
    Sparkles
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function CloningStatusPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const mode = searchParams?.get('mode') || "clone";

    const router = useRouter();
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState("Initializing...");
    const [repoName, setRepoName] = useState<string>("");
    const [logs, setLogs] = useState<{ id: number, text: string, type: 'info' | 'success' | 'warning' }[]>([]);
    const [isComplete, setIsComplete] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Fetch repo details for name
        fetch(`http://localhost:8000/api/v1/repositories/${id}`)
            .then(res => res.json())
            .then(data => setRepoName(data.name))
            .catch(err => console.error("Error fetching repo name:", err));
    }, [id]);

    useEffect(() => {
        const eventSource = new EventSource(`http://localhost:8000/api/v1/repositories/${id}/stream-status?mode=${mode}`);

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setProgress(data.progress);
            setStatusMessage(data.message);

            setLogs(prev => [
                ...prev,
                { id: Date.now(), text: data.message, type: data.progress === 100 ? 'success' : 'info' }
            ]);

            if (data.progress === 100) {
                setIsComplete(true);
                eventSource.close();
                // Wait a bit before redirecting for better UX
                setTimeout(() => {
                    const target = mode === 'scan' ? '/repositories' : `/repositories/${id}`;
                    const nameParam = repoName ? `&repoName=${encodeURIComponent(repoName)}` : '';
                    router.push(`${target}?scanSuccess=true${nameParam}`);
                }, 2000);
            }
        };

        eventSource.onerror = (err) => {
            console.error("EventSource failed:", err);
            setError("Connection lost. Retrying...");
            // Keep open, EventSource will retry automatically
            // If it stays failed too long, we could close it.
        };

        return () => {
            eventSource.close();
        };
    }, [id, router]);

    const getIconForProgress = () => {
        if (mode === 'scan') {
            if (progress < 100) return <Search className="w-12 h-12 text-indigo-500" />;
            return <CheckCircle2 className="w-12 h-12 text-emerald-500" />;
        }
        if (progress < 40) return <Github className="w-12 h-12 text-gray-400" />;
        if (progress < 70) return <Database className="w-12 h-12 text-blue-500" />;
        if (progress < 100) return <Search className="w-12 h-12 text-indigo-500" />;
        return <CheckCircle2 className="w-12 h-12 text-emerald-500" />;
    };

    return (
        <div className="min-h-[calc(100vh-theme(spacing.16))] bg-[#f8fafc] flex flex-col items-center justify-center p-6">
            <div className="max-w-2xl w-full">
                {/* Main Progress Card */}
                <Card className="border-none shadow-xl bg-white overflow-hidden mb-8">
                    <CardContent className="p-12 text-center">
                        <div className="mb-6 flex justify-center animate-bounce-slow">
                            <div className="relative">
                                {getIconForProgress()}
                                {progress < 100 && (
                                    <div className="absolute inset-0 border-4 border-t-transparent border-red-800 rounded-full animate-spin"></div>
                                )}
                            </div>
                        </div>

                        {repoName && (
                            <div className="mb-2 px-3 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded-full inline-block">
                                {repoName}
                            </div>
                        )}
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            {isComplete
                                ? (mode === 'scan' ? "Scan Complete!" : "Cloning Complete!")
                                : (mode === 'scan' ? "Scanning Repository..." : "Cloning Repository...")
                            }
                        </h1>
                        <p className="text-gray-500 text-lg mb-8">
                            {statusMessage}
                        </p>

                        <div className="space-y-4">
                            <div className="relative pt-1">
                                <div className="flex mb-2 items-center justify-between">
                                    <div>
                                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-red-600 bg-red-200">
                                            {isComplete ? "Completed" : "In Progress"}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-bold inline-block text-red-800">
                                            {progress}%
                                        </span>
                                    </div>
                                </div>
                                <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-gray-100 shadow-inner">
                                    <div
                                        style={{ width: `${progress}%` }}
                                        className={cn(
                                            "shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-1000 ease-out",
                                            isComplete ? "bg-emerald-500" : "bg-gradient-to-r from-red-800 to-red-600"
                                        )}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {isComplete && (
                            <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="inline-flex items-center gap-2 text-emerald-600 font-medium">
                                    <Sparkles className="w-5 h-5" />
                                    Redirecting to analysis dashboard...
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Status Logs */}
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest px-2">Activity Logs</h3>
                    <div className="bg-gray-900 rounded-xl p-6 font-mono text-sm text-gray-300 shadow-2xl h-48 overflow-y-auto custom-scrollbar">
                        {logs.length === 0 && <p className="text-gray-500 italic">Waiting for connection...</p>}
                        {logs.map((log) => (
                            <div key={log.id} className="flex gap-3 mb-1.5 animate-in fade-in slide-in-from-left-2 duration-300">
                                <span className="text-gray-600 select-none">[{new Date(log.id).toLocaleTimeString()}]</span>
                                <span className={cn(
                                    log.type === 'success' ? "text-emerald-400" : "text-gray-300"
                                )}>
                                    {log.text}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="mt-6 flex items-center justify-center gap-2 text-amber-600 bg-amber-50 py-2 rounded-lg border border-amber-200 animate-pulse">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                )}
            </div>

            <style jsx>{`
                .animate-bounce-slow {
                    animation: bounce 3s infinite;
                }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #374151;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #4b5563;
                }
            `}</style>
        </div>
    );
}
