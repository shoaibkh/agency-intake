import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function HomePage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <section className="grid gap-8 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Agency workflow</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Public brief intake, AI analysis, and a live internal pipeline.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Capture project briefs, enrich them with structured AI analysis, and manage everything from a real-time dashboard with roles, notes, analytics, and stage tracking.
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/intake"><Button>Open intake form</Button></Link>
            <Link href="/login"><Button variant="outline">Dashboard login</Button></Link>
          </div>
        </div> 
      </section>
    </main>
  );
}
