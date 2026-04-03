import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function ThanksPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Card>
        <CardContent className="space-y-4 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Thanks — your brief was submitted.</h1>
          <p className="text-slate-600">The AI analysis pipeline has been queued and the team dashboard will show the new record shortly.</p>
          <Link href="/intake"><Button variant="outline">Submit another brief</Button></Link>
        </CardContent>
      </Card>
    </main>
  );
}
