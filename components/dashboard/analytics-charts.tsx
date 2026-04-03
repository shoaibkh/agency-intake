'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';

const colors = ['#0f172a', '#334155', '#64748b', '#94a3b8', '#cbd5e1'];

export function AnalyticsCharts({ data }: { data: any }) {
  const stageData = Object.entries(data.byStage).map(([stage, count]) => ({ stage, count }));
  const categoryData = data.topCategories;
  const trendData = data.complexityTrend;

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <Card className="xl:col-span-2">
        <CardContent>
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Briefs by stage</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData}>
                <XAxis dataKey="stage" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Top categories</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} dataKey="count" nameKey="name" outerRadius={90} label>
                  {categoryData.map((_: any, index: number) => <Cell key={index} fill={colors[index % colors.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="xl:col-span-3">
        <CardContent>
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Average complexity trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Line dataKey="score" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
