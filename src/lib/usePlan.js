import { useMemo } from 'react';

const TRIAL_MS = 14 * 24 * 60 * 60 * 1000;

function toMs(ts) {
  if (typeof ts === 'number') return ts;
  return ts?.toMillis?.() ?? (ts?.seconds != null ? ts.seconds * 1000 : null);
}

export function usePlan(account) {
  return useMemo(() => {
    if (!account) return 'free';
    if (account.tier === 'pro') return 'pro';
    const { plan, trialStartedAt } = account;
    if (plan === 'pro' || plan === 'school') return 'pro';
    if (plan === 'trial') {
      if (!trialStartedAt) return 'pro'; // just signed up, grant access
      const startedMs = toMs(trialStartedAt);
      if (startedMs == null || Date.now() - startedMs < TRIAL_MS) return 'pro';
    }
    return 'free';
  }, [account]);
}

export const FREE_LIMITS = {
  savedRoutines: 3,
  customActivities: 1,
};
