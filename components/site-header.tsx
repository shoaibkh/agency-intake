import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { getSessionFromCookies } from '@/lib/auth';

export async function SiteHeader() {
  const session = await getSessionFromCookies();
  return (
    <header className="border-b border-slate-200 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-slate-900">
          Agency Intake
        </Link>
        {session ? (
          <div className="flex items-center gap-3">
            <form action="/api/auth/logout" method="post">
              <button type="submit" className="text-sm font-medium text-slate-700 hover:text-slate-900">
                Logout
              </button>
            </form>
          </div>
        ) : (
          (
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm font-medium text-slate-700 hover:text-slate-900">
                Login
              </Link>
            </div>
          )
        )}
      </div>
    </header>
  );
}
