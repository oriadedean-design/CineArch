import React, { useEffect, useState } from 'react';
import { Heading, Text, Card, Button, Input, Select, Disclaimer } from '../components/ui';
import { User, CanadianProvince } from '../types';
import { taxEvaluator } from '../services/taxEvaluator';
import { featureService } from '../services/featureService';
import { useNavigate } from 'react-router-dom';

export const Tax = ({ user }: { user: User }) => {
  const [province, setProvince] = useState(user.province || 'ON');
  const [businessType, setBusinessType] = useState(user.businessProfile?.business_type || 'sole_proprietor');
  const [revenue, setRevenue] = useState<number>(45000);
  const [netIncome, setNetIncome] = useState<number>(32000);
  const [hasEmployees, setHasEmployees] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const navigate = useNavigate();

  const gate = featureService.hasAccess(user, 'tax_checklist');
  const estimatorGate = featureService.hasAccess(user, 'cpp_gst_estimates');

  useEffect(() => {
    handleEvaluate();
  }, []);

  const handleEvaluate = async () => {
    const evaluation = await taxEvaluator.evaluate({
      user: {
        ...user,
        businessProfile: {
          business_type: businessType as any,
          province_or_territory: province,
          has_employees: hasEmployees,
          union_memberships: user.businessProfile?.union_memberships || [],
          is_gst_hst_registered: user.businessProfile?.is_gst_hst_registered,
          annual_revenue_estimate: revenue,
        },
      },
      netIncome,
      revenue,
    });
    setResult(evaluation);
  };

  if (!gate.allowed) {
    return (
      <div className="max-w-3xl mx-auto text-center space-y-6 py-16">
        <Heading level={2}>Tax Checklist</Heading>
        <Text variant="subtle">Upgrade to access the tax obligation checklist.</Text>
        <Button onClick={() => navigate('/settings')}>Upgrade</Button>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <Text variant="caption">Finance & Compliance</Text>
          <Heading level={1}>Tax Checklist</Heading>
        </div>
        <Button variant="secondary" onClick={handleEvaluate}>Refresh</Button>
      </div>

      <Card className="p-6 bg-white border-neutral-200">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">Business type</label>
            <Select value={businessType} onChange={(e) => setBusinessType(e.target.value)}>
              <option value="sole_proprietor">Sole proprietor</option>
              <option value="corporation">Corporation</option>
            </Select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">Province / Territory</label>
            <Select value={province} onChange={(e) => setProvince(e.target.value)}>
              {Object.entries(CanadianProvince).map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">Estimated revenue</label>
            <Input type="number" value={revenue} onChange={(e) => setRevenue(Number(e.target.value) || 0)} />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">Net income</label>
            <Input type="number" value={netIncome} onChange={(e) => setNetIncome(Number(e.target.value) || 0)} />
          </div>
          <div className="flex items-center gap-3">
            <input id="employees" type="checkbox" className="w-4 h-4" checked={hasEmployees} onChange={(e) => setHasEmployees(e.target.checked)} />
            <label htmlFor="employees" className="text-sm text-neutral-700">I have employees</label>
          </div>
        </div>
      </Card>

      {result && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <Heading level={3}>Obligations</Heading>
            <div className="mt-4 space-y-3">
              {result.obligations.map((o: any) => (
                <div key={o.label} className="border-b border-neutral-200 pb-3">
                  <Text className="font-medium">{o.label}</Text>
                  <Text variant="small">{o.detail}</Text>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Heading level={3}>Estimates</Heading>
              {!estimatorGate.allowed && <Text variant="caption">Requires Pro</Text>}
            </div>
            {estimatorGate.allowed ? (
              <div className="space-y-3">
                {result.estimates.map((item: any) => (
                  <div key={item.label} className="flex items-center justify-between border-b border-neutral-100 pb-2">
                    <Text>{item.label}</Text>
                    <Text className="font-medium">${item.amount}</Text>
                  </div>
                ))}
              </div>
            ) : (
              <Text variant="subtle">Upgrade to view CPP and GST/HST estimates.</Text>
            )}
          </Card>
        </div>
      )}

      <Disclaimer>
        CineArch provides tax estimates only and does not file your taxes. Confirm details with the CRA or a qualified professional.
      </Disclaimer>
    </div>
  );
};
