"use client";

import { useState, useMemo, useEffect } from "react";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, useDraggable } from "@dnd-kit/core";
import { Plus, GripVertical, Calendar, Settings2, RotateCcw } from "lucide-react";
import CreateMilestoneDialog from "@/components/CreateMilestoneDialog";
import * as Popover from '@radix-ui/react-popover';
import { Trash2, Edit, MoreHorizontal, GripHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "@/lib/config";

interface Milestone {
    label: string;
    start_date: string; // ISO date string (YYYY-MM-DD)
    end_date?: string;
    progress: number;
}

interface DragDropRoadmapProps {
    projectId: string;
    milestones: Milestone[];
    onMilestonesUpdate: (milestones: Milestone[]) => void;
}

interface TimelineConfig {
    startDate: Date;
    endDate: Date;
}

function getQuarterInfo(date: Date): { quarter: number; year: number } {
    const month = date.getMonth();
    const quarter = Math.floor(month / 3) + 1;
    return { quarter, year: date.getFullYear() };
}

function formatMonthYear(date: Date): string {
    return date.toLocaleDateString('de-DE', { month: 'short', year: 'numeric' });
}

function formatDate(dateStr: string): string {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}



export default function DragDropRoadmap({ projectId, milestones, onMilestonesUpdate }: DragDropRoadmapProps) {
    const { t } = useTranslation();
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Moved mounted check to bottom to avoid hook errors

    // Timeline Settings State
    const [isAutoFit, setIsAutoFit] = useState(true);
    const [manualStartDate, setManualStartDate] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
    });
    const [manualEndDate, setManualEndDate] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
    });

    const [dragPosition, setDragPosition] = useState<number | null>(null);

    // Calculate timeline range
    const timelineConfig = useMemo<TimelineConfig>(() => {
        if (!isAutoFit) {
            return {
                startDate: new Date(manualStartDate),
                endDate: new Date(manualEndDate)
            };
        }

        if (milestones.length === 0) {
            const now = new Date();
            const start = new Date(now.getFullYear(), 0, 1);
            const end = new Date(now.getFullYear() + 1, 11, 31);
            return { startDate: start, endDate: end };
        }

        const allDates = milestones.flatMap(m => {
            const dates = [new Date(m.start_date)];
            if (m.end_date) dates.push(new Date(m.end_date));
            return dates;
        });

        const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));

        // Add padding (3 months before and after)
        const start = new Date(minDate);
        start.setMonth(start.getMonth() - 3);
        const end = new Date(maxDate);
        end.setMonth(end.getMonth() + 3);

        return { startDate: start, endDate: end };
    }, [milestones, isAutoFit, manualStartDate, manualEndDate]);

    // Generate quarter markers
    const quarterMarkers = useMemo(() => {
        const markers: Array<{ label: string; position: number; date: Date }> = [];
        const current = new Date(timelineConfig.startDate);

        // Align to start of quarter
        const startQuarter = Math.floor(current.getMonth() / 3);
        current.setMonth(startQuarter * 3, 1);

        const totalMs = timelineConfig.endDate.getTime() - timelineConfig.startDate.getTime();

        // Safety check to prevent infinite loop if range is invalid
        if (totalMs <= 0) return [];

        // Loop until we reach the end date
        // Use a safety counter to prevent infinite loops in case of weird date math
        let safetyCounter = 0;
        while (current <= timelineConfig.endDate && safetyCounter < 1000) {
            // Only add if within range (or close enough)
            if (current >= timelineConfig.startDate) {
                const { quarter, year } = getQuarterInfo(current);
                const position = ((current.getTime() - timelineConfig.startDate.getTime()) / totalMs) * 100;

                markers.push({
                    label: `Q${quarter} ${year}`,
                    position,
                    date: new Date(current)
                });
            }

            current.setMonth(current.getMonth() + 3);
            safetyCounter++;
        }

        return markers;
    }, [timelineConfig]);

    // Calculate milestone positions
    // Updated to return start/end/width for ranges
    const milestonePositions = useMemo(() => {
        const totalMs = timelineConfig.endDate.getTime() - timelineConfig.startDate.getTime();
        if (totalMs <= 0) return [];

        // Deduplicate by label to prevent key collisions
        const uniqueMilestones = Array.from(new Map(milestones.map(m => [m.label, m])).values());

        const positions = uniqueMilestones.map(m => {
            const startDate = new Date(m.start_date);
            const startPercent = ((startDate.getTime() - timelineConfig.startDate.getTime()) / totalMs) * 100;

            let endPercent = undefined;
            let widthPercent = undefined;

            if (m.end_date) {
                const endDate = new Date(m.end_date);
                endPercent = ((endDate.getTime() - timelineConfig.startDate.getTime()) / totalMs) * 100;
                widthPercent = endPercent - startPercent;
            }


            // Visibility check (looser for ranges)
            if (m.end_date) {
                if ((endPercent! < 0) || (startPercent > 100)) return null;
            } else {
                if (startPercent < -5 || startPercent > 105) return null;
            }

            return {
                milestone: m,
                startPercent,
                endPercent,
                widthPercent
            };
        }).filter(Boolean) as Array<{
            milestone: Milestone;
            startPercent: number;
            endPercent?: number;
            widthPercent?: number;
        }>;

        return positions;
    }, [milestones, timelineConfig]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragStart = (id: string) => {
        setActiveId(id);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { delta, active } = event;
        setActiveId(null);
        setDragPosition(null);

        // We need to calculate position based on the delta
        // But since we are using custom drag logic, we probably used the delta in a different way?
        // Wait, dnd-kit gives us delta x/y pixels. We need to convert that to % of timeline.
        // This is tricky without a ref to the container.
        // Instead, let's just use the fact that the DraggableMilestone tracks its own position?
        // Actually, dnd-kit is for drag and drop between containers. For a slider/timeline, maybe standard HTML5 drag or just pointer events is better?
        // But let's stick to dnd-kit since it's already here.

        // ISSUE: In the previous implementation I didn't actually implement the position calculation logic in handleDragEnd!
        // I used `dragPosition` state but didn't update it anywhere.

        // Let's rely on simple pointer events for the timeline dragging if dnd-kit is overkill for 1D sliding without droppables.
        // OR better: use dnd-kit's `useDraggable` properly?
        // The previous code had `DraggableMilestone` but didn't use `useDraggable`.

        // Let's implement a simpler approach: When drag ends, we check the new position.
        // But we don't know the container width here easily.

        // Alternative: Use a standard range slider input? No, multiple handles.

        // Let's go with a simple ref-based calculation.
    };

    // Changing approach for Drag:
    // We'll use a ref on the timeline container to calculate percentages.
    const [timelineRef, setTimelineRef] = useState<HTMLDivElement | null>(null);

    const onPointerDown = (e: React.PointerEvent, milestoneId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setActiveId(milestoneId);

        const startX = e.clientX;
        // Find initial position logic would be needed here

        // This is getting complex for a "quick" fix.
        // Let's use standard dnd-kit `useDraggable` which gives `transform`.
    };

    // Re-implementing with proper Draggable
    // But for now, let's fix the logic flow first.
    // The previous implementation was half-baked on drag logic.

    // Let's stick to the visual update first and assume standard Drag operations will be added.
    // I will add the Date Range Controls first, as that was the main task.
    // I will leave the Drag Logic placeholder to be properly implemented or fixed if I can.

    // Actually, I can use the dnd-kit `delta.x` and the container width.
    const [activeDragDate, setActiveDragDate] = useState<{ date: Date; percent: number; type: 'start' | 'end' | 'move' } | null>(null);

    const handleDragMove = (event: any) => {
        const { active, delta } = event;
        if (!active || !timelineRef) return;

        const containerWidth = timelineRef.offsetWidth;
        // We need the initial position of the item to calculate absolute position
        // This is hard with just delta. 
        // Strategy: Use the known storage of milestone positions!

        const activeIdStr = String(active.id);
        let label = activeIdStr;
        if (activeIdStr.startsWith('body-')) label = activeIdStr.replace('body-', '');
        else if (activeIdStr.startsWith('left-')) label = activeIdStr.replace('left-', '');
        else if (activeIdStr.startsWith('right-')) label = activeIdStr.replace('right-', '');

        const milestonePos = milestonePositions.find(p => p.milestone.label === label);
        if (!milestonePos) return;

        // Calculate current percent
        let basePercent = 0;
        if (activeIdStr.startsWith('right-')) {
            if (milestonePos.endPercent) basePercent = milestonePos.endPercent;
            else basePercent = milestonePos.startPercent; // Fallback?
        } else {
            basePercent = milestonePos.startPercent;
        }

        const deltaPercent = (delta.x / containerWidth) * 100;
        const currentPercent = basePercent + deltaPercent;

        // Convert percent to date
        const totalMs = timelineConfig.endDate.getTime() - timelineConfig.startDate.getTime();
        const time = timelineConfig.startDate.getTime() + (currentPercent / 100) * totalMs;
        const date = new Date(time);

        let type: 'start' | 'end' | 'move' = 'move';
        if (activeIdStr.startsWith('left-')) type = 'start';
        else if (activeIdStr.startsWith('right-')) type = 'end';

        setActiveDragDate({ date, percent: currentPercent, type });
    };

    const handleDragEndReal = async (event: DragEndEvent) => {
        setActiveDragDate(null);
        // ... rest of existing handleDragEndReal logic
        const { active, delta } = event;
        setActiveId(null);

        if (!timelineRef) return;

        const containerWidth = timelineRef.offsetWidth;
        const deltaPercent = (delta.x / containerWidth) * 100;

        // Parse ID to determine type (body, left, right)
        // IDs: body-{label}, left-{label}, right-{label}
        // Legacy: {label} (from DraggableMilestoneWrapper for simple points if I messed up ids... check wrapper)
        // Wrapper now uses: body-{label}, left-{label}, right-{label}
        // Wait, wrapper point render uses bodyDrag with id `body-{label}`.

        const activeIdStr = String(active.id);
        let type = 'body';
        let label = activeIdStr;

        if (activeIdStr.startsWith('body-')) {
            type = 'body';
            label = activeIdStr.replace('body-', '');
        } else if (activeIdStr.startsWith('left-')) {
            type = 'left';
            label = activeIdStr.replace('left-', '');
        } else if (activeIdStr.startsWith('right-')) {
            type = 'right';
            label = activeIdStr.replace('right-', '');
        } else {
            // Fallback for legacy or direct label usage
            label = activeIdStr;
        }

        const milestone = milestones.find(m => m.label === label);
        if (!milestone) return;

        const totalMs = timelineConfig.endDate.getTime() - timelineConfig.startDate.getTime();

        let newDateStr = milestone.start_date;
        let newEndDateStr = milestone.end_date;

        if (type === 'body') {
            // Move entire block
            const currentDate = new Date(milestone.start_date);
            const currentPercent = ((currentDate.getTime() - timelineConfig.startDate.getTime()) / totalMs) * 100;
            const newPercent = Math.max(0, Math.min(100, currentPercent + deltaPercent));
            const newTime = timelineConfig.startDate.getTime() + (newPercent / 100) * totalMs;

            const timeDiff = newTime - currentDate.getTime();
            newDateStr = new Date(newTime).toISOString().split('T')[0];

            if (milestone.end_date) {
                const currentEnd = new Date(milestone.end_date);
                newEndDateStr = new Date(currentEnd.getTime() + timeDiff).toISOString().split('T')[0];
            }
        } else if (type === 'left') {
            // Resize start
            const currentDate = new Date(milestone.start_date);
            const currentPercent = ((currentDate.getTime() - timelineConfig.startDate.getTime()) / totalMs) * 100;
            const newPercent = Math.max(0, Math.min(100, currentPercent + deltaPercent)); // SHOULD constrain < end
            const newTime = timelineConfig.startDate.getTime() + (newPercent / 100) * totalMs;

            // Constrain: Start must be before End
            if (milestone.end_date) {
                const endDate = new Date(milestone.end_date);
                if (newTime >= endDate.getTime()) return; // Prevent crossing
            }

            newDateStr = new Date(newTime).toISOString().split('T')[0];
        } else if (type === 'right') {
            // Resize end
            if (!milestone.end_date) return; // Should not happen

            const currentEnd = new Date(milestone.end_date);
            const currentPercent = ((currentEnd.getTime() - timelineConfig.startDate.getTime()) / totalMs) * 100;
            const newPercent = Math.max(0, Math.min(100, currentPercent + deltaPercent));
            const newTime = timelineConfig.startDate.getTime() + (newPercent / 100) * totalMs;

            // Constrain: End must be after Start
            const startDate = new Date(milestone.start_date);
            if (newTime <= startDate.getTime()) return;

            newEndDateStr = new Date(newTime).toISOString().split('T')[0];
        }

        if (newDateStr === milestone.start_date && newEndDateStr === milestone.end_date) return;

        // Optimistic update
        const updatedMilestone = { ...milestone, start_date: newDateStr, end_date: newEndDateStr };
        const updatedMilestones = milestones.map(m =>
            m.label === label ? updatedMilestone : m
        );
        onMilestonesUpdate(updatedMilestones);

        // Backend update via generic PUT
        try {
            await fetch(`${API_BASE_URL}/api/v1/projects/${projectId}/milestones/${encodeURIComponent(label)}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedMilestone)
            });
        } catch (error) {
            console.error("Error updating milestone:", error);
            onMilestonesUpdate(milestones);
        }
    };

    const handleDragCancel = () => {
        setActiveId(null);
        setActiveDragDate(null);
    };

    const handleMilestoneCreated = (newMilestone: Milestone) => {
        onMilestonesUpdate([...milestones, newMilestone]);
    };

    const [milestoneToDelete, setMilestoneToDelete] = useState<string | null>(null);

    const onRequestDelete = (label: string) => {
        setMilestoneToDelete(label);
    };

    const confirmDelete = async () => {
        if (!milestoneToDelete) return;

        const label = milestoneToDelete;
        setMilestoneToDelete(null); // Close dialog immediately

        // Optimistic update
        const updated = milestones.filter(m => m.label !== label);
        onMilestonesUpdate(updated);

        try {
            await fetch(`${API_BASE_URL}/api/v1/projects/${projectId}/milestones/${encodeURIComponent(label)}`, {
                method: "DELETE"
            });
        } catch (error) {
            console.error("Failed to delete milestone:", error);
        }
    };

    const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);

    const handleEditStart = (milestone: Milestone) => {
        setEditingMilestone(milestone);
        setIsCreateDialogOpen(true);
    };

    const handleEditSave = (oldLabel: string, updatedMilestone: Milestone) => {
        // Optimistic update
        const updated = milestones.map(m => m.label === oldLabel ? updatedMilestone : m);
        onMilestonesUpdate(updated);
        setEditingMilestone(null);
    };

    const handleDialogClose = () => {
        setIsCreateDialogOpen(false);
        setEditingMilestone(null);
    };

    // Calculate dynamic minimum width based on duration
    const containerMinWidth = useMemo(() => {
        const totalMs = timelineConfig.endDate.getTime() - timelineConfig.startDate.getTime();
        const totalDays = totalMs / (1000 * 60 * 60 * 24);
        const minPixelsPerDay = 3; // Adjust density here
        return Math.max(800, totalDays * minPixelsPerDay); // Minimum 800px or calculated width
    }, [timelineConfig]);

    if (!mounted) return null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">{t('project_detail.roadmap.title')}</h3>
                    <p className="text-sm text-gray-500">{t('project_detail.roadmap.subtitle')}</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        <Settings2 className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => {
                            setEditingMilestone(null);
                            setIsCreateDialogOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 transition-colors font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        {t('project_detail.roadmap.add_milestone')}
                    </button>
                </div>
            </div>

            {/* Timeline Settings */}
            {showSettings && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center gap-6 animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">{t('project_detail.roadmap.settings.range_mode')}</label>
                        <button
                            onClick={() => setIsAutoFit(!isAutoFit)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isAutoFit ? 'bg-blue-100 text-blue-700' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            {isAutoFit ? t('project_detail.roadmap.settings.auto_fit') : t('project_detail.roadmap.settings.manual')}
                        </button>
                    </div>

                    {!isAutoFit && (
                        <>
                            <div className="w-px h-6 bg-gray-300" />
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <label className="text-sm text-gray-600">{t('project_detail.roadmap.settings.start')}</label>
                                    <input
                                        type="date"
                                        value={manualStartDate}
                                        onChange={(e) => setManualStartDate(e.target.value)}
                                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-sm text-gray-600">{t('project_detail.roadmap.settings.end')}</label>
                                    <input
                                        type="date"
                                        value={manualEndDate}
                                        onChange={(e) => setManualEndDate(e.target.value)}
                                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Timeline (Gantt View) */}
            <DndContext
                sensors={sensors}
                onDragStart={({ active }) => handleDragStart(active.id as string)}
                onDragMove={handleDragMove}
                onDragEnd={handleDragEndReal}
                onDragCancel={handleDragCancel}
            >
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col relative z-0 overflow-hidden">
                    <div className="overflow-x-auto custom-scrollbar">
                        <div style={{ minWidth: `${containerMinWidth}px` }} className="flex flex-col">
                            {/* Header Axis */}
                            <div className="relative h-12 bg-gray-50 border-b border-gray-200 rounded-t-lg" ref={setTimelineRef}>
                                {/* Quarter markers (Top Axis) */}
                                {quarterMarkers.map((marker, idx) => (
                                    <div
                                        key={idx}
                                        style={{ left: `${marker.position}%` }}
                                        className="absolute top-0 bottom-0 border-l border-gray-300 pl-1"
                                    >
                                        <span className="text-xs font-semibold text-gray-500 block mt-1">{marker.label}</span>
                                    </div>
                                ))}

                                {/* Date Indicator (Active Drag) */}
                                {activeDragDate && (
                                    <div
                                        className="absolute top-0 bottom-0 border-l-2 border-red-600 z-30 flex flex-col items-center pointer-events-none"
                                        style={{ left: `${activeDragDate.percent}%` }}
                                    >
                                        <div className="bg-red-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm mt-0.5 whitespace-nowrap">
                                            {formatDate(activeDragDate.date.toISOString())}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Gantt Body */}
                            <div className="relative min-h-[300px]">
                                {/* Background Grid Lines */}
                                <div className="absolute inset-0 pointer-events-none">
                                    {quarterMarkers.map((marker, idx) => (
                                        <div
                                            key={idx}
                                            style={{ left: `${marker.position}%` }}
                                            className="absolute top-0 bottom-0 border-l border-dashed border-gray-200"
                                        />
                                    ))}
                                </div>

                                {/* Rows */}
                                <div className="divide-y divide-gray-100 relative">
                                    {milestonePositions.map((pos) => (
                                        <div key={pos.milestone.label} className="h-16 relative">
                                            {/* Row background hover effect */}
                                            <div className="absolute inset-0 hover:bg-gray-50 transition-colors pointer-events-none" />

                                            {/* The Milestone Bar */}
                                            <DraggableMilestoneWrapper
                                                milestone={pos.milestone}
                                                startPercent={pos.startPercent}
                                                endPercent={pos.endPercent}
                                                widthPercent={pos.widthPercent}
                                                onDelete={onRequestDelete}
                                                onEditStart={handleEditStart}
                                                isInRow={true}
                                            />
                                        </div>
                                    ))}

                                    {/* Empty State placeholder */}
                                    {milestones.length === 0 && (
                                        <div className="h-32 flex items-center justify-center text-gray-400">
                                            {t('project_detail.roadmap.empty_state')}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* Footer Labels - Inside Scroll Container so they align with content */}
                            <div className="bg-gray-50 border-t border-gray-200 p-2 flex justify-between text-xs text-gray-400 font-medium rounded-b-lg">
                                <span>{formatMonthYear(timelineConfig.startDate)}</span>
                                <span>{formatMonthYear(timelineConfig.endDate)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </DndContext>

            {/* Create/Edit Milestone Dialog */}
            <CreateMilestoneDialog
                isOpen={isCreateDialogOpen}
                onClose={handleDialogClose}
                projectId={projectId}
                onMilestoneCreated={handleMilestoneCreated}
                onMilestoneUpdated={handleEditSave}
                initialData={editingMilestone}
            />

            {/* Delete Confirmation Dialog */}
            {milestoneToDelete && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{t('project_detail.roadmap.delete_modal.title')}</h3>
                        <p className="text-gray-600 mb-6">
                            {t('project_detail.roadmap.delete_modal.description')} "{milestoneToDelete}"? {t('common.cannot_undone')}
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setMilestoneToDelete(null)}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm"
                            >
                                {t('common.delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}



function DraggableMilestoneWrapper({
    milestone,
    startPercent,
    widthPercent,
    onDelete,
    onEditStart, // Changed from onUpdate to onEditStart
    isInRow
}: {
    milestone: Milestone;
    startPercent: number;
    endPercent?: number;  // Only for range usage
    widthPercent?: number; // Only for range usage
    onDelete: (label: string) => void;
    onEditStart: (milestone: Milestone) => void; // New prop signature
    isInRow?: boolean;
}) {
    const { t } = useTranslation();
    // We maintain 3 draggables: Body, Left Handle, Right Handle
    const bodyDrag = useDraggable({ id: `body-${milestone.label}`, data: { type: 'body', label: milestone.label } });
    const leftDrag = useDraggable({ id: `left-${milestone.label}`, data: { type: 'left', label: milestone.label } });
    const rightDrag = useDraggable({ id: `right-${milestone.label}`, data: { type: 'right', label: milestone.label } });

    const isRange = !!milestone.end_date;

    const getProgressColor = (progress: number) => {
        if (progress === 100) return "bg-emerald-500";
        if (progress >= 50) return "bg-blue-500";
        return "bg-gray-400";
    };

    // Top offset for row centering
    const topStyle = isInRow ? 'top-1/2 -translate-y-1/2' : 'top-10';
    const heightStyle = isInRow ? 'h-10' : 'h-16';

    const ActionButtons = () => (
        <div className="absolute top-1/2 -translate-y-1/2 -right-9 opacity-0 group-hover:opacity-100 flex flex-col gap-1 z-50 pointer-events-auto transition-opacity"
            onPointerDown={(e) => e.stopPropagation()}
        >
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onEditStart(milestone);
                }}
                className="bg-white border border-gray-200 rounded-full p-1.5 shadow-sm hover:bg-blue-50 text-blue-600 transition-colors"
                title={t('project_detail.roadmap.tooltip.edit')}
            >
                <Edit className="w-3.5 h-3.5" />
            </button>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(milestone.label);
                }}
                className="bg-white border border-gray-200 rounded-full p-1.5 shadow-sm hover:bg-red-50 text-red-600 transition-colors"
                title={t('project_detail.roadmap.tooltip.delete')}
            >
                <Trash2 className="w-3.5 h-3.5" />
            </button>
        </div>
    );

    const InfoTooltip = () => (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[60] shadow-lg">
            <div className="font-semibold mb-0.5">{milestone.label}</div>
            <div className="grid grid-cols-[auto,1fr] gap-x-2 text-gray-300">
                <span className="text-gray-400">{t('project_detail.roadmap.tooltip.start')}</span>
                <span>{formatDate(milestone.start_date)}</span>
                {milestone.end_date && (
                    <>
                        <span className="text-gray-400">{t('project_detail.roadmap.tooltip.end')}</span>
                        <span>{formatDate(milestone.end_date)}</span>
                    </>
                )}
                <span className="text-gray-400">{t('project_detail.roadmap.tooltip.progress')}</span>
                <span>{milestone.progress}%</span>
            </div>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
    );

    const isCompleted = milestone.progress === 100;
    const barBaseClass = isCompleted ? 'bg-emerald-100 border-emerald-300' : 'bg-blue-100 border-blue-300';
    const barHoverClass = isCompleted ? 'hover:bg-emerald-50' : 'hover:bg-blue-50';
    const barDragClass = isCompleted ? 'ring-emerald-400' : 'ring-blue-400';
    const fillClass = isCompleted ? 'bg-emerald-500/20' : 'bg-blue-500/20';
    const textClass = isCompleted ? 'text-emerald-900' : 'text-blue-900';
    const progressTextClass = isCompleted ? 'text-emerald-600' : 'text-blue-600';
    const handleClass = isCompleted ? 'bg-emerald-400' : 'bg-blue-400';

    if (isRange) {
        // --- GANTT BAR RENDER ---
        return (
            <div
                className={`absolute ${topStyle} ${heightStyle} group z-10`}
                style={{
                    left: `${startPercent}%`,
                    width: `${widthPercent}%`,
                    minWidth: '20px' // Prevent collapse
                }}
            >
                {/* Bar Body (Draggable) */}
                <div
                    ref={bodyDrag.setNodeRef}
                    {...bodyDrag.listeners}
                    {...bodyDrag.attributes}
                    onDoubleClick={(e) => {
                        e.stopPropagation();
                        onEditStart(milestone);
                    }}
                    className={`absolute inset-0 ${barBaseClass} border rounded-md cursor-grab active:cursor-grabbing ${barHoverClass} transition-colors shadow-sm ${bodyDrag.isDragging ? `opacity-50 ring-2 ${barDragClass}` : ''}`}
                    style={bodyDrag.transform ? { transform: `translate3d(${bodyDrag.transform.x}px, 0, 0)` } : {}}
                >
                    {/* Progress Fill */}
                    <div
                        className={`h-full ${fillClass} rounded-l-md pointer-events-none transition-all duration-300`}
                        style={{ width: `${milestone.progress}%` }}
                    />

                    {/* Content */}
                    <div className="absolute inset-0 flex items-center justify-between px-2 overflow-hidden pointer-events-none">
                        <span className={`text-xs font-semibold ${textClass} truncate flex-1`}>{milestone.label}</span>
                        <span className={`text-[10px] ${progressTextClass} font-mono ml-2 opacity-70`}>{milestone.progress}%</span>
                    </div>

                    <ActionButtons />
                    <InfoTooltip />
                </div>

                {/* Left Resize Handle */}
                <div
                    ref={leftDrag.setNodeRef}
                    {...leftDrag.listeners}
                    {...leftDrag.attributes}
                    className="absolute top-0 bottom-0 -left-2 w-4 cursor-ew-resize flex items-center justify-center opacity-0 group-hover:opacity-100 z-20"
                    style={leftDrag.transform ? { transform: `translate3d(${leftDrag.transform.x}px, 0, 0)` } : {}}
                >
                    <div className={`w-1.5 h-6 ${handleClass} rounded-full shadow-sm hover:scale-110 transition-transform`} />
                </div>

                {/* Right Resize Handle */}
                <div
                    ref={rightDrag.setNodeRef}
                    {...rightDrag.listeners}
                    {...rightDrag.attributes}
                    className="absolute top-0 bottom-0 -right-2 w-4 cursor-ew-resize flex items-center justify-center opacity-0 group-hover:opacity-100 z-20"
                    style={rightDrag.transform ? { transform: `translate3d(${rightDrag.transform.x}px, 0, 0)` } : {}}
                >
                    <div className={`w-1.5 h-6 ${handleClass} rounded-full shadow-sm hover:scale-110 transition-transform`} />
                </div>
            </div>
        );
    }

    // --- POINT RENDER (Gantt Row style) ---
    return (
        <div
            ref={bodyDrag.setNodeRef}
            style={{
                left: `${startPercent}%`,
                transform: bodyDrag.transform ? `translate3d(${bodyDrag.transform.x}px, 0, 0)` : undefined
            }}
            className={`absolute top-1/2 -translate-y-1/2 transform -translate-x-1/2 touch-none ${bodyDrag.isDragging ? 'z-50' : 'z-10'} group`}
            {...bodyDrag.listeners}
            {...bodyDrag.attributes}
        >
            <div
                className="flex items-center gap-2 cursor-grab active:cursor-grabbing"
                onDoubleClick={(e) => {
                    e.stopPropagation();
                    onEditStart(milestone);
                }}
            >
                {/* Milestone marker (Diamond) */}
                <div className={`w-4 h-4 rotate-45 border-2 border-white shadow-md transition-transform ${bodyDrag.isDragging ? 'scale-125 bg-red-900 border-red-300' : 'bg-red-700 group-hover:scale-125'}`} />

                {/* Label (Right of marker) */}
                <div className="relative group/label">
                    <div className={`px-2 py-1 bg-white border border-gray-200 rounded text-xs font-semibold text-gray-700 shadow-sm flex items-center gap-2 whitespace-nowrap ${bodyDrag.isDragging ? 'shadow-lg' : ''}`}>
                        {milestone.label}
                        {milestone.progress > 0 && (
                            <span className={`w-1.5 h-1.5 rounded-full ${getProgressColor(milestone.progress)}`}></span>
                        )}
                    </div>

                    <ActionButtons />
                </div>
            </div>
            <InfoTooltip />
        </div>
    );
}
