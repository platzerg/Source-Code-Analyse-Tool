"use client";

import { use } from "react";
import { ChevronLeft, Save, Trash2, Archive, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ProjectSettingsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    return (
        <div className="max-w-4xl mx-auto py-8 px-8">
            {/* Header */}
            <div className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
                <Link href={`/projects/${id}`} className="flex items-center hover:text-gray-900 transition-colors">
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back to Project
                </Link>
            </div>

            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Project Settings</h1>
                <p className="text-gray-500 mt-1">Manage project details and danger zone actions.</p>
            </div>

            <div className="space-y-8">
                {/* General Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>General Settings</CardTitle>
                        <CardDescription>Update the basic information of the project.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                            <input
                                type="text"
                                defaultValue="msg-zen-test-ai"
                                className="w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                rows={4}
                                defaultValue="AI-powered testing framework for automated regression testing and scenario generation."
                                className="w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
                            />
                        </div>
                        <div className="flex justify-end pt-2">
                            <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-black transition-colors text-sm font-medium">
                                <Save className="w-4 h-4" />
                                Save Changes
                            </button>
                        </div>
                    </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card className="border-red-200">
                    <CardHeader className="bg-red-50 rounded-t-lg border-b border-red-100">
                        <CardTitle className="text-red-800 flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5" />
                            Danger Zone
                        </CardTitle>
                        <CardDescription className="text-red-600/80">
                            Irreversible actions. Please proceed with caution.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-medium text-gray-900">Archive Project</h4>
                                <p className="text-sm text-gray-500">Mark this project as read-only. It can be unarchived later.</p>
                            </div>
                            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium">
                                <Archive className="w-4 h-4" />
                                Archive
                            </button>
                        </div>

                        <div className="border-t border-gray-100 pt-6 flex items-center justify-between">
                            <div>
                                <h4 className="font-medium text-gray-900">Delete Project</h4>
                                <p className="text-sm text-gray-500">Permanently remove this project and all its data. This cannot be undone.</p>
                            </div>
                            <button className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-md hover:bg-red-100 transition-colors text-sm font-medium">
                                <Trash2 className="w-4 h-4" />
                                Delete Project
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
