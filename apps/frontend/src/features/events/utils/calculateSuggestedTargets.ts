import type { EventParticipant } from '../types';

export function calculateSuggestedTargets(participants: EventParticipant[], totalExpenses: number): EventParticipant[] {
  if (!Number.isFinite(totalExpenses) || totalExpenses <= 0) return participants;

  const nonPotIndices = participants
    .map((p, i) => (p.type !== 'pot' ? i : -1))
    .filter((i) => i !== -1);

  if (nonPotIndices.length === 0) return participants;

  const weights = nonPotIndices.map((i) => {
    const p = participants[i];
    return p && p.type !== 'pot' && p.contributionTarget && p.contributionTarget > 0
      ? p.contributionTarget
      : 1;
  });
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  const newTargets: number[] = [];
  let runningSum = 0;
  for (let i = 0; i < nonPotIndices.length; i++) {
    if (i === nonPotIndices.length - 1) {
      newTargets.push(Math.round((totalExpenses - runningSum) * 100) / 100);
    } else {
      const target = Math.round((weights[i] / totalWeight) * totalExpenses * 100) / 100;
      newTargets.push(target);
      runningSum += target;
    }
  }

  const result = [...participants];
  nonPotIndices.forEach((participantIdx, i) => {
    const p = participants[participantIdx];
    const newTarget = newTargets[i] ?? 0;
    if (!p || p.type === 'pot') return;
    if (newTarget > 0) {
      result[participantIdx] = { ...p, contributionTarget: newTarget };
    } else {
      const { contributionTarget: _, ...rest } = p;
      result[participantIdx] = rest as EventParticipant;
    }
  });

  return result;
}
