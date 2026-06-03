import { useMemo } from 'react';

const TRIAL_MS = 14 * 24 * 60 * 60 * 1000;

export function usePlan(account) {
  return useMemo(() => {
    if (!account) return 'free';
    if (account.tier === 'pro') return 'pro';
    const { plan, trialStartedAt } = account;
    if (plan === 'pro' || plan === 'school') return 'pro';
    if (plan === 'trial') {
      if (!trialStartedAt) return 'pro'; // just signed up, grant access
      if (Date.now() - trialStartedAt < TRIAL_MS) return 'pro';
    }
    return 'free';
  }, [account]);
}

export const FREE_LIMITS = {
  savedRoutines: 3,
  customActivities: 1,
};
