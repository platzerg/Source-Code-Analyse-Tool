"use client";

import { useState } from "react";
import { Briefcase, User, AlignLeft, Calendar, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/config";

export default function AddProjectPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        owner: "",
        start_date: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [id]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {

            // ...

            // ...
            const response = await fetch(`${API_BASE_URL}/api/v1/projects`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description,
                    owner: formData.owner,
                    start_date: formData.start_date,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to create project");
            }

            // Redirect to projects list on success
            router.push("/projects");
        } catch (error) {
            console.error("Error creating project:", error);
            alert("Failed to create project. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-10 px-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Add Project</h1>
                <p className="text-gray-500 mt-1">Create a new project to organize your repositories and development efforts.</p>
            </div>

            <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-8">

                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Project Name */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                Project Name *
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Briefcase className="w-4 h-4" />
                                </span>
                                <input
                                    type="text"
                                    id="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full rounded-md border border-gray-300 py-2.5 pl-10 pr-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                                    placeholder="e.g. Migration to Cloud"
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">A clear and concise name for the project.</p>
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <div className="relative">
                                <textarea
                                    id="description"
                                    rows={4}
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="w-full rounded-md border border-gray-300 py-2.5 px-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all resize-none"
                                    placeholder="Describe the goals and scope of this project..."
                                />
                            </div>
                        </div>

                        {/* Project Owner */}
                        <div>
                            <label htmlFor="owner" className="block text-sm font-medium text-gray-700 mb-1">
                                Project Owner / Lead
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <User className="w-4 h-4" />
                                </span>
                                <input
                                    type="text"
                                    id="owner"
                                    value={formData.owner}
                                    onChange={handleChange}
                                    className="w-full rounded-md border border-gray-300 py-2.5 pl-10 pr-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>

                        {/* Start Date */}
                        <div>
                            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                                Start Date
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Calendar className="w-4 h-4" />
                                </span>
                                <input
                                    type="date"
                                    id="start_date"
                                    value={formData.start_date}
                                    onChange={handleChange}
                                    className="w-full rounded-md border border-gray-300 py-2.5 pl-10 pr-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-100">
                            <Link href="/projects" className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200">
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-5 py-2.5 text-sm font-medium text-white bg-red-800 rounded-lg hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-900 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                {isLoading ? "Creating..." : "Create Project"}
                            </button>
                        </div>

                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
