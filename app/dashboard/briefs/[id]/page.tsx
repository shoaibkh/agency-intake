import { notFound } from 'next/navigation';
import { getBriefById } from '@/lib/brief-service';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NotesThread } from '@/components/dashboard/notes-thread';
import { AnalysisOverrideForm } from '@/components/dashboard/analysis-override-form';
import { AssignmentForm } from '@/components/dashboard/assignment-form';
import { getSessionFromCookies } from '@/lib/auth';
import { prisma } from '@/lib/db';

export default async function BriefDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [brief, session, users] = await Promise.all([
    getBriefById(id),
    getSessionFromCookies(),
    prisma.user.findMany({ orderBy: { name: 'asc' } })
  ]);
  if (!brief) notFound();
  if (session?.role !== 'ADMIN' && session?.id !== brief.assignedToId) notFound();

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">{brief.title}</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge>{brief.stage}</Badge>
              <Badge>{brief.budgetTier}</Badge>
              <Badge>{brief.urgency}</Badge>
            </div>
            <div className="mt-5 space-y-3 text-sm text-slate-700">
              <p><strong>Contact:</strong> {brief.contactName} · {brief.contactEmail} · {brief.contactPhone || '—'}</p>
              <p><strong>Description:</strong></p>
              <p className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4">{brief.description}</p>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold">AI analysis</h2>
            {brief.analysis ? (
              <div className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                <p><strong>Category:</strong> {brief.analysis.category}</p>
                <p><strong>Effort:</strong> {brief.analysis.effortMinHours}–{brief.analysis.effortMaxHours} hours</p>
                <p><strong>Complexity:</strong> {brief.analysis.complexityScore}/5</p>
                <p><strong>Stack:</strong> {(brief.analysis.suggestedStack as any[]).join(', ')}</p>
                <p><strong>Summary:</strong> {brief.analysis.summary}</p>
                {brief.analysis.overriddenReason ? <p><strong>Override reason:</strong> {brief.analysis.overriddenReason}</p> : null}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">AI analysis pending.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <NotesThread briefId={brief.id} initialNotes={brief.notes} />
        <div className="space-y-6">
          {(session?.role === 'ADMIN' || session?.role === 'REVIEWER') && brief.analysis ? (
            <AnalysisOverrideForm briefId={brief.id} analysis={brief.analysis} />
          ) : null}
          {session?.role === 'ADMIN' ? (
            <AssignmentForm briefId={brief.id} users={users.filter((user) => user.role === 'REVIEWER')} />
          ) : null}
        </div>
      </div>

      <Card>
        <CardContent>
          <h2 className="text-lg font-semibold">Assignment history</h2>
          <div className="mt-4 space-y-3">
            {brief.assignments.length ? brief.assignments.map((a) => (
              <div key={a.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                Assigned to <strong>{a.assignedTo.name}</strong> by <strong>{a.assignedBy.name}</strong>
                {a.reason ? <div className="mt-1 text-slate-600">Reason: {a.reason}</div> : null}
              </div>
            )) : <p className="text-sm text-slate-500">No assignment yet.</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h2 className="text-lg font-semibold">Stage timeline</h2>
          <div className="mt-4 space-y-3">
            {brief.events.map((event) => (
              <div key={event.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                <strong>{event.type}</strong> · {new Date(event.createdAt).toLocaleString()}
                {event.fromStage || event.toStage ? (
                  <div className="mt-1 text-slate-600">{event.fromStage || '—'} → {event.toStage || '—'}</div>
                ) : null}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
