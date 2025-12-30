"use client";

import { useState } from "react";
import { Github, Upload, FileUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AddRepositoryPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"clone" | "upload">("clone");
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        url: "",
        token: "",
        username: "",
        date_range: 365,
        main_branch: "main"
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: id === "date_range" ? parseInt(value) || 0 : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch("http://localhost:8000/api/v1/repositories", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error("Failed to create repository");
            }

            const newRepo = await response.json();
            router.push(`/repositories/cloning/${newRepo.id}`);
        } catch (error) {
            console.error("Error creating repository:", error);
            alert("Failed to create repository. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-10 px-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Add Repository</h1>
                <p className="text-gray-500 mt-1">Add a new repository to analyze for transition planning or current state understanding</p>
            </div>

            <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-8">

                    {/* Repository Source Tabs */}
                    <div className="mb-8">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Repository Source</label>
                        <div className="flex rounded-md shadow-sm">
                            <button
                                type="button"
                                onClick={() => setActiveTab("clone")}
                                className={cn(
                                    "flex-1 flex items-center justify-center py-3 px-4 text-sm font-medium border first:rounded-l-md transition-colors",
                                    activeTab === "clone"
                                        ? "bg-slate-50 text-indigo-700 ring-1 ring-inset ring-indigo-700/10 border-indigo-200 z-10"
                                        : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                                )}
                            >
                                <Github className="w-4 h-4 mr-2" />
                                CLONE FROM URL
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("upload")}
                                className={cn(
                                    "flex-1 flex items-center justify-center py-3 px-4 text-sm font-medium border -ml-px last:rounded-r-md transition-colors",
                                    activeTab === "upload"
                                        ? "bg-slate-50 text-indigo-700 ring-1 ring-inset ring-indigo-700/10 border-indigo-200 z-10"
                                        : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                                )}
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                UPLOAD ZIP
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* --- CLONE TAB CONTENT --- */}
                        {activeTab === "clone" && (
                            <>
                                {/* Repository Name */}
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                        Repository Name *
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        required
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full rounded-md border border-gray-300 py-2.5 px-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                                        placeholder=""
                                    />
                                    <p className="mt-1 text-xs text-gray-500">A descriptive name for this repository (e.g., "Backend API", "Frontend App")</p>
                                </div>

                                {/* Repository URL */}
                                <div>
                                    <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
                                        Repository URL *
                                    </label>
                                    <input
                                        type="text"
                                        id="url"
                                        required
                                        value={formData.url}
                                        onChange={handleChange}
                                        className="w-full rounded-md border border-gray-300 py-2.5 px-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                                        placeholder=""
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Supports GitHub, GitLab, Bitbucket (e.g., https://github.com/org/repo.git)</p>
                                </div>

                                {/* Clone Token */}
                                <div>
                                    <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
                                        Clone Token
                                    </label>
                                    <input
                                        type="password"
                                        id="token"
                                        value={formData.token}
                                        onChange={handleChange}
                                        className="w-full rounded-md border border-gray-300 py-2.5 px-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                                        placeholder=""
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Personal access token for private repositories (optional)</p>
                                </div>

                                {/* Clone Username */}
                                <div>
                                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                                        Clone Username
                                    </label>
                                    <input
                                        type="text"
                                        id="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        className="w-full rounded-md border border-gray-300 py-2.5 px-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                                        placeholder=""
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Username for authentication (usually not needed with tokens)</p>
                                </div>

                                {/* Date Range */}
                                <div>
                                    <label htmlFor="date_range" className="block text-sm font-medium text-gray-700 mb-1">
                                        Date Range (Days)
                                    </label>
                                    <input
                                        type="number"
                                        id="date_range"
                                        value={formData.date_range}
                                        onChange={handleChange}
                                        className="w-full rounded-md border border-gray-300 py-2.5 px-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">How far back to analyze commit history for transition analysis (1-1825 days)</p>
                                </div>

                                {/* Main Branch */}
                                <div className="pb-8 border-b border-gray-100">
                                    <label htmlFor="main_branch" className="block text-sm font-medium text-gray-700 mb-1">
                                        Main Branch *
                                    </label>
                                    <input
                                        type="text"
                                        id="main_branch"
                                        value={formData.main_branch}
                                        onChange={handleChange}
                                        className="w-full rounded-md border border-gray-300 py-2.5 px-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">The main branch to analyze (e.g., main, master, develop)</p>
                                </div>
                            </>
                        )}

                        {/* --- UPLOAD TAB CONTENT --- */}
                        {activeTab === "upload" && (
                            <>
                                {/* Repository Name */}
                                <div>
                                    <label htmlFor="repoNameUpload" className="block text-sm font-medium text-gray-700 mb-1">
                                        Repository Name *
                                    </label>
                                    <input
                                        type="text"
                                        id="repoNameUpload"
                                        className="w-full rounded-md border border-gray-300 py-2.5 px-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                                        placeholder=""
                                    />
                                </div>

                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 hover:bg-gray-50 transition-colors text-center cursor-pointer">
                                    <FileUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900">Upload ZIP File</h3>
                                    <p className="text-gray-500 mt-2 text-sm">Drag and drop your repository archive here, or click to browse.</p>
                                    <p className="text-xs text-gray-400 mt-1">Has to be a .zip file containing the source code.</p>

                                    <button type="button" className="mt-6 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                                        Select File
                                    </button>
                                </div>

                                <div className="pb-4"></div>
                            </>
                        )}


                        {/* Footer Actions */}
                        <div className="flex items-center justify-end space-x-4 pt-2">
                            <Link href="/repositories" className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200">
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-5 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 flex items-center gap-2 disabled:opacity-50"
                            >
                                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                {activeTab === "clone" ? (isLoading ? "Creating..." : "Create Repository") : "Upload & Analyze"}
                            </button>
                        </div>

                    </form>
                </CardContent>
            </Card>

            <h2 className="text-5xl font-bold text-gray-200 text-center mt-12 uppercase select-none pointer-events-none">
                Repository for analysis
            </h2>
        </div>
    );
}

