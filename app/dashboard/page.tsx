import { AnalyticsCharts } from '@/components/dashboard/analytics-charts';
import { Card, CardContent } from '@/components/ui/card';
import { getDashboardOverview } from '@/lib/brief-service';
import { getSessionFromCookies } from '@/lib/auth';
import { prisma } from '@/lib/db';

export default async function DashboardPage() {
  const session = await getSessionFromCookies();
  if (!session) return null;

  const data = session.role === 'ADMIN'
    ? await getDashboardOverview()
    : await (async () => {
        const briefs = await prisma.brief.findMany({
          where: { assignedToId: session.id },
          include: { analysis: true },
          orderBy: { createdAt: 'asc' }
        });
        const byStage = { NEW: 0, UNDER_REVIEW: 0, PROPOSAL_SENT: 0, WON: 0, ARCHIVED: 0 } as Record<string, number>;
        briefs.forEach((brief) => { byStage[brief.stage] += 1; });
        const categories = Object.entries(briefs.reduce((acc, brief) => {
          const c = brief.analysis?.category || 'Unanalyzed';
          acc[c] = (acc[c] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)).map(([name, count]) => ({ name, count }));
        const complexityScores = briefs.map((brief) => brief.analysis?.complexityScore).filter((v): v is number => typeof v === 'number');
        const complexityTrend = briefs
          .filter((brief) => brief.analysis)
          .map((brief) => ({ month: brief.createdAt.toISOString().slice(0, 7), score: brief.analysis!.complexityScore }));
        const revenueByTier = {
          '< $5k': 2500,
          '$5k - $15k': 10000,
          '$15k - $50k': 25000,
          '$50k+': 60000
        } as const;
        const estimatedRevenue = briefs.reduce((sum, brief) => sum + (revenueByTier[brief.budgetTier as keyof typeof revenueByTier] ?? 0), 0);
        const won = briefs.filter((brief) => brief.stage === 'WON').length;
        return {
          byStage,
          topCategories: categories.slice(0, 5),
          avgComplexity: complexityScores.length ? complexityScores.reduce((a, b) => a + b, 0) / complexityScores.length : 0,
          complexityTrend,
          conversionRate: briefs.length ? (won / briefs.length) * 100 : 0,
          estimatedRevenue,
          total: briefs.length
        };
      })();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent><p className="text-sm text-slate-500">Total briefs</p><p className="mt-2 text-3xl font-bold">{data.total}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-slate-500">Conversion rate</p><p className="mt-2 text-3xl font-bold">{data.conversionRate.toFixed(1)}%</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-slate-500">Estimated pipeline</p><p className="mt-2 text-3xl font-bold">${data.estimatedRevenue.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-slate-500">Avg complexity</p><p className="mt-2 text-3xl font-bold">{data.avgComplexity && data.avgComplexity.toFixed(1)}</p></CardContent></Card>
      </div>

      <AnalyticsCharts data={data} />

      <Card>
        <CardContent>
          <h3 className="text-sm font-semibold text-slate-900">Top project categories</h3>
          <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
            {data.topCategories.map((item: any) => (
              <div key={item.name} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-medium text-slate-900">{item.name}</div>
                <div className="mt-1 text-sm text-slate-500">{item.count} briefs</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
