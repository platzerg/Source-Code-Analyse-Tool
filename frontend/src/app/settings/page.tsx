"use client";

import { useState, useEffect } from "react";
import { Save, Layout } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function GlobalSettingsPage() {
    // Menu Visibility State
    const [projectTabs, setProjectTabs] = useState({
        repositories: true,
        backlog: true,
        board: true,
        roadmap: true,
        insights: true
    });

    const [repoTabs, setRepoTabs] = useState({
        overview: true,
        technologies: true,
        'code-flows': true,
        'code-quality': true,
        'team-staffing': true,
        'feature-map': true,
        dependencies: true,
        security: true,
        'ai-features': true,
        'ask-questions': true,
        'prompt-generation': true,
        'pull-requests': true
    });

    // Load settings on mount
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch("http://localhost:8000/api/v1/settings");
                if (response.ok) {
                    const data = await response.json();
                    if (data.menu_visibility) {
                        setProjectTabs(data.menu_visibility.project_tabs);
                        setRepoTabs(data.menu_visibility.repository_tabs);
                    }
                }
            } catch (error) {
                console.error("Error loading settings:", error);
                // Fallback to localStorage
                const savedProjectTabs = localStorage.getItem('project_tabs');
                if (savedProjectTabs) setProjectTabs(JSON.parse(savedProjectTabs));

                const savedRepoTabs = localStorage.getItem('repo_tabs');
                if (savedRepoTabs) setRepoTabs(JSON.parse(savedRepoTabs));
            }
        };

        fetchSettings();
    }, []);

    const toggleProjectTab = (id: string) => {
        setProjectTabs(prev => ({ ...prev, [id]: !prev[id as keyof typeof prev] }));
    };

    const toggleRepoTab = (id: string) => {
        setRepoTabs(prev => ({ ...prev, [id]: !prev[id as keyof typeof prev] }));
    };

    const saveVisibilitySettings = async () => {
        try {
            // Save to backend
            const response = await fetch("http://localhost:8000/api/v1/settings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    menu_visibility: {
                        project_tabs: projectTabs,
                        repository_tabs: repoTabs
                    }
                })
            });

            if (response.ok) {
                // Also save to localStorage as backup
                localStorage.setItem('project_tabs', JSON.stringify(projectTabs));
                localStorage.setItem('repo_tabs', JSON.stringify(repoTabs));

                // Show success message
                const button = document.activeElement as HTMLButtonElement;
                const originalText = button.innerHTML;
                button.innerHTML = '<svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>Saved!';
                button.disabled = true;
                setTimeout(() => {
                    button.innerHTML = originalText;
                    button.disabled = false;
                }, 2000);
            }
        } catch (error) {
            console.error("Error saving settings:", error);
            alert("Failed to save settings. Please try again.");
        }
    };

    return (
        <div className="max-w-5xl mx-auto py-8 px-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-500 mt-1">Manage your application preferences and menu visibility.</p>
            </div>

            <div className="space-y-8">
                {/* Menu Visibility Settings */}
                <Card className="border-gray-200">
                    <CardHeader className="bg-gray-50 rounded-t-lg border-b border-gray-100">
                        <CardTitle className="text-gray-900 flex items-center gap-2">
                            <Layout className="w-5 h-5 text-gray-500" />
                            Menu Visibility
                        </CardTitle>
                        <CardDescription>
                            Configure which tabs are visible in the Project and Repository views across the application.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Project Tabs */}
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-sm">Project Pages</span>
                                </h4>
                                <div className="space-y-2">
                                    {[
                                        { id: 'repositories', label: 'Repositories' },
                                        { id: 'backlog', label: 'Backlog' },
                                        { id: 'board', label: 'Board' },
                                        { id: 'roadmap', label: 'Roadmap' },
                                        { id: 'insights', label: 'Insights' },
                                    ].map((tab) => (
                                        <label key={tab.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-md transition-colors cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                checked={projectTabs[tab.id as keyof typeof projectTabs]}
                                                onChange={() => toggleProjectTab(tab.id)}
                                            />
                                            <span className="text-sm text-gray-700">{tab.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Repository Tabs */}
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-sm">Repository Pages</span>
                                </h4>
                                <div className="space-y-2">
                                    {[
                                        { id: 'overview', label: 'Overview' },
                                        { id: 'technologies', label: 'Technologies' },
                                        { id: 'code-flows', label: 'Code Flows' },
                                        { id: 'code-quality', label: 'Code Quality' },
                                        { id: 'team-staffing', label: 'Team Staffing' },
                                        { id: 'feature-map', label: 'Feature Map' },
                                        { id: 'dependencies', label: 'Dependencies' },
                                        { id: 'security', label: 'Security' },
                                        { id: 'ai-features', label: 'AI Features' },
                                        { id: 'ask-questions', label: 'Ask Questions' },
                                        { id: 'prompt-generation', label: 'Prompt Generation' },
                                        { id: 'pull-requests', label: 'Pull Requests' },
                                    ].map((tab) => (
                                        <label key={tab.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-md transition-colors cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                                checked={repoTabs[tab.id as keyof typeof repoTabs]}
                                                onChange={() => toggleRepoTab(tab.id)}
                                            />
                                            <span className="text-sm text-gray-700">{tab.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end pt-4 border-t border-gray-100">
                            <button
                                onClick={saveVisibilitySettings}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-black transition-colors text-sm font-medium"
                            >
                                <Save className="w-4 h-4" />
                                Save Settings
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
