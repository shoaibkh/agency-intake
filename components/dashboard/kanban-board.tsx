'use client';

import { useMemo, useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, closestCorners, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { BriefStage } from '@prisma/client';
import { BriefCard } from './brief-card';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const columns: BriefStage[] = ['NEW', 'UNDER_REVIEW', 'PROPOSAL_SENT', 'WON', 'ARCHIVED'];

function DraggableBrief({ brief }: { brief: any }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: brief.id, data: brief });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={isDragging ? 'opacity-50' : ''}
      {...listeners}
      {...attributes}
    >
      <BriefCard brief={brief} />
    </div>
  );
}

function DroppableColumn({ stage, children }: { stage: BriefStage; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage, data: { stage } });
  return (
    <div ref={setNodeRef} className={isOver ? 'rounded-2xl ring-2 ring-slate-400' : ''}>
      {children}
    </div>
  );
}

export function KanbanBoard({ initialBriefs }: { initialBriefs: any[] }) {
  const [briefs, setBriefs] = useState(initialBriefs);
  const [activeBrief, setActiveBrief] = useState<any | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const grouped = useMemo(() => {
    return columns.reduce((acc, stage) => {
      acc[stage] = briefs.filter((brief) => brief.stage === stage);
      return acc;
    }, {} as Record<BriefStage, any[]>);
  }, [briefs]);

  async function updateStage(id: string, stage: BriefStage) {
    const previous = briefs;
    setBriefs((items) => items.map((item) => (item.id === id ? { ...item, stage } : item)));

    const res = await fetch(`/api/briefs/${id}/stage`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage })
    });

    if (!res.ok) setBriefs(previous);
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveBrief(null);
    const { active, over } = event;
    if (!over) return;

    const brief = active.data.current as any;
    if (!brief) return;

    const targetStage = (over.data.current as any)?.stage ?? brief.stage;
    if (targetStage !== brief.stage) updateStage(brief.id, targetStage);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={(e) => setActiveBrief(e.active.data.current)} onDragEnd={onDragEnd}>
      <div className="grid gap-4 xl:grid-cols-5">
        {columns.map((stage) => (
          <DroppableColumn key={stage} stage={stage}>
            <Card className="min-h-[420px] p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">{stage.replaceAll('_', ' ')}</h3>
                <Badge>{grouped[stage].length}</Badge>
              </div>
              <div className="space-y-3">
                {grouped[stage].map((brief) => <DraggableBrief key={brief.id} brief={brief} />)}
              </div>
            </Card>
          </DroppableColumn>
        ))}
      </div>
      <DragOverlay>
        {activeBrief ? <div className="w-[320px] opacity-95"><BriefCard brief={activeBrief} /></div> : null}
      </DragOverlay>
    </DndContext>
  );
}
