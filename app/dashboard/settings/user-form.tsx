'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

export function CreateUserForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());

    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    setLoading(false);
    const data = await res.json().catch(() => null);
    setMessage(res.ok ? 'User created.' : data?.error?.message ?? 'Failed to create user.');
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-5 md:grid-cols-2">
          <div>
            <Label>Name</Label>
            <Input name="name" />
          </div>
          <div>
            <Label>Email</Label>
            <Input name="email" type="email" />
          </div>
          <div>
            <Label>Password</Label>
            <Input name="password" type="password" />
          </div>
          <div>
            <Label>Role</Label>
            <Select name="role" defaultValue="REVIEWER">
              <option value="REVIEWER">Reviewer</option>
              <option value="ADMIN">Admin</option>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create user'}</Button>
          </div>
        </form>
        {message ? <p className="mt-4 text-sm text-slate-600">{message}</p> : null}
      </CardContent>
    </Card>
  );
}
