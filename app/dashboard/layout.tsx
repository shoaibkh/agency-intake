import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionFromCookies } from '@/lib/auth';
import { Button } from '@/components/ui/button';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionFromCookies();
  if (!session) redirect('/login');

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Signed in as</p>
            <p className="text-sm font-medium text-slate-900">{session.name} · {session.role}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard"><Button variant="outline" size="sm">Overview</Button></Link>
            <Link href="/dashboard/briefs"><Button variant="outline" size="sm">Briefs</Button></Link>
            {session.role === 'ADMIN' ? <Link href="/dashboard/settings"><Button variant="outline" size="sm">Users</Button></Link> : null}
            {/* <form action="/api/auth/logout" method="post">
              <Button size="sm" variant="secondary">Logout</Button>
            </form> */}
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
    </main>
  );
}
