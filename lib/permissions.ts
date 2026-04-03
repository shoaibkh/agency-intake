import { BriefStage, UserRole } from '@prisma/client';

export function canAccessBrief(userRole: UserRole, assignedToId: string | null, userId: string) {
  return userRole === 'ADMIN' || assignedToId === userId;
}

export function canEditStage(userRole: UserRole) {
  return userRole === 'ADMIN' || userRole === 'REVIEWER';
}

export function stageTransitionAllowed(from: BriefStage, to: BriefStage) {
  const order = ['NEW', 'UNDER_REVIEW', 'PROPOSAL_SENT', 'WON', 'ARCHIVED'];
  const fromIndex = order.indexOf(from);
  const toIndex = order.indexOf(to);
  if (from === 'ARCHIVED') return to === 'ARCHIVED';
  return toIndex >= fromIndex || to === 'ARCHIVED';
}
