"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import {
    Plus,
    Folder,
    Trash2,
    BarChart2,
    Search,
    Eye,
    CheckCircle2,
    Play,
    User,
    GitBranch,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import { API_BASE_URL } from "@/lib/config";

interface Repository {
    id: string;
    name: string;
    url: string;
    isCloned: boolean;
    commitAnalysis: {
        status: 'not_started' | 'completed';
        commitsAnalyzed?: number;
    };
    repoScan: {
        status: 'not_started' | 'in_progress' | 'completed';
        filesScanned?: number;
        totalFiles?: number;
        scannedAt?: string;
    };
    createdAt: string;
    username: string;
    branch: string;
}

export default function RepositoriesPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <RepositoriesList />
        </Suspense>
    );
}

function RepositoriesList() {
    const searchParams = useSearchParams();
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (searchParams.get('scanSuccess') === 'true') {
            const name = searchParams.get('repoName');
            if (name) setLastScannedRepoName(name);
            setShowSuccess(true);
            const timer = setTimeout(() => {
                setShowSuccess(false);
                // Clean up URL if possible (optional but cleaner)
                window.history.replaceState({}, '', '/repositories');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [searchParams]);

    const [repositories, setRepositories] = useState<Repository[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeScanningIds, setActiveScanningIds] = useState<Set<string>>(new Set());
    const [lastScannedRepoName, setLastScannedRepoName] = useState<string>("");
    const successTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Deletion Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<Repository | null>(null);

    const fetchRepositories = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/repositories`);
            if (!response.ok) throw new Error("Failed to fetch repositories");
            const data = await response.json();

            const mappedRepos: Repository[] = data.map((r: any) => ({
                id: String(r.id),
                name: r.name,
                url: r.url,
                isCloned: r.status === "Cloned",
                commitAnalysis: {
                    status: r.commit_analysis === "Completed" ? "completed" : "not_started"
                },
                repoScan: {
                    status: (r.repo_scan?.toLowerCase() === "completed") ? "completed" :
                        (r.repo_scan?.toLowerCase() === "in progress") ? "in_progress" : "not_started",
                    filesScanned: r.repo_scan?.toLowerCase() === "completed" ? 100 : 0,
                    totalFiles: 100,
                    scannedAt: r.scanned_at || ""
                },
                createdAt: r.added_at,
                username: r.username || "n/a",
                branch: r.main_branch || "main"
            }));

            setRepositories(mappedRepos);
        } catch (error) {
            console.error("Error fetching repositories:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRepositories();
    }, []);

    const handleScan = (id: string) => {
        const repoForName = repositories.find(r => r.id === id);
        const nameToPass = repoForName?.name || "Repository";

        setActiveScanningIds(prev => new Set(prev).add(id));

        // Update status to in_progress locally
        setRepositories(prev => prev.map(repo =>
            repo.id === id ? {
                ...repo,
                repoScan: { ...repo.repoScan, status: 'in_progress', filesScanned: 0, totalFiles: 100 }
            } : repo
        ));

        const eventSource = new EventSource(`${API_BASE_URL}/api/v1/repositories/${id}/stream-status?mode=scan`);

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);

            setRepositories(prev => prev.map(repo => {
                if (repo.id === id) {
                    const isNewCompleted = data.progress === 100;
                    return {
                        ...repo,
                        repoScan: {
                            ...repo.repoScan,
                            status: isNewCompleted ? 'completed' : 'in_progress',
                            filesScanned: Math.round((data.progress / 100) * 100),
                            totalFiles: 100
                        }
                    };
                }
                return repo;
            }));

            if (data.progress === 100) {
                eventSource.close();

                // Final update to ensure state shows 100% and 'completed'
                setRepositories(prev => prev.map(repo => {
                    if (repo.id === id) {
                        return {
                            ...repo,
                            repoScan: {
                                ...repo.repoScan,
                                status: 'completed',
                                filesScanned: 100,
                                totalFiles: 100,
                                scannedAt: new Date().toLocaleString('en-US', {
                                    month: 'short',
                                    day: '2-digit',
                                    year: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                })
                            }
                        };
                    }
                    return repo;
                }));

                setActiveScanningIds(prev => {
                    const next = new Set(prev);
                    next.delete(id);
                    return next;
                });
                if (successTimerRef.current) clearTimeout(successTimerRef.current);
                setLastScannedRepoName(nameToPass);
                setShowSuccess(true);
                successTimerRef.current = setTimeout(() => {
                    setShowSuccess(false);
                }, 5000);
            }
        };

        eventSource.onerror = (err) => {
            console.error("EventSource failed:", err);
            eventSource.close();
            setActiveScanningIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
            // Reset status if error
            setRepositories(prev => prev.map(repo =>
                repo.id === id ? {
                    ...repo,
                    repoScan: { ...repo.repoScan, status: 'not_started' }
                } : repo
            ));
        };
    };

    const handleDeleteClick = (repo: Repository) => {
        setItemToDelete(repo);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/repositories/${itemToDelete.id}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("Failed to delete repository");

            setRepositories(prev => prev.filter(r => r.id !== itemToDelete.id));
        } catch (error) {
            console.error("Error deleting repository:", error);
            alert("Error deleting repository. Please try again.");
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-800"></div>
            </div>
        );
    }

    return (
        <div className="max-w-[1600px] mx-auto py-8 px-8 relative">
            {/* Success Notification */}
            {showSuccess && (
                <div
                    key={`${lastScannedRepoName}-${Date.now()}`}
                    className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-500"
                >
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-6 py-3 rounded-full shadow-lg flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <span className="font-semibold tracking-wide text-sm text-gray-900 truncate max-w-sm">
                            Scan successful for <span className="text-emerald-700 font-bold italic">{lastScannedRepoName}</span>! Analysis updated.
                        </span>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Repositories</h1>
                    <p className="text-gray-500 mt-1">{repositories.length} repositories found</p>
                </div>
                <Link
                    href="/repositories/add"
                    className="flex items-center space-x-2 px-4 py-2 bg-red-800 text-white rounded-lg shadow-sm hover:bg-red-900 transition-colors font-medium"
                >
                    <Plus className="w-5 h-5" />
                    <span>Create Repository</span>
                </Link>
            </div>

            {/* Grid */}
            {repositories.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <Folder className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">No repositories yet</h3>
                    <p className="text-gray-500">Create your first repository to start analyzing code.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {repositories.map((repo) => (
                        <Card key={repo.id} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                {/* Card Header */}
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-gray-900 text-lg truncate flex-1 min-w-0 pr-4" title={repo.name}>
                                        {repo.name}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        {repo.isCloned && (
                                            <span className="shrink-0 bg-emerald-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm">
                                                Cloned
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1 bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-sm border border-blue-200">
                                            <GitBranch className="w-3 h-3" />
                                            {repo.branch}
                                        </span>
                                    </div>
                                </div>

                                {/* URL */}
                                <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                                    <Folder className="w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate">{repo.url}</span>
                                </div>

                                {/* More Info */}
                                <div className="flex flex-col gap-1 mb-6">
                                    <div className="flex items-center gap-2 text-gray-400 text-[10px]">
                                        <User className="w-3 h-3 shrink-0" />
                                        <span>Cloned by: <span className="text-gray-600 font-medium">{repo.username}</span></span>
                                    </div>
                                </div>

                                {/* Commit Analysis Section */}
                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 mb-3">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <BarChart2 className="w-4 h-4 text-gray-700" />
                                            <span className="font-semibold text-sm text-gray-900">Commit Analysis</span>
                                        </div>
                                        <div className="text-gray-400">
                                            {repo.commitAnalysis.status === 'completed' ? (
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            ) : (
                                                <div className="w-4 h-4" /> // Placeholder
                                            )}
                                        </div>
                                    </div>

                                    {repo.commitAnalysis.status === 'not_started' ? (
                                        <p className="text-xs text-gray-400 font-medium pl-6">Not started</p>
                                    ) : (
                                        <p className="text-xs text-emerald-600 font-medium pl-6">{repo.commitAnalysis.commitsAnalyzed} commits analyzed</p>
                                    )}
                                </div>

                                {/* Repository Scan Section */}
                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 mb-6">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <Search className="w-4 h-4 text-gray-700" />
                                            <span className="font-semibold text-sm text-gray-900">Repository Scan</span>
                                        </div>
                                        <div className="flex items-center">
                                            <button
                                                onClick={() => handleScan(repo.id)}
                                                disabled={activeScanningIds.has(repo.id)}
                                                className={cn(
                                                    "flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors shadow-sm transition-all active:scale-95",
                                                    activeScanningIds.has(repo.id)
                                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                        : "bg-red-800 text-white hover:bg-red-900"
                                                )}
                                                title="Start/Resume Scan"
                                            >
                                                <Play className={cn("w-3 h-3 fill-current", activeScanningIds.has(repo.id) && "animate-pulse")} />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">
                                                    {activeScanningIds.has(repo.id) ? "Scanning" : "Scan"}
                                                </span>
                                            </button>
                                        </div>
                                    </div>

                                    {repo.repoScan.status === 'not_started' ? (
                                        <div className="pl-6 py-1">
                                            <p className="text-xs text-gray-400 font-medium italic">Ready to scan</p>
                                        </div>
                                    ) : (
                                        <div className="pl-6">
                                            {/* Progress Bar - Only visible if scanning or done */}
                                            <div className="h-1.5 w-full bg-gray-200 rounded-full mb-1 overflow-hidden">
                                                <div
                                                    className={cn(
                                                        "h-full rounded-full transition-all duration-500",
                                                        repo.repoScan.status === 'completed' ? "bg-emerald-500" : "bg-red-700"
                                                    )}
                                                    style={{ width: repo.repoScan.status === 'completed' ? '100%' : `${(repo.repoScan.filesScanned! / repo.repoScan.totalFiles!) * 100}%` }}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <p className={cn("text-xs font-medium", repo.repoScan.status === 'completed' ? "text-emerald-600" : "text-gray-500")}>
                                                    {repo.repoScan.status === 'completed' ? (
                                                        `${repo.repoScan.filesScanned} files analyzed`
                                                    ) : (
                                                        `${repo.repoScan.filesScanned} / ${repo.repoScan.totalFiles} files`
                                                    )}
                                                </p>
                                                {repo.repoScan.status === 'completed' && repo.repoScan.scannedAt && (
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 uppercase">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        <span>Done</span>
                                                        <span className="text-gray-400 font-normal lowercase ml-1">
                                                            at {repo.repoScan.scannedAt}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div>
                                    <p className="text-[10px] text-gray-400 mb-3 ml-1">Created: {repo.createdAt}</p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-2">
                                            <Link href={`/repositories/${repo.id}`} className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-800 text-white text-xs font-medium rounded hover:bg-red-900 transition-colors">
                                                <Eye className="w-3 h-3" />
                                                <span>Manage</span>
                                            </Link>

                                            {repo.commitAnalysis.status === 'completed' && (
                                                <button className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded hover:bg-gray-50 transition-colors">
                                                    <span>View Transition Report</span>
                                                </button>
                                            )}
                                            {repo.repoScan.status === 'completed' && (
                                                <button className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded hover:bg-gray-50 transition-colors">
                                                    <Search className="w-3 h-3" />
                                                    <span>View Code Analysis</span>
                                                </button>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleDeleteClick(repo)}
                                            className="text-gray-400 hover:text-red-700 transition-colors p-1"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Repository"
                description="Are you sure you want to delete the repository"
                itemName={itemToDelete?.name || ""}
            />
        </div>
    );
}
