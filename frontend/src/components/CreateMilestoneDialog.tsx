"use client";

import { useState, useEffect } from "react";
import { X, Plus, Calendar } from "lucide-react";

interface MilestoneData {
    label: string;
    date: string;
    end_date?: string | null;
    progress: number;
}

interface CreateMilestoneDialogProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    onMilestoneCreated: (milestone: any) => void;
    onMilestoneUpdated?: (oldLabel: string, milestone: any) => void;
    initialData?: MilestoneData | null;
}

export default function CreateMilestoneDialog({
    isOpen,
    onClose,
    projectId,
    onMilestoneCreated,
    onMilestoneUpdated,
    initialData
}: CreateMilestoneDialogProps) {
    const isEditMode = !!initialData;

    const [label, setLabel] = useState(initialData?.label || "");
    const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(initialData?.end_date || "");
    const [progress, setProgress] = useState(initialData?.progress || 0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset or Sync when opening
    useEffect(() => {
        if (isOpen && initialData) {
            setLabel(initialData.label);
            setDate(initialData.date);
            setEndDate(initialData.end_date || "");
            setProgress(initialData.progress);
        } else if (isOpen && !initialData) {
            setLabel("");
            setDate(new Date().toISOString().split('T')[0]);
            setEndDate("");
            setProgress(0);
        }
    }, [isOpen, initialData]);

    const handleSubmit = async () => {
        if (!label.trim()) {
            alert("Please enter a milestone label");
            return;
        }

        setIsSubmitting(true);
        try {
            const milestonePayload = {
                label: label.trim(),
                date,
                end_date: endDate || null,
                progress: parseInt(progress.toString())
            };

            const url = isEditMode
                ? `http://localhost:8000/api/v1/projects/${projectId}/milestones/${encodeURIComponent(initialData.label)}`
                : `http://localhost:8000/api/v1/projects/${projectId}/milestones`;

            const method = isEditMode ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(milestonePayload)
            });

            if (response.ok) {
                const resultMilestone = isEditMode ? await response.json() : await response.json();

                if (isEditMode && onMilestoneUpdated) {
                    onMilestoneUpdated(initialData.label, resultMilestone);
                } else {
                    onMilestoneCreated(resultMilestone);
                }

                // Reset form
                setLabel("");
                setDate(new Date().toISOString().split('T')[0]);
                setEndDate("");
                setProgress(0);
                onClose();
            } else {
                alert(`Failed to ${isEditMode ? 'update' : 'create'} milestone. Please try again.`);
            }
        } catch (error) {
            console.error(`Error ${isEditMode ? 'updating' : 'creating'} milestone:`, error);
            alert(`Failed to ${isEditMode ? 'update' : 'create'} milestone. Please try again.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">{isEditMode ? "Edit Milestone" : "Create New Milestone"}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Label */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Milestone Label *
                        </label>
                        <input
                            type="text"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            placeholder="e.g., v2.0 Release"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800 focus:border-transparent"
                            autoFocus
                        />
                    </div>

                    {/* Target Date (Start) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Start Date
                        </label>
                        <div className="relative">
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800 focus:border-transparent"
                            />
                            <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        </div>
                    </div>

                    {/* End Date (Optional) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            End Date (Optional)
                        </label>
                        <div className="relative">
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                min={date}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800 focus:border-transparent"
                            />
                            <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        </div>
                    </div>

                    {/* Progress */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Progress (%)
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={progress}
                                onChange={(e) => setProgress(parseInt(e.target.value))}
                                className="flex-1"
                            />
                            <span className="text-sm font-medium text-gray-700 w-12 text-right">
                                {progress}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !label.trim()}
                        className="px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                {isEditMode ? "Saving..." : "Creating..."}
                            </>
                        ) : (
                            <>
                                <Plus className="w-4 h-4" />
                                {isEditMode ? "Save Changes" : "Create Milestone"}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
