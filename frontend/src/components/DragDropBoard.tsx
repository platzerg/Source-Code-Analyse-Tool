"use client";

import { useState, useEffect } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, DragOverEvent, PointerSensor, useSensor, useSensors, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, GripVertical, User, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import CreateTaskDialog from "@/components/CreateTaskDialog";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "@/lib/config";

interface Task {
    id: string;
    title: string;
    status: 'Todo' | 'In Progress' | 'Done';
    assignee: string;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    dueDate: string;
}

interface DragDropBoardProps {
    projectId: string;
    tasks: Task[];
    onTasksUpdate: (tasks: Task[]) => void;
}

function DraggableTask({ task }: { task: Task }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const priorityColors = {
        Critical: "bg-red-100 text-red-700 border-red-300",
        High: "bg-orange-100 text-orange-700 border-orange-300",
        Medium: "bg-yellow-100 text-yellow-700 border-yellow-300",
        Low: "bg-blue-100 text-blue-700 border-blue-300",
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-white border border-gray-200 rounded-lg p-3 mb-2 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
        >
            <div className="flex items-start gap-2">
                <div {...attributes} {...listeners} className="mt-1 text-gray-400 hover:text-gray-600 cursor-grab">
                    <GripVertical className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm mb-2">{task.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{task.assignee}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{task.dueDate}</span>
                        </div>
                    </div>
                    <div className="mt-2">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${priorityColors[task.priority as keyof typeof priorityColors] || priorityColors.Medium}`}>
                            {task.priority}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Column({ id, title, tasks, count, isOver }: { id: string; title: string; tasks: Task[]; count: number; isOver: boolean }) {
    const { setNodeRef } = useDroppable({ id });
    const { t } = useTranslation();

    return (
        <div
            ref={setNodeRef}
            className={`bg-gray-50 rounded-lg p-4 min-h-[500px] transition-colors ${isOver ? 'bg-blue-50 ring-2 ring-blue-400' : ''}`}
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{title}</h3>
                <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded">
                    {count}
                </span>
            </div>
            <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                    {tasks.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 text-sm">
                            {t('project_detail.board.empty_column')}
                        </div>
                    ) : (
                        tasks.map((task) => <DraggableTask key={task.id} task={task} />)
                    )}
                </div>
            </SortableContext>
        </div>
    );
}

export default function DragDropBoard({ projectId, tasks, onTasksUpdate }: DragDropBoardProps) {
    const { t } = useTranslation();
    const [activeId, setActiveId] = useState<string | null>(null);
    const [overId, setOverId] = useState<string | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Moved mounted check to bottom to avoid hook errors

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const columns = [
        { id: "Todo", title: t('project_detail.board.columns.todo') },
        { id: "In Progress", title: t('project_detail.board.columns.in_progress') },
        { id: "Done", title: t('project_detail.board.columns.done') },
    ];

    const getTasksByStatus = (status: string) => {
        return tasks.filter((task) => task.status === status);
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { over } = event;

        if (!over) {
            setOverId(null);
            return;
        }

        // Check if over is a column
        const columnId = columns.find(col => col.id === over.id)?.id;
        if (columnId) {
            setOverId(columnId);
            return;
        }

        // If over a task, find which column it belongs to
        const overTask = tasks.find(t => t.id === over.id);
        if (overTask) {
            setOverId(overTask.status);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) {
            setActiveId(null);
            setOverId(null);
            return;
        }

        const activeId = active.id as string;
        const overId = over.id as string;

        // Reset drag state
        setActiveId(null);
        setOverId(null);

        // Find active task
        const activeTask = tasks.find(t => t.id === activeId);
        if (!activeTask) return;

        // 1. Determine new Status
        let newStatus = activeTask.status;

        // Check if over is a column
        const overColumn = columns.find(col => col.id === overId);
        if (overColumn) {
            newStatus = overColumn.id as Task['status'];
            // If dropping on a column container directly, we usually append to end, 
            // but the arrayMove logic below handles "position" better if we treat it as reordering the whole list?
            // Actually, if moving to empty column, we just change status.
        } else {
            // Over another task
            const overTask = tasks.find(t => t.id === overId);
            if (overTask) {
                newStatus = overTask.status;
            }
        }

        // 2. Reorder Logic
        if (activeId !== overId) {
            const oldIndex = tasks.findIndex(t => t.id === activeId);
            const newIndex = tasks.findIndex(t => t.id === overId);

            let newTasks = [...tasks];

            // If changing status, we update the status first
            if (activeTask.status !== newStatus) {
                // If we are over a column, we might not have a valid 'overId' that is a task index.
                // In that case newIndex might be -1.

                // Construct updated task
                const updatedTask = { ...activeTask, status: newStatus };

                // Replace in array
                newTasks[oldIndex] = updatedTask; // Temporarily update in place

                // If we dropped over another task, we might want to move it to that position too.
                // But mixing "change status" and "move index" on a flat array is complex.
                // Simplified strategy: Update status, and if dropped on a task, move to that task's index.

                if (newIndex !== -1) {
                    newTasks = arrayMove(newTasks, oldIndex, newIndex);
                } else {
                    // Dropped on column (empty or end), just move to end of that column visually?
                    // In a flat list, order matters relative to others. 
                    // Moving to end of array might put it at end of column.
                    newTasks = arrayMove(newTasks, oldIndex, newTasks.length - 1);
                }
            } else {
                // Same column reordering
                if (newIndex !== -1) {
                    newTasks = arrayMove(tasks, oldIndex, newIndex);
                }
            }

            onTasksUpdate(newTasks);

            // Backend Update (Status only for now, unless we add position API)
            if (activeTask.status !== newStatus) {
                try {
                    await fetch(`${API_BASE_URL}/api/v1/projects/${projectId}/tasks/${activeId}/status?status=${encodeURIComponent(newStatus)}`, {
                        method: "PUT",
                    });
                } catch (error) {
                    console.error("Error updating task status:", error);
                }
            }
        }
    };

    const handleDragCancel = () => {
        setActiveId(null);
        setOverId(null);
    };

    const handleTaskCreated = (newTask: Task) => {
        onTasksUpdate([...tasks, newTask]);
    };

    const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

    if (!mounted) return null;

    return (
        <div className="space-y-6">
            {/* Header with Add Task Button */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <input
                        type="text"
                        placeholder={t('project_detail.board.filter_placeholder')}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800 focus:border-transparent w-64"
                    />
                </div>
                <button
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 transition-colors font-medium"
                >
                    <Plus className="w-4 h-4" />
                    {t('project_detail.board.add_task')}
                </button>
            </div>

            {/* Board */}
            <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
            >
                <div className="grid grid-cols-3 gap-6">
                    {columns.map((column) => (
                        <Column
                            key={column.id}
                            id={column.id}
                            title={column.title}
                            tasks={getTasksByStatus(column.id)}
                            count={getTasksByStatus(column.id).length}
                            isOver={overId === column.id}
                        />
                    ))}
                </div>

                <DragOverlay>
                    {activeTask ? (
                        <div className="bg-white border-2 border-red-800 rounded-lg p-3 shadow-lg opacity-90">
                            <h4 className="font-medium text-gray-900 text-sm">{activeTask.title}</h4>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* Create Task Dialog */}
            <CreateTaskDialog
                isOpen={isCreateDialogOpen}
                onClose={() => setIsCreateDialogOpen(false)}
                projectId={projectId}
                onTaskCreated={handleTaskCreated}
            />
        </div>
    );
}
