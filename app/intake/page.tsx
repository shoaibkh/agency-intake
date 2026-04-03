import { IntakeForm } from '@/components/public/intake-form';

export default function IntakePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Public intake</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Project brief submission</h1>
        <p className="mt-3 text-slate-600">Submit a brief and the AI pipeline will extract requirements, estimate effort, and assign a complexity score.</p>
      </div>
      <IntakeForm />
    </main>
  );
}
