import { FeatureConfig, FeatureKey, User } from '../types';

const featureConfig: Record<FeatureKey, FeatureConfig> = {
  tax_checklist: {
    label: 'Tax obligations checklist',
    minPlan: 'FREE',
  },
  cpp_gst_estimates: {
    label: 'CPP + GST/HST estimates',
    minPlan: 'PRO',
  },
  union_wizard: {
    label: 'Union roadmap wizard',
    minPlan: 'PRO',
  },
  union_dues_projection: {
    label: 'Union dues projections',
    minPlan: 'PRO',
  },
  agency_roster: {
    label: 'Agency roster management',
    minPlan: 'AGENCY',
  },
};

const planRank = {
  FREE: 0,
  PRO: 1,
  AGENCY: 2,
};

export const featureService = {
  config: featureConfig,
  hasAccess(user: User, feature: FeatureKey) {
    const required = featureConfig[feature];
    const userPlan: 'FREE' | 'PRO' | 'AGENCY' = user.accountType === 'AGENT'
      ? 'AGENCY'
      : user.isPremium
        ? 'PRO'
        : 'FREE';

    const allowed = planRank[userPlan] >= planRank[required.minPlan];
    const reason = allowed
      ? ''
      : `Requires ${required.minPlan === 'AGENCY' ? 'Agency' : 'Pro'} plan`;

    return { allowed, reason, requiredPlan: required.minPlan, userPlan };
  },
};
