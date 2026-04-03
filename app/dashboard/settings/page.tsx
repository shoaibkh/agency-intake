import { Card, CardContent } from '@/components/ui/card';
import { CreateUserForm } from './user-form';
import { getSessionFromCookies } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
  const session = await getSessionFromCookies();
  if (!session || session.role !== 'ADMIN') redirect('/dashboard');

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Users</h1>
          <p className="mt-2 text-slate-600">Admins can create reviewer or admin accounts for the internal dashboard.</p>
        </CardContent>
      </Card>
      <CreateUserForm />
    </div>
  );
}
