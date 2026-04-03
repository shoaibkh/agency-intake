import { KanbanBoard } from '@/components/dashboard/kanban-board';
import { Card, CardContent } from '@/components/ui/card';
import { prisma } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';

export default async function BriefsPage() {
  const session = await getSessionFromCookies();
  const briefs = await prisma.brief.findMany({
    where: session?.role === 'ADMIN' ? undefined : { assignedToId: session?.id },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    include: { analysis: true, assignedTo: true },
    take: 100
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Pipeline Kanban</h1>
          <p className="mt-2 text-slate-600">Drag cards between stages, and the update is saved optimistically with an audit event.</p>
        </CardContent>
      </Card>
      <KanbanBoard initialBriefs={briefs} />
    </div>
  );
}
