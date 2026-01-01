"use client";

import { useState, useEffect } from "react";
import { Save, Layout } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "@/lib/config";

export default function GlobalSettingsPage() {
    const { t } = useTranslation();
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
                const response = await fetch(`${API_BASE_URL}/api/v1/settings`);
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
            const response = await fetch(`${API_BASE_URL}/api/v1/settings`, {
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
                button.innerHTML = `<svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>${t('settings_page.saved')}`;
                button.disabled = true;
                setTimeout(() => {
                    button.innerHTML = originalText;
                    button.disabled = false;
                }, 2000);
            }
        } catch (error) {
            console.error("Error saving settings:", error);
            alert(t('settings_page.error_save'));
        }
    };

    return (
        <div className="max-w-5xl mx-auto py-8 px-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">{t('settings_page.title')}</h1>
                <p className="text-gray-500 mt-1">{t('settings_page.description')}</p>
            </div>

            <div className="space-y-8">
                {/* Menu Visibility Settings */}
                <Card className="border-gray-200">
                    <CardHeader className="bg-gray-50 rounded-t-lg border-b border-gray-100">
                        <CardTitle className="text-gray-900 flex items-center gap-2">
                            <Layout className="w-5 h-5 text-gray-500" />
                            {t('settings_page.menu_visibility.title')}
                        </CardTitle>
                        <CardDescription>
                            {t('settings_page.menu_visibility.description')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Project Tabs */}
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-sm">{t('settings_page.menu_visibility.project_pages')}</span>
                                </h4>
                                <div className="space-y-2">
                                    {[
                                        { id: 'repositories', label: t('project_detail.tabs.repositories') },
                                        { id: 'backlog', label: t('project_detail.tabs.backlog') },
                                        { id: 'board', label: t('project_detail.tabs.board') },
                                        { id: 'roadmap', label: t('project_detail.tabs.roadmap') },
                                        { id: 'insights', label: t('project_detail.tabs.insights') },
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
                                    <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-sm">{t('settings_page.menu_visibility.repo_pages')}</span>
                                </h4>
                                <div className="space-y-2">
                                    {[
                                        { id: 'overview', label: t('settings_page.menu_visibility.tabs.overview') },
                                        { id: 'technologies', label: t('settings_page.menu_visibility.tabs.technologies') },
                                        { id: 'code-flows', label: t('settings_page.menu_visibility.tabs.code_flows') },
                                        { id: 'code-quality', label: t('settings_page.menu_visibility.tabs.code_quality') },
                                        { id: 'team-staffing', label: t('settings_page.menu_visibility.tabs.team_staffing') },
                                        { id: 'feature-map', label: t('settings_page.menu_visibility.tabs.feature_map') },
                                        { id: 'dependencies', label: t('settings_page.menu_visibility.tabs.dependencies') },
                                        { id: 'security', label: t('settings_page.menu_visibility.tabs.security') },
                                        { id: 'ai-features', label: t('settings_page.menu_visibility.tabs.ai_features') },
                                        { id: 'ask-questions', label: t('settings_page.menu_visibility.tabs.ask_questions') },
                                        { id: 'prompt-generation', label: t('settings_page.menu_visibility.tabs.prompt_generation') },
                                        { id: 'pull-requests', label: t('settings_page.menu_visibility.tabs.pull_requests') },
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
                                {t('settings_page.save_settings')}
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
