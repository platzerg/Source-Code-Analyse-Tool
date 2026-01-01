"use client";

import { useState, useEffect } from "react";

import {
    Plus,
    Folder,
    Trash2,
    Eye,
    Calendar,
    Briefcase
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "@/lib/config";

interface Project {
    id: string;
    name: string;
    description: string;
    status: 'active' | 'archived' | 'planning';
    repositoryCount: number;
    updatedAt: string;
}

export default function ProjectsPage() {
    const { t } = useTranslation();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Deletion Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<Project | null>(null);

    const fetchProjects = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/projects`);
            if (!response.ok) throw new Error("Failed to fetch projects");
            const data = await response.json();

            const mappedProjects: Project[] = data.map((p: any) => ({
                id: String(p.id),
                name: p.name,
                description: p.description,
                status: p.status,
                repositoryCount: 0,
                updatedAt: p.start_date || new Date().toLocaleDateString()
            }));

            setProjects(mappedProjects);
        } catch (error) {
            console.error("Error fetching projects:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleDeleteClick = (project: Project) => {
        setItemToDelete(project);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/projects/${itemToDelete.id}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("Failed to delete project");

            setProjects(prev => prev.filter(p => p.id !== itemToDelete.id));
        } catch (error) {
            console.error("Error deleting project:", error);
            alert("Error deleting project. Please try again.");
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
        <div className="max-w-[1600px] mx-auto py-8 px-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('projects.title')}</h1>
                    <p className="text-gray-500 mt-1">{t('projects.subtitle', { count: projects.length })}</p>
                </div>
                <Link href="/projects/add" className="flex items-center space-x-2 px-4 py-2 bg-red-800 text-white rounded-lg shadow-sm hover:bg-red-900 transition-colors font-medium">
                    <Plus className="w-5 h-5" />
                    <span>{t('projects.add_button')}</span>
                </Link>
            </div>

            {/* Grid */}
            {projects.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">{t('projects.empty_state.title')}</h3>
                    <p className="text-gray-500">{t('projects.empty_state.description')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                        <Card key={project.id} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow group relative">
                            <CardContent className="p-6 flex flex-col h-full">
                                {/* Card Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-red-50 rounded-lg text-red-700">
                                        <Briefcase className="w-6 h-6" />
                                    </div>
                                    <span className={cn(
                                        "text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm",
                                        project.status.toLowerCase() === 'active' ? "bg-emerald-100 text-emerald-700" :
                                            project.status.toLowerCase() === 'planning' ? "bg-blue-100 text-blue-700" :
                                                "bg-gray-100 text-gray-600"
                                    )}>
                                        {project.status}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="mb-6 flex-1">
                                    <h3 className="font-bold text-gray-900 text-lg mb-2">{project.name}</h3>
                                    <p className="text-sm text-gray-500 line-clamp-2">{project.description}</p>
                                </div>

                                {/* Footer Info */}
                                <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                                    <div className="flex items-center gap-1">
                                        <Folder className="w-3.5 h-3.5" />
                                        <span>{t('projects.card.repos_count', { count: project.repositoryCount })}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>{project.updatedAt}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-auto">
                                    <Link href={`/projects/${project.id}`} className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-800 text-white text-xs font-medium rounded hover:bg-red-900 transition-colors">
                                        <Eye className="w-3 h-3" />
                                        <span>{t('projects.card.manage')}</span>
                                    </Link>
                                    <button
                                        onClick={() => handleDeleteClick(project)}
                                        className="text-gray-400 hover:text-red-700 transition-colors p-1"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
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
                title={t('projects.delete_modal.title')}
                description={`${t('projects.delete_modal.description')} "${itemToDelete?.name}"?`}
                itemName={itemToDelete?.name || ""}
            />
        </div>
    );
}
