import { z } from 'zod';

export const budgetTiers = ['< $5k', '$5k - $15k', '$15k - $50k', '$50k+'] as const;
export const urgencyOptions = ['Immediate', '1-2 weeks', '2-4 weeks', 'Flexible'] as const;

export const intakeSchema = z.object({
  title: z.string().min(3, 'Project title is required').max(120),
  description: z.string().min(30, 'Description should be at least 30 characters').max(20000),
  budgetTier: z.enum(budgetTiers),
  urgency: z.enum(urgencyOptions),
  contactName: z.string().min(2).max(120),
  contactEmail: z.string().email('Enter a valid email address'),
  contactPhone: z.string().max(40).optional().or(z.literal('')),
  source: z.enum(['FORM', 'WEBHOOK']).default('FORM')
});

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

export const noteSchema = z.object({
  body: z.string().min(1).max(5000),
  parentId: z.string().optional().nullable()
});

export const stageSchema = z.object({
  stage: z.enum(['NEW', 'UNDER_REVIEW', 'PROPOSAL_SENT', 'WON', 'ARCHIVED'])
});

export const assignmentSchema = z.object({
  assignedToId: z.string().min(1),
  reason: z.string().max(500).optional().nullable()
});

export const overrideAnalysisSchema = z.object({
  category: z.string().min(2).max(80),
  effortMinHours: z.number().int().nonnegative(),
  effortMaxHours: z.number().int().nonnegative(),
  suggestedStack: z.array(z.string()).min(1),
  complexityScore: z.number().int().min(1).max(5),
  summary: z.string().min(10).max(1000),
  reason: z.string().min(3).max(500)
});

export const createUserSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['ADMIN', 'REVIEWER'])
});
