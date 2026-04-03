import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          Internal dashboard
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
          Sign in
        </h1>
        <p className="mt-3 text-slate-600">
          Use the seeded admin or reviewer account to access the pipeline.
        </p>
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}