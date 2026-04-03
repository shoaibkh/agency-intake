import Link from 'next/link';
import { BriefStage } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export function BriefCard({ brief }: { brief: any }) {
  return (
    <Link href={`/dashboard/briefs/${brief.id}`}>
      <Card className="cursor-pointer p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-900">{brief.title}</h3>
            <p className="mt-1 text-sm text-slate-500 line-clamp-2">{brief.contactName} · {brief.contactEmail}</p>
          </div>
          <Badge>{brief.budgetTier}</Badge>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge>{brief.stage as BriefStage}</Badge>
          <Badge>{brief.urgency}</Badge>
          {brief.analysis ? <Badge>Score {brief.analysis.complexityScore}</Badge> : <Badge>AI pending</Badge>}
        </div>
      </Card>
    </Link>
  );
}
