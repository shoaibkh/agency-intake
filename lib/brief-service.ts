import { BriefStage, BriefSource, UserRole, Prisma } from '@prisma/client';
import { prisma } from './db';
import { analyzeBrief } from './ai';
import { invalidateAnalyticsCache, cacheKeys, getCacheJSON, setCacheJSON } from './cache';
import { noteSchema, assignmentSchema, overrideAnalysisSchema, stageSchema } from './validators';
import { stageTransitionAllowed } from './permissions';
import { console } from 'inspector';

export type IntakePayload = {
  title: string;
  description: string;
  budgetTier: string;
  urgency: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  source?: BriefSource | 'FORM' | 'WEBHOOK';
};

export async function createBriefAndQueueAnalysis(payload: IntakePayload) {
  const brief = await prisma.brief.create({
    data: {
      title: payload.title,
      description: payload.description,
      budgetTier: payload.budgetTier,
      urgency: payload.urgency,
      contactName: payload.contactName,
      contactEmail: payload.contactEmail,
      contactPhone: payload.contactPhone || null,
      source: payload.source === 'WEBHOOK' ? 'WEBHOOK' : 'FORM',
      stage: 'NEW'
    }
  });

  const job = await prisma.aiJob.create({
    data: {
      briefId: brief.id,
      provider: process.env.AI_API_KEY ? (process.env.AI_MODEL || 'openai-compatible') : 'mock',
      promptVersion: 'v1',
      status: 'PENDING'
    }
  });

  // background-ish processing
  void processAiJob(job.id);

  await prisma.briefEvent.create({
    data: {
      briefId: brief.id,
      type: 'BRIEF_CREATED',
      metadata: { source: brief.source, stage: brief.stage }
    }
  });

  await invalidateAnalyticsCache();
  return brief;
}

export async function processAiJob(jobId: string) {
  const job = await prisma.aiJob.findUnique({ where: { id: jobId }, include: { brief: true } });
  if (!job || job.status === 'DONE') return;

  await prisma.aiJob.update({ where: { id: jobId }, data: { status: 'PROCESSING', lastError: null } });

  try {
    const analysis = await analyzeBrief(job.brief.description);
    await prisma.$transaction([
      prisma.briefAnalysis.upsert({
        where: { briefId: job.briefId },
        update: {
          rawModelResponse: analysis,
          extractedFeatures: analysis.extractedFeatures,
          category: analysis.category,
          effortMinHours: analysis.effortMinHours,
          effortMaxHours: analysis.effortMaxHours,
          suggestedStack: analysis.suggestedStack,
          complexityScore: analysis.complexityScore,
          summary: analysis.summary
        },
        create: {
          briefId: job.briefId,
          rawModelResponse: analysis,
          extractedFeatures: analysis.extractedFeatures,
          category: analysis.category,
          effortMinHours: analysis.effortMinHours,
          effortMaxHours: analysis.effortMaxHours,
          suggestedStack: analysis.suggestedStack,
          complexityScore: analysis.complexityScore,
          summary: analysis.summary
        }
      }),
      prisma.aiJob.update({
        where: { id: jobId },
        data: { status: 'DONE', lastError: null }
      }),
      prisma.briefEvent.create({
        data: {
          briefId: job.briefId,
          type: 'AI_ANALYSIS_COMPLETED',
          metadata: { complexityScore: analysis.complexityScore, category: analysis.category }
        }
      })
    ]);

    await invalidateAnalyticsCache();
  } catch (error) {
    await prisma.aiJob.update({
      where: { id: jobId },
      data: { status: 'FAILED', lastError: error instanceof Error ? error.message : 'Unknown error' }
    });
  }
}


export async function processPendingAiJobs(limit = 5) {
  const jobs = await prisma.aiJob.findMany({
    where: { status: { in: ['PENDING', 'FAILED'] } },
    orderBy: { createdAt: 'asc' },
    take: limit
  });

  for (const job of jobs) {
    await processAiJob(job.id);
  }

  return jobs.length;
}

