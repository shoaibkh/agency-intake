'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export function AssignmentForm({ briefId, users }: { briefId: string; users: any[] }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const form = new FormData(e.currentTarget);
    const res = await fetch(`/api/briefs/${briefId}/assign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignedToId: String(form.get('assignedToId') || ''),
        reason: String(form.get('reason') || '')
      })
    });

    setLoading(false);
    const data = await res.json().catch(() => null);
    setMessage(res.ok ? 'Brief assigned.' : data?.error?.message ?? 'Failed to assign.');
    if (res.ok) router.refresh();
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-900">Assign brief</h3>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div>
            <Label>Reviewer</Label>
            <Select name="assignedToId" defaultValue="">
              <option value="" disabled>Select reviewer</option>
              {users.map((user) => <option key={user.id} value={user.id}>{user.name} ({user.email})</option>)}
            </Select>
          </div>
          <div>
            <Label>Reason</Label>
            <Textarea name="reason" placeholder="Why this reviewer?" />
          </div>
          <Button type="submit" disabled={loading}>{loading ? 'Assigning...' : 'Assign'}</Button>
        </form>
        {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      </CardContent>
    </Card>
  );
}
