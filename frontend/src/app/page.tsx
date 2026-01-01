"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LayoutTemplate, Activity, Briefcase, FolderOpen, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useTranslation } from "react-i18next";

interface Project {
    id: number;
    name: string;
    description: string;
    owner: string;
    start_date: string;
    status: string;
}

interface Repository {
    id: number;
    name: string;
    url: string;
    status: string;
    repo_scan: string;
    added_at: string;
    main_branch?: string;
}

interface OverviewData {
    system_status: {
        operational: boolean;
        message: string;
        last_updated: string;
    };
    stats: {
        total_projects: number;
        total_repositories: number;
        active_projects: number;
        cloned_repositories: number;
    };
}

export default function Dashboard() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState("overview");
    const [projects, setProjects] = useState<Project[]>([]);
    const [repositories, setRepositories] = useState<Repository[]>([]);
    const [overview, setOverview] = useState<OverviewData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [projectsRes, reposRes, overviewRes] = await Promise.all([
                    fetch("http://localhost:8000/api/v1/projects"),
                    fetch("http://localhost:8000/api/v1/repositories"),
                    fetch("http://localhost:8000/api/v1/overview")
                ]);

                if (projectsRes.ok) {
                    const projectsData = await projectsRes.json();
                    setProjects(projectsData);
                }

                if (reposRes.ok) {
                    const reposData = await reposRes.json();
                    setRepositories(reposData);
                }

                if (overviewRes.ok) {
                    const overviewData = await overviewRes.json();
                    setOverview(overviewData);
                }
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-800 mr-2"></div>
                {t('dashboard.loading')}
            </div>
        );
    }

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>
                    <p className="text-gray-500 mt-1">{t('dashboard.subtitle')}</p>
                </div>
            </div>

            {/* Header Info (Tabs) */}
            <div className="flex flex-col mb-8">
                {/* Interactive Tabs */}
                <div className="flex space-x-8 border-b border-gray-200 mt-2 pb-0 text-sm font-medium text-gray-500 overflow-x-auto">
                    {[
                        { id: "overview", label: t('dashboard.tabs.overview'), icon: LayoutTemplate },
                        { id: "status", label: t('dashboard.tabs.status'), icon: Activity },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "pb-2 px-1 flex items-center space-x-2 transition-colors whitespace-nowrap",
                                activeTab === tab.id
                                    ? "text-red-600 border-b-2 border-red-600"
                                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* --- OVERVIEW TAB --- */}
            {
                activeTab === "overview" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                        {/* Projects Summary Card */}
                        <Link href="/projects" className="block group">
                            <Card className="hover:shadow-md transition-all cursor-pointer border-l-4 border-l-red-800 group-hover:border-red-600 h-full">
                                <CardContent className="p-6 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 mb-1">{t('dashboard.stats.total_projects')}</p>
                                        <h3 className="text-4xl font-bold text-gray-900">{projects.length}</h3>
                                        <div className="mt-2 inline-flex items-center text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                            {projects.filter(p => p.status === "Active").length} {t('dashboard.stats.active_projects')}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-red-50 rounded-full text-red-800 group-hover:bg-red-100 transition-colors">
                                        <Briefcase className="w-8 h-8" />
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>

                        {/* Repositories Summary Card */}
                        <Link href="/repositories" className="block group">
                            <Card className="hover:shadow-md transition-all cursor-pointer border-l-4 border-l-gray-500 group-hover:border-gray-400 h-full">
                                <CardContent className="p-6 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 mb-1">{t('dashboard.stats.total_repos')}</p>
                                        <h3 className="text-4xl font-bold text-gray-900">{repositories.length}</h3>
                                        <div className="mt-2 inline-flex items-center text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                                            {repositories.filter(r => r.status === "Cloned").length} {t('dashboard.stats.cloned_repos')}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gray-100 rounded-full text-gray-700 group-hover:bg-gray-200 transition-colors">
                                        <FolderOpen className="w-8 h-8" />
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>

                        {/* Quick System Status */}
                        <Card className="md:col-span-2 border-none shadow-sm bg-gradient-to-r from-gray-50 to-white">
                            <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white rounded-full shadow-sm ring-1 ring-gray-100">
                                        <Activity className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{t('dashboard.system_status.title')}</h3>
                                        <p className="text-sm text-gray-500">
                                            {overview?.system_status?.message || t('dashboard.system_status.default_message')}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-400">
                                    {t('dashboard.system_status.updated')}: {overview?.system_status?.last_updated ? new Date(overview.system_status.last_updated).toLocaleString() : new Date().toLocaleDateString()}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )
            }

            {/* --- STATUS TAB --- */}
            {
                activeTab === "status" && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <Card>
                            <CardContent className="p-8">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full">
                                        <Activity className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">{t('dashboard.status_view.title')}</h2>
                                        <p className="text-gray-500 text-sm">{t('dashboard.status_view.subtitle')}</p>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    {/* Projects Status Section */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <Briefcase className="w-4 h-4" /> {t('dashboard.status_view.projects_header')}
                                        </h3>
                                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                                                    <tr>
                                                        <th className="px-6 py-3">{t('dashboard.status_view.table.project_name')}</th>
                                                        <th className="px-6 py-3">{t('dashboard.status_view.table.status')}</th>
                                                        <th className="px-6 py-3">{t('dashboard.status_view.table.owner')}</th>
                                                        <th className="px-6 py-3 text-right">{t('dashboard.status_view.table.start_date')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {projects.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={4} className="px-6 py-8 text-center text-gray-400 italic">{t('dashboard.status_view.no_projects')}</td>
                                                        </tr>
                                                    ) : (
                                                        projects.map((project) => (
                                                            <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                                    <Link href={`/projects/${project.id}`} className="hover:underline text-red-800">
                                                                        {project.name}
                                                                    </Link>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className={cn(
                                                                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                                                                        project.status === "Active" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-800"
                                                                    )}>
                                                                        {project.status}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 text-gray-600">{project.owner}</td>
                                                                <td className="px-6 py-4 text-right text-gray-600">
                                                                    {project.start_date}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Repositories Status Section */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <FolderOpen className="w-4 h-4" /> {t('dashboard.status_view.repos_header')}
                                        </h3>
                                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                                                    <tr>
                                                        <th className="px-6 py-3">{t('dashboard.status_view.table.repository')}</th>
                                                        <th className="px-6 py-3">{t('dashboard.status_view.table.scan_status')}</th>
                                                        <th className="px-6 py-3">{t('dashboard.status_view.table.last_activity')}</th>
                                                        <th className="px-6 py-3 text-right">{t('dashboard.status_view.table.status')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {repositories.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={4} className="px-6 py-8 text-center text-gray-400 italic">{t('dashboard.status_view.no_repos')}</td>
                                                        </tr>
                                                    ) : (
                                                        repositories.map((repo) => (
                                                            <tr key={repo.id} className="hover:bg-gray-50 transition-colors">
                                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                                    <Link href={`/repositories/${repo.id}`} className="hover:underline text-red-800">
                                                                        {repo.name}
                                                                    </Link>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className={cn(
                                                                        "inline-flex items-center gap-1.5 font-medium text-xs",
                                                                        repo.repo_scan === "Completed" ? "text-emerald-600" :
                                                                            repo.repo_scan === "In Progress" ? "text-blue-600" : "text-gray-500"
                                                                    )}>
                                                                        <span className={cn(
                                                                            "w-1.5 h-1.5 rounded-full text-emerald-600",
                                                                            repo.repo_scan === "Completed" ? "bg-emerald-600" :
                                                                                repo.repo_scan === "In Progress" ? "bg-blue-600 animate-pulse" : "bg-gray-400"
                                                                        )}></span>
                                                                        {repo.repo_scan}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 text-gray-600">{repo.added_at}</td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <div className="flex items-center justify-end gap-2">
                                                                        {repo.main_branch && (
                                                                            <span className="flex items-center gap-1 bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200">
                                                                                <GitBranch className="w-3 h-3" />
                                                                                {repo.main_branch}
                                                                            </span>
                                                                        )}
                                                                        <span className={cn(
                                                                            "inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase font-bold",
                                                                            repo.status === "Cloned" ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-700"
                                                                        )}>
                                                                            {repo.status}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )
            }
        </div >
    );
}