export async function listBriefs(params: { stage?: BriefStage; assignedToId?: string; cursor?: string; limit?: number }) {
  const limit = Math.min(params.limit ?? 20, 50);
  const where: Prisma.BriefWhereInput = {};
  if (params.stage) where.stage = params.stage;
  if (params.assignedToId) where.assignedToId = params.assignedToId;

  const items = await prisma.brief.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
    ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
    include: {
      analysis: true,
      assignedTo: true,
      assignments: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { assignedTo: true, assignedBy: true }
      }
    }
  });

  const nextCursor = items.length > limit ? items[limit].id : null;
  return { items: items.slice(0, limit), nextCursor };
}

export async function getBriefById(id: string) {
  return prisma.brief.findUnique({
    where: { id },
    include: {
      analysis: true,
      assignedTo: true,
      events: { orderBy: { createdAt: 'asc' }, include: { actor: true } },
      notes: {
        where: { parentId: null },
        orderBy: { createdAt: 'asc' },
        include: { author: true, children: { include: { author: true } } }
      },
      assignments: {
        orderBy: { createdAt: 'asc' },
        include: { assignedBy: true, assignedTo: true }
      },
      aiJobs: { orderBy: { createdAt: 'desc' } }
    }
  });
}

export async function getDashboardOverview() {
  const cached = await getCacheJSON<any>(cacheKeys.overview);
  if (cached) return cached;

  const [
    byStage,
    categories,
    complexity,
    total,
    won,
    complexity2,
    revenue
  ] = await Promise.all([
    prisma.brief.groupBy({ by: ['stage'], _count: { stage: true } }),
    prisma.briefAnalysis.groupBy({ by: ['category'], _count: { category: true } }),
    prisma.briefAnalysis.findMany({
      select: { complexityScore: true, createdAt: true },
      orderBy: { createdAt: 'asc' }
    }),
    prisma.brief.count(),
    prisma.brief.count({ where: { stage: 'WON' } }),
    prisma.briefAnalysis.findMany({
      select: { complexityScore: true, createdAt: true },
      orderBy: { createdAt: 'asc' }
    }),
    prisma.brief.findMany({
      where: { stage: { notIn: ['ARCHIVED'] } },
      select: { budgetTier: true }
    })
  ]);

  console.log('Analytics data fetched from DB', complexity);

  const stageMap = { NEW: 0, UNDER_REVIEW: 0, PROPOSAL_SENT: 0, WON: 0, ARCHIVED: 0 } as Record<string, number>;
  byStage.forEach((row) => { stageMap[row.stage] = row._count.stage; });

  const categoryMap = categories
    .map((row) => ({ name: row.category, count: row._count.category }))
    .sort((a, b) => b.count - a.count);

  const complexTrend = complexity.map((row) => ({
    month: row.createdAt.toISOString().slice(0, 7),
    score: row.complexityScore
  }));

  const revenueByTier = {
    '< $5k': 2500,
    '$5k - $15k': 10000,
    '$15k - $50k': 25000,
    '$50k+': 60000
  } as const;

  const estimatedRevenue = revenue.reduce((sum, brief) => sum + (revenueByTier[brief.budgetTier as keyof typeof revenueByTier] ?? 0), 0);

  const result = {
    byStage: stageMap,
    topCategories: categoryMap.slice(0, 5),
    avgComplexity: complexity.length
      ? complexity.reduce((sum, item) => sum + item.complexityScore, 0) / complexity.length
      : 0,
    complexityTrend: complexTrend,
    conversionRate: total ? (won / total) * 100 : 0,
    estimatedRevenue,
    total
  };

  await setCacheJSON(cacheKeys.overview, result, 60);
  return result;
}

