'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { budgetTiers, urgencyOptions } from '@/lib/validators';

export function IntakeForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());

    const response = await fetch('/api/intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error?.message ?? 'Something went wrong.');
      return;
    }

    router.push('/thanks');
  }

  return (
    <Card>
      <CardContent>
        <form className="grid gap-5" onSubmit={onSubmit}>
          <div>
            <Label htmlFor="title">Project title</Label>
            <Input id="title" name="title" placeholder="Website redesign for a growing agency" />
          </div>

          <div>
            <Label htmlFor="description">Project description</Label>
            <Textarea id="description" name="description" placeholder="Describe goals, features, integrations, and any constraints." />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <Label htmlFor="budgetTier">Budget range</Label>
              <Select id="budgetTier" name="budgetTier" defaultValue="">
                <option value="" disabled>Select a budget tier</option>
                {budgetTiers.map((tier) => <option key={tier} value={tier}>{tier}</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor="urgency">Timeline urgency</Label>
              <Select id="urgency" name="urgency" defaultValue="">
                <option value="" disabled>Select an urgency</option>
                {urgencyOptions.map((item) => <option key={item} value={item}>{item}</option>)}
              </Select>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <Label htmlFor="contactName">Contact name</Label>
              <Input id="contactName" name="contactName" />
            </div>
            <div>
              <Label htmlFor="contactEmail">Contact email</Label>
              <Input id="contactEmail" name="contactEmail" type="email" />
            </div>
            <div>
              <Label htmlFor="contactPhone">Contact phone</Label>
              <Input id="contactPhone" name="contactPhone" />
            </div>
          </div>

          {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

          <Button type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit brief'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
