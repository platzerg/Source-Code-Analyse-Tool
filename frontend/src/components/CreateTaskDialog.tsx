"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

interface CreateTaskDialogProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    onTaskCreated: (task: any) => void;
}

export default function CreateTaskDialog({
    isOpen,
    onClose,
    projectId,
    onTaskCreated
}: CreateTaskDialogProps) {
    const { t } = useTranslation();
    const [title, setTitle] = useState("");
    const [assignee, setAssignee] = useState("");
    const [priority, setPriority] = useState("Medium");
    const [dueDate, setDueDate] = useState("");
    const [status, setStatus] = useState("Todo");
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = async () => {
        if (!title.trim()) {
            alert(t('project_detail.board.create_dialog.validation.title_required'));
            return;
        }

        setIsCreating(true);
        try {
            const newTask = {
                id: `t${Date.now()}`,
                title: title.trim(),
                status,
                assignee: assignee.trim() || "Unassigned",
                priority,
                due_date: dueDate || new Date().toISOString().split('T')[0]
            };

            const response = await fetch(`http://localhost:8000/api/v1/projects/${projectId}/tasks`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(newTask)
            });

            if (response.ok) {
                const createdTask = await response.json();
                onTaskCreated({
                    ...createdTask,
                    dueDate: createdTask.due_date
                });
                // Reset form
                setTitle("");
                setAssignee("");
                setPriority("Medium");
                setDueDate("");
                setStatus("Todo");
                onClose();
            } else {
                alert(t('project_detail.board.create_dialog.validation.error_create'));
            }
        } catch (error) {
            console.error("Error creating task:", error);
            alert(t('project_detail.board.create_dialog.validation.error_create'));
        } finally {
            setIsCreating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">{t('project_detail.board.create_dialog.title')}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('project_detail.board.create_dialog.labels.title')}
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={t('project_detail.board.create_dialog.placeholders.title')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800 focus:border-transparent"
                            autoFocus
                        />
                    </div>

                    {/* Assignee */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('project_detail.board.create_dialog.labels.assignee')}
                        </label>
                        <input
                            type="text"
                            value={assignee}
                            onChange={(e) => setAssignee(e.target.value)}
                            placeholder={t('project_detail.board.create_dialog.placeholders.assignee')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800 focus:border-transparent"
                        />
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('project_detail.board.create_dialog.labels.priority')}
                        </label>
                        <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800 focus:border-transparent"
                        >
                            <option value="Low">{t('project_detail.board.priority.low')}</option>
                            <option value="Medium">{t('project_detail.board.priority.medium')}</option>
                            <option value="High">{t('project_detail.board.priority.high')}</option>
                            <option value="Critical">{t('project_detail.board.priority.critical')}</option>
                        </select>
                    </div>

                    {/* Due Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('project_detail.board.create_dialog.labels.due_date')}
                        </label>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800 focus:border-transparent"
                        />
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('project_detail.board.create_dialog.labels.initial_status')}
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800 focus:border-transparent"
                        >
                            <option value="Todo">{t('project_detail.board.columns.todo')}</option>
                            <option value="In Progress">{t('project_detail.board.columns.in_progress')}</option>
                            <option value="Done">{t('project_detail.board.columns.done')}</option>
                        </select>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={isCreating || !title.trim()}
                        className="px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isCreating ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                {t('project_detail.board.create_dialog.submitting')}
                            </>
                        ) : (
                            <>
                                <Plus className="w-4 h-4" />
                                {t('project_detail.board.create_dialog.submit')}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