export async function updateBriefStage(params: { briefId: string; stage: BriefStage; actorId?: string }) {
  const brief = await prisma.brief.findUnique({ where: { id: params.briefId } });
  if (!brief) throw new Error('Brief not found');

  if (!stageTransitionAllowed(brief.stage, params.stage)) {
    throw new Error('Invalid stage transition');
  }

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.brief.update({
      where: { id: params.briefId },
      data: { stage: params.stage }
    });

    await tx.briefEvent.create({
      data: {
        briefId: params.briefId,
        type: 'STAGE_CHANGED',
        fromStage: brief.stage,
        toStage: params.stage,
        actorId: params.actorId,
        metadata: { from: brief.stage, to: params.stage }
      }
    });

    return next;
  });

  await invalidateAnalyticsCache();
  return updated;
}

export async function addBriefNote(params: { briefId: string; authorId: string; body: string; parentId?: string | null }) {
  const parsed = noteSchema.parse({ body: params.body, parentId: params.parentId ?? null });
  const note = await prisma.briefNote.create({
    data: {
      briefId: params.briefId,
      authorId: params.authorId,
      body: parsed.body,
      parentId: parsed.parentId ?? null
    },
    include: { author: true }
  });

  await prisma.briefEvent.create({
    data: {
      briefId: params.briefId,
      type: 'NOTE_ADDED',
      actorId: params.authorId,
      metadata: { parentId: parsed.parentId ?? null }
    }
  });

  return note;
}

export async function assignBrief(params: { briefId: string; assignedById: string; assignedToId: string; reason?: string | null }) {
  const parsed = assignmentSchema.parse(params);
  const result = await prisma.$transaction(async (tx) => {
    const brief = await tx.brief.update({
      where: { id: params.briefId },
      data: { assignedToId: parsed.assignedToId }
    });

    await tx.briefAssignment.create({
      data: {
        briefId: params.briefId,
        assignedById: params.assignedById,
        assignedToId: parsed.assignedToId,
        reason: parsed.reason ?? null
      }
    });

    await tx.briefEvent.create({
      data: {
        briefId: params.briefId,
        type: 'ASSIGNED',
        actorId: params.assignedById,
        metadata: { assignedToId: parsed.assignedToId, reason: parsed.reason ?? null }
      }
    });

    return brief;
  });

  await invalidateAnalyticsCache();
  return result;
}

export async function overrideAnalysis(params: { briefId: string; actorId: string } & { category: string; effortMinHours: number; effortMaxHours: number; suggestedStack: string[]; complexityScore: number; summary: string; reason: string }) {
  const parsed = overrideAnalysisSchema.parse(params);
  const analysis = await prisma.briefAnalysis.upsert({
    where: { briefId: params.briefId },
    update: {
      category: parsed.category,
      effortMinHours: parsed.effortMinHours,
      effortMaxHours: parsed.effortMaxHours,
      suggestedStack: parsed.suggestedStack,
      complexityScore: parsed.complexityScore,
      summary: parsed.summary,
      overriddenById: params.actorId,
      overriddenReason: parsed.reason
    },
    create: {
      briefId: params.briefId,
      rawModelResponse: {
        overridden: true,
        reason: parsed.reason
      },
      extractedFeatures: [],
      category: parsed.category,
      effortMinHours: parsed.effortMinHours,
      effortMaxHours: parsed.effortMaxHours,
      suggestedStack: parsed.suggestedStack,
      complexityScore: parsed.complexityScore,
      summary: parsed.summary,
      overriddenById: params.actorId,
      overriddenReason: parsed.reason
    }
  });

  await prisma.briefEvent.create({
    data: {
      briefId: params.briefId,
      type: 'ANALYSIS_OVERRIDDEN',
      actorId: params.actorId,
      metadata: { reason: parsed.reason }
    }
  });

  await invalidateAnalyticsCache();
  return analysis;
}

export async function createUser(data: { name: string; email: string; passwordHash: string; role: UserRole }) {
  return prisma.user.create({ data });
}

export async function getAnalyticsPayload() {
  return getDashboardOverview();
}
