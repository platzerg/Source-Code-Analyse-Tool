"use client";

import { useState } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, DragOverEvent, PointerSensor, useSensor, useSensors, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, GripVertical, User, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import CreateTaskDialog from "@/components/CreateTaskDialog";

interface Task {
    id: string;
    title: string;
    status: string;
    assignee: string;
    priority: string;
    due_date: string;
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
                            <span>{task.due_date}</span>
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
                            No tasks yet
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
    const [activeId, setActiveId] = useState<string | null>(null);
    const [overId, setOverId] = useState<string | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const columns = [
        { id: "Todo", title: "Todo" },
        { id: "In Progress", title: "In Progress" },
        { id: "Done", title: "Done" },
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
        const { active } = event;
        const taskId = active.id as string;
        const newStatus = overId;

        setActiveId(null);
        setOverId(null);

        if (!newStatus) return;

        // Find the task
        const task = tasks.find((t) => t.id === taskId);
        if (!task || task.status === newStatus) return;

        // Update task status locally
        const updatedTasks = tasks.map((t) =>
            t.id === taskId ? { ...t, status: newStatus } : t
        );
        onTasksUpdate(updatedTasks);

        // Update backend
        try {
            await fetch(`http://localhost:8000/api/v1/projects/${projectId}/tasks/${taskId}/status?status=${encodeURIComponent(newStatus)}`, {
                method: "PUT",
            });
        } catch (error) {
            console.error("Error updating task status:", error);
            // Revert on error
            onTasksUpdate(tasks);
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

    return (
        <div className="space-y-6">
            {/* Header with Add Task Button */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <input
                        type="text"
                        placeholder="Filter cards..."
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800 focus:border-transparent w-64"
                    />
                </div>
                <button
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 transition-colors font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Add Task
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
