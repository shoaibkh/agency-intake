'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export function AnalysisOverrideForm({ briefId, analysis }: { briefId: string; analysis: any }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      category: String(form.get('category') || ''),
      effortMinHours: Number(form.get('effortMinHours') || 0),
      effortMaxHours: Number(form.get('effortMaxHours') || 0),
      suggestedStack: String(form.get('suggestedStack') || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      complexityScore: Number(form.get('complexityScore') || 0),
      summary: String(form.get('summary') || ''),
      reason: String(form.get('reason') || '')
    };

    const res = await fetch(`/api/briefs/${briefId}/analysis`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    setLoading(false);
    const data = await res.json().catch(() => null);
    setMessage(res.ok ? 'Analysis overridden.' : data?.error?.message ?? 'Update failed.');
    if (res.ok) router.refresh();
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-900">Override AI analysis</h3>
        <form className="grid gap-4" onSubmit={onSubmit}>
          <div>
            <Label>Category</Label>
            <Input name="category" defaultValue={analysis?.category || 'Web App'} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Effort min hours</Label>
              <Input name="effortMinHours" type="number" defaultValue={analysis?.effortMinHours || 24} />
            </div>
            <div>
              <Label>Effort max hours</Label>
              <Input name="effortMaxHours" type="number" defaultValue={analysis?.effortMaxHours || 48} />
            </div>
          </div>
          <div>
            <Label>Suggested stack</Label>
            <Input name="suggestedStack" defaultValue={Array.isArray(analysis?.suggestedStack) ? analysis.suggestedStack.join(', ') : 'Next.js, PostgreSQL, Prisma'} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Complexity score</Label>
              <Input name="complexityScore" type="number" min="1" max="5" defaultValue={analysis?.complexityScore || 3} />
            </div>
            <div />
          </div>
          <div>
            <Label>Summary</Label>
            <Textarea name="summary" defaultValue={analysis?.summary || ''} />
          </div>
          <div>
            <Label>Reason for override</Label>
            <Textarea name="reason" placeholder="Explain why the estimate was adjusted." />
          </div>
          <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save override'}</Button>
        </form>
        {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      </CardContent>
    </Card>
  );
}
