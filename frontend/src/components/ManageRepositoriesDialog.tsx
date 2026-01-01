"use client";

import { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { API_BASE_URL } from "@/lib/config";

interface Repository {
    id: number;
    name: string;
    url: string;
}

interface ManageRepositoriesDialogProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    currentRepositoryIds: number[];
    onSave: (repositoryIds: number[]) => void;
}

export default function ManageRepositoriesDialog({
    isOpen,
    onClose,
    projectId,
    currentRepositoryIds,
    onSave
}: ManageRepositoriesDialogProps) {
    const [allRepositories, setAllRepositories] = useState<Repository[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>(currentRepositoryIds);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchRepositories();
            setSelectedIds(currentRepositoryIds);
        }
    }, [isOpen, currentRepositoryIds]);

    const fetchRepositories = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/repositories`);
            if (response.ok) {
                const data = await response.json();
                setAllRepositories(data);
            }
        } catch (error) {
            console.error("Error fetching repositories:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleRepository = (repoId: number) => {
        if (selectedIds.includes(repoId)) {
            setSelectedIds(selectedIds.filter(id => id !== repoId));
        } else {
            setSelectedIds([...selectedIds, repoId]);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/projects/${projectId}/repositories`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(selectedIds)
            });

            if (response.ok) {
                onSave(selectedIds);
                onClose();
            }
        } catch (error) {
            console.error("Error saving repositories:", error);
            alert("Failed to save repositories. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Manage Repositories</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Select repositories to link with this project
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-800"></div>
                        </div>
                    ) : allRepositories.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            No repositories available
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {allRepositories.map((repo) => {
                                const isSelected = selectedIds.includes(repo.id);
                                return (
                                    <label
                                        key={repo.id}
                                        className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${isSelected
                                            ? "border-red-800 bg-red-50"
                                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                            }`}
                                    >
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleRepository(repo.id)}
                                                className="sr-only"
                                            />
                                            <div
                                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isSelected
                                                    ? "bg-red-800 border-red-800"
                                                    : "border-gray-300 bg-white"
                                                    }`}
                                            >
                                                {isSelected && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900">{repo.name}</div>
                                            <div className="text-xs text-gray-500 truncate">{repo.url}</div>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
                    <div className="text-sm text-gray-600">
                        {selectedIds.length} {selectedIds.length === 1 ? "repository" : "repositories"} selected
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
