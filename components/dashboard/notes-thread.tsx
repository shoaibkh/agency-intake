'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

function NoteItem({ note }: { note: any }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{note.author?.name || 'Unknown'}</span>
        <span>{new Date(note.createdAt).toLocaleString()}</span>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{note.body}</p>
      {note.children?.length ? (
        <div className="mt-3 space-y-2 border-l border-slate-200 pl-3">
          {note.children.map((child: any) => <NoteItem key={child.id} note={child} />)}
        </div>
      ) : null}
    </div>
  );
}

export function NotesThread({ briefId, initialNotes }: { briefId: string; initialNotes: any[] }) {
  const [notes, setNotes] = useState(initialNotes);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  async function addNote() {
    if (!body.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/briefs/${briefId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body })
    });
    setLoading(false);
    if (!res.ok) return;
    const data = await res.json();
    setNotes((current) => [...current, data.note]);
    setBody('');
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Add an internal note..." />
          <Button onClick={addNote} disabled={loading}>{loading ? 'Adding...' : 'Add note'}</Button>
        </div>
        <div className="space-y-3">
          {notes.map((note) => <NoteItem key={note.id} note={note} />)}
        </div>
      </CardContent>
    </Card>
  );
}
