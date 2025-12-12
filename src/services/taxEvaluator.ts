import { TaxRule, User } from '../types';
import { taxRuleService } from './taxRuleService';

interface EvaluationInput {
  user: User;
  netIncome?: number;
  revenue?: number;
}

interface Obligation {
  label: string;
  detail: string;
  estimate?: number;
  link?: string;
}

const defaultRules: TaxRule[] = [
  {
    id: 'ON_2024',
    province: 'ON',
    year: 2024,
    basicPersonalAmount: 12254,
    brackets: [
      { threshold: 49231, rate: 0.0505 },
      { threshold: 98463, rate: 0.0915 },
    ],
  },
  {
    id: 'BC_2024',
    province: 'BC',
    year: 2024,
    basicPersonalAmount: 12254,
    brackets: [
      { threshold: 45654, rate: 0.0506 },
      { threshold: 91310, rate: 0.077 },
    ],
  },
];

const findRule = async (province: string): Promise<TaxRule> => {
  const year = new Date().getFullYear();
  const remote = await taxRuleService.getByProvinceYear(province, year);
  if (remote) return remote;
  const fallback = defaultRules.find((r) => r.id.startsWith(province));
  return fallback || defaultRules[0];
};

export const taxEvaluator = {
  async evaluate(input: EvaluationInput) {
    const { user, netIncome = 0, revenue = 0 } = input;
    const profile = user.businessProfile || {
      business_type: 'sole_proprietor',
      province_or_territory: user.province,
      has_employees: false,
      union_memberships: [],
    };

    const rule = await findRule(profile.province_or_territory || 'ON');
    const obligations: Obligation[] = [
      {
        label: 'Income tax on business profit',
        detail: 'Report business income on your annual return; this is an estimate only.',
      },
      {
        label: 'CPP on self-employment',
        detail: 'Calculate Canada Pension Plan contributions on net self-employment income.',
      },
    ];

    if (revenue >= 30000 || profile.is_gst_hst_registered) {
      obligations.push({
        label: 'GST/HST registration',
        detail: 'You have crossed the small supplier threshold. Register and remit GST/HST.',
      });
    }

    if (profile.has_employees) {
      obligations.push({
        label: 'Payroll remittances',
        detail: 'Income tax, CPP, and EI for any employees you pay.',
      });
    }

    // CPP estimate (self-employed pay both sides at 11.9% up to YMPE cap, simplified)
    const cppEstimate = Math.max(0, Math.min(netIncome, 68500) - 3500) * 0.119;
    // Simple GST/HST estimate using lowest bracket from rule as proxy
    const gstRate = rule.brackets[0]?.rate || 0.05;
    const hstEstimate = revenue > 30000 ? revenue * gstRate : 0;

    const estimates = [
      { label: 'CPP (est.)', amount: Math.round(cppEstimate) },
      { label: 'GST/HST (est.)', amount: Math.round(hstEstimate) },
    ];

    return { obligations, estimates, rule };
  },
};
