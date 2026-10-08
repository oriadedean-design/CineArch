import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/storage';
import { Job, User, CanadianProvince } from '../types';
import { resolveGuildsForRole, getUnionSpec, getAllUnions, getDepartments, getRatePositions } from '../services/union_engine';
import { priceJob, loadJobRates } from '../services/job_pay';
import { describeOvertime, workedHours } from '../services/pay';
import { Button, Input, Select, Badge, Card } from '../components/ui';
import { ArrowLeft, ShieldCheck, Clock, Trash2, AlertTriangle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import clsx from 'clsx';

const money = (n: number) => `$${n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const hours = (n: number) => `${n.toLocaleString('en-CA', { maximumFractionDigits: 2 })}h`;
const today = () => new Date().toISOString().split('T')[0];
// Empty input → undefined, so a cleared field doesn't save as 0.
const num = (v: string) => (v.trim() === '' ? undefined : Number(v));

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="text-xs font-black uppercase tracking-widest text-white/40 italic block mb-3">{children}</label>
);

export const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<Job[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ratesLoaded, setRatesLoaded] = useState(0);  // bumps when rate lines arrive

  const [form, setForm] = useState<Partial<Job>>({
    status: 'CONFIRMED',
    productionName: '',
    companyName: '',
    role: '',
    department: 'Camera Department',
    isUnion: true,
    unionTypeId: '',
    startDate: today(),
    daysWorked: 1,
    mealBreakMinutes: 0,
    province: 'Ontario',
  });
  const set = (patch: Partial<Job>) => setForm(prev => ({ ...prev, ...patch }));

  const [resolvedUnionIds, setResolvedUnionIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const u = await api.auth.getUser();
      setUser(u);
      const jobs = await api.jobs.list();
      setHistory(jobs);

      if (isNew) {
        set({
          role: u?.selectedRoles?.[0] || '',
          department: u?.department || 'Camera Department',
          province: u?.province || 'Ontario',
        });
      } else if (id) {
        const job = await api.jobs.get(id);
        // Jobs logged before hourly tracking only have a total.
        if (job) setForm({ ...job, hoursPerDay: job.hoursPerDay ?? (job.totalHours ? job.totalHours / (job.daysWorked || 1) : undefined) });
      }
    };
    fetchData();
  }, [isNew, id]);

  useEffect(() => {
    if (form.province && form.department && form.role) {
      const region = form.province === user?.province ? user?.region : undefined;
      const suggestions = resolveGuildsForRole(form.province, form.role, form.department, { region });
      setResolvedUnionIds(suggestions);

      if (isNew && !form.unionTypeId && form.isUnion && suggestions.length > 0) {
        set({ unionTypeId: suggestions[0] });
      }
    }
  }, [form.province, form.department, form.role, isNew, form.isUnion, user?.province, user?.region]);

  // Your own productions and companies, most recent first, for the pick lists.
  const { productions, companies } = useMemo(() => {
    const byProduction = new Map<string, Job>();
    const companySet = new Set<string>();
    for (const j of [...history].sort((a, b) => b.startDate.localeCompare(a.startDate))) {
      if (j.productionName && !byProduction.has(j.productionName)) byProduction.set(j.productionName, j);
      if (j.companyName) companySet.add(j.companyName);
    }
    return { productions: byProduction, companies: [...companySet] };
  }, [history]);

  // Picking a production you've logged before fills in how you worked on it.
  const pickProduction = (name: string) => {
    const last = productions.get(name);
    if (!last || !isNew) return set({ productionName: name });
    set({
      productionName: name,
      companyName: last.companyName,
      province: last.province ?? form.province,
      role: last.role,
      department: last.department ?? form.department,
      isUnion: last.isUnion,
      unionTypeId: last.unionTypeId ?? '',
      productionTier: last.productionTier,
      ratePosition: last.ratePosition,
      hourlyRate: last.hourlyRate,
      hoursPerDay: last.hoursPerDay,
      mealBreakMinutes: last.mealBreakMinutes ?? 0,
    });
  };

  const payInput = {
    isUnion: !!form.isUnion,
    unionId: form.unionTypeId || undefined,
    department: form.department,
    role: form.role,
    date: form.startDate || today(),
    productionType: form.productionTier,
    ratePosition: form.ratePosition,
    hoursPerDay: form.hoursPerDay,
    mealBreakMinutes: form.mealBreakMinutes,
    days: form.daysWorked,
    hourlyRate: form.hourlyRate,
  };

  useEffect(() => {
    loadJobRates([payInput]).then(() => setRatesLoaded(n => n + 1)).catch(err => console.error('Rates failed to load:', err));
  }, [payInput.isUnion, payInput.unionId, payInput.date, payInput.productionType]);

  const priced = useMemo(() => priceJob(payInput), [JSON.stringify(payInput), ratesLoaded]);
  const { schedule, minimum, rule, pay, status, productionTypes } = priced;
  const needsProductionType = form.isUnion && productionTypes.length > 1 && !schedule;
  const positions = schedule ? getRatePositions(schedule) : [];
  // Hours count toward union requirements even when pay is a flat amount.
  const days = form.daysWorked || 1;
  const worked = pay
    ? { total: pay.totalHours, overtime: pay.totalOvertimeHours }
    : { total: form.hoursPerDay ? workedHours(form.hoursPerDay, form.mealBreakMinutes, rule?.incrementMinutes) * days : 0, overtime: 0 };

  const handleSave = async () => {
    if (!form.productionName?.trim()) return setError('Add the production name.');
    if (!form.companyName?.trim()) return setError('Add the production company. It keeps your record accurate for union applications.');
    if (!form.hoursPerDay || form.hoursPerDay <= 0) return setError('Add the hours you worked (call to wrap).');
    if (!pay && !form.grossEarnings) return setError(form.isUnion
      ? 'Add your hourly rate. This position has no union minimum to fill in.'
      : 'Add your hourly rate.');
    setError(null);
    setSaving(true);

    const unionSpec = getUnionSpec(form.unionTypeId || '');
    const jobData = {
      ...form,
      id: isNew ? `job_${Date.now()}` : id!,
      userId: user?.id || 'anon',
      createdAt: form.createdAt ?? new Date().toISOString(),
      productionName: form.productionName.trim(),
      companyName: form.companyName.trim(),
      unionName: form.isUnion ? unionSpec?.name : undefined,
      unionTypeId: form.isUnion ? form.unionTypeId : undefined,
      productionTier: form.isUnion ? form.productionTier : undefined,
      daysWorked: days,
      hourlyRate: priced.rate,
      unionMinimumRate: minimum?.hourly ?? undefined,
      ratePosition: minimum?.position,
      totalHours: worked.total,
      overtimeHours: worked.overtime,
      grossEarnings: pay?.gross ?? form.grossEarnings,
    } as Job;

    try {
      if (isNew) await api.jobs.add(jobData);
      else await api.jobs.update(jobData);
      navigate('/jobs');
    } catch (e: any) {
      setError(`Couldn't save: ${e.message || 'unknown error'}`);
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await api.jobs.delete(id);
      navigate('/jobs');
    } catch (e) {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const allRoles = getDepartments().flatMap(d => d.roles.map(r => ({ ...r, dept: d.name })));

  return (
    <div className="max-w-5xl mx-auto space-y-12 md:space-y-20 animate-in fade-in duration-700">
      <header className="flex justify-between items-center">
        <button onClick={() => navigate('/jobs')} className="text-xs font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors flex items-center gap-3 italic">
          <ArrowLeft size={16} /> Back to Your Slate
        </button>
        <div className="flex items-center gap-4">
          {!isNew && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs font-black uppercase tracking-widest text-red-500/40 hover:text-red-500 transition-colors flex items-center gap-2"
            >
              <Trash2 size={14} /> Delete
            </button>
          )}
          <Badge color="accent">{isNew ? "Your New Mark" : "Reviewing Your Mark"}</Badge>
        </div>
      </header>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="w-full max-w-md glass-ui p-12 border-red-500/20 space-y-8 animate-in zoom-in-95 duration-300">
            <div className="space-y-4">
              <h3 className="font-serif italic text-4xl text-white">Delete Mark?</h3>
              <p className="text-sm text-white/50 italic leading-relaxed">
                This will permanently remove <span className="text-white">{form.productionName || 'this job'}</span> from your slate. This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-4 pt-4">
              <Button onClick={() => setShowDeleteConfirm(false)} variant="outline" className="flex-1 h-14 border-white/10 text-xs">Cancel</Button>
              <Button onClick={handleDelete} disabled={isDeleting} className="flex-1 h-14 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-widest">
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-12">
        <div className="border-b border-white/5 pb-12 space-y-8">
          <div>
            <label className="text-xs font-black uppercase tracking-[0.5em] text-accent mb-6 block italic">Production Title</label>
            <Input
              value={form.productionName}
              onChange={e => pickProduction(e.target.value)}
              list="my-productions"
              autoComplete="off"
              className="text-3xl sm:text-5xl md:text-7xl font-serif italic bg-transparent border-none px-0 text-white leading-none tracking-tighter placeholder:text-white/5"
              placeholder="Untitled Project"
            />
            <datalist id="my-productions">
              {[...productions.keys()].map(p => <option key={p} value={p} />)}
            </datalist>
          </div>
          <div className="max-w-xl">
            <Label>Production Company</Label>
            <Input
              value={form.companyName}
              onChange={e => set({ companyName: e.target.value })}
              list="my-companies"
              autoComplete="off"
              className="h-16 text-xl font-serif"
              placeholder="Who paid you"
            />
            <datalist id="my-companies">
              {companies.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
          <div className="space-y-10">
            <div>
              <Label>Province</Label>
              <Select value={form.province} onChange={e => set({ province: e.target.value })} className="h-16 text-xl font-serif italic">
                {Object.values(CanadianProvince).map(p => <option key={p} value={p} className="bg-black text-white">{p}</option>)}
              </Select>
            </div>

            <div>
              <Label>Your Role</Label>
              <Select value={form.role} onChange={e => {
                const roleObj = allRoles.find(r => r.name === e.target.value);
                set({ role: e.target.value, department: roleObj?.dept || form.department, ratePosition: undefined });
              }} className="h-16 text-xl font-serif italic">
                {!allRoles.some(r => r.name === form.role) && <option value={form.role} className="bg-black">{form.role || 'Choose a role'}</option>}
                {getDepartments().map(dept => (
                  <optgroup key={dept.name} label={dept.name} className="bg-black text-accent uppercase tracking-widest font-black py-4">
                    {dept.roles.map(r => <option key={r.name} value={r.name} className="bg-black text-white">{r.name}</option>)}
                  </optgroup>
                ))}
              </Select>
            </div>

            <Card className="p-8 md:p-10 border-white/5 bg-white/[0.02] space-y-8">
              <div className="flex justify-between items-center border-b border-white/5 pb-6">
                <label className="text-xs font-black uppercase tracking-widest text-white/40">The Set</label>
                <div className="flex gap-2">
                  <button onClick={() => set({ isUnion: true })} className={clsx("px-5 py-3 text-xs font-black uppercase tracking-widest border transition-all", form.isUnion ? "bg-accent text-black border-accent" : "text-white/20 border-white/5")}>Union</button>
                  <button onClick={() => set({ isUnion: false, unionTypeId: '', productionTier: undefined, ratePosition: undefined })} className={clsx("px-5 py-3 text-xs font-black uppercase tracking-widest border transition-all", !form.isUnion ? "bg-accent text-black border-accent" : "text-white/20 border-white/5")}>Non-union</button>
                </div>
              </div>

              {form.isUnion ? (
                <div className="space-y-6 animate-in slide-in-from-top-2 duration-500">
                  <div>
                    <Label>Union</Label>
                    <Select value={form.unionTypeId || ''} onChange={e => set({ unionTypeId: e.target.value, productionTier: undefined, ratePosition: undefined })} className="h-16 text-lg font-serif italic">
                      {!form.unionTypeId && <option value="" className="bg-black">Choose a union</option>}
                      {resolvedUnionIds.map(uid => <option key={uid} value={uid} className="bg-black">{getUnionSpec(uid)?.name}</option>)}
                      <option disabled className="text-white/20">—— Other unions ——</option>
                      {getAllUnions().filter(u => !resolvedUnionIds.includes(u.id)).map(u => <option key={u.id} value={u.id} className="bg-black">{u.name}</option>)}
                    </Select>
                    {resolvedUnionIds.length > 0 && (
                      <p className="flex items-center gap-2 text-accent text-xs font-black uppercase tracking-[0.2em] italic mt-3">
                        <ShieldCheck size={14} /> {resolvedUnionIds.length > 1 ? 'More than one union covers this role here' : 'Covers this role here'}
                      </p>
                    )}
                  </div>

                  {productionTypes.length > 1 && (
                    <div>
                      <Label>Production Type (sets the rate card)</Label>
                      <Select value={form.productionTier || ''} onChange={e => set({ productionTier: e.target.value || undefined })} className="h-16 text-base">
                        <option value="" className="bg-black">Choose the production type</option>
                        {productionTypes.map(t => t && <option key={t} value={t} className="bg-black">{t}</option>)}
                      </Select>
                    </div>
                  )}

                  {positions.length > 0 && (
                    <div>
                      <Label>Rate Card Position</Label>
                      <Select value={minimum?.position || ''} onChange={e => set({ ratePosition: e.target.value || undefined })} className="h-16 text-base">
                        {!minimum && <option value="" className="bg-black">Choose your position on the rate card</option>}
                        {positions.map(p => (
                          <option key={`${p.department}|${p.position}`} value={p.position} className="bg-black">
                            {p.position} — {p.hourly != null ? `${money(p.hourly)}/hr` : 'negotiable'}
                          </option>
                        ))}
                      </Select>
                    </div>
                  )}

                  <p className="text-xs text-white/40 italic leading-relaxed">
                    On a union set, union minimums apply to everyone hired under the agreement, member or not.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-white/40 italic leading-relaxed">
                  Non-union: pay is your rate × hours worked. No union overtime rules apply.
                </p>
              )}
            </Card>
          </div>

          <div className="space-y-10">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label>Date</Label>
                <Input type="date" value={form.startDate} onChange={e => set({ startDate: e.target.value })} className="h-16 font-mono text-base" />
              </div>
              <div>
                <Label>Days</Label>
                <Input type="number" min={1} max={366} step={1} value={form.daysWorked ?? ''} onChange={e => set({ daysWorked: num(e.target.value) })} className="h-16 font-mono text-xl" />
              </div>
              <div>
                <Label>Hours, call to wrap</Label>
                <Input type="number" min={0} max={24} step={0.25} inputMode="decimal" value={form.hoursPerDay ?? ''} onChange={e => set({ hoursPerDay: num(e.target.value) })} className="h-16 font-mono text-xl" placeholder="12" />
              </div>
              <div>
                <Label>Unpaid meal (min)</Label>
                <Input type="number" min={0} max={600} step={5} inputMode="numeric" value={form.mealBreakMinutes ?? ''} onChange={e => set({ mealBreakMinutes: num(e.target.value) })} className="h-16 font-mono text-xl" placeholder="0" />
              </div>
            </div>
            {(form.daysWorked ?? 1) > 1 && <p className="text-xs text-white/40 italic -mt-6">Days with the same hours. Log days with different hours as separate entries.</p>}

            <div>
              <Label>Hourly Rate ($)</Label>
              <Input
                type="number" min={0} step={0.01} inputMode="decimal"
                value={form.hourlyRate ?? ''}
                onChange={e => set({ hourlyRate: num(e.target.value) })}
                placeholder={minimum?.hourly != null ? minimum.hourly.toFixed(2) : 'Your rate'}
                className="h-16 font-mono text-2xl"
              />
              {form.isUnion && minimum && (
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                  {minimum.hourly != null ? (
                    <>
                      <span className="text-white/50 italic">
                        Union minimum {money(minimum.hourly)}/hr{minimum.daily != null && ` · ${money(minimum.daily)}/day`}
                      </span>
                      {status === 'below' && <Badge color="danger" className="flex items-center gap-1"><AlertTriangle size={12} /> Below scale</Badge>}
                      {status === 'at' && <Badge color="accent">At scale</Badge>}
                      {status === 'above' && <Badge color="success">Above scale</Badge>}
                      {form.hourlyRate == null && <span className="text-white/30 italic">(filled in for you)</span>}
                    </>
                  ) : (
                    <span className="text-white/50 italic">This position's rate is negotiable under the agreement. Enter what you were paid.</span>
                  )}
                </div>
              )}
              {needsProductionType && <p className="mt-3 text-xs text-white/50 italic">Choose the production type to see the union minimum.</p>}
            </div>

            <Card className="p-8 md:p-10 border-accent/20 bg-accent/5 space-y-6">
              <div className="flex items-center gap-4 text-accent">
                <Clock size={18} />
                <h4 className="text-xs font-black uppercase tracking-[0.5em] italic leading-none">Your Pay</h4>
              </div>
              {pay ? (
                <>
                  <dl className="space-y-2 text-sm">
                    {pay.bands.map(b => (
                      <div key={b.label} className="flex justify-between text-white/70">
                        <dt>{b.label} · {hours(b.hours)}{b.multiplier !== 1 && ` @ ${money((priced.rate ?? 0) * b.multiplier)}`}</dt>
                        <dd className="font-mono">{money(b.amount)}</dd>
                      </div>
                    ))}
                    {pay.minimumTopUp > 0 && (
                      <div className="flex justify-between text-white/70">
                        <dt>{minimum?.daily ? 'Up to the daily fee' : 'Minimum call'}</dt>
                        <dd className="font-mono">{money(pay.minimumTopUp)}</dd>
                      </div>
                    )}
                    {pay.days > 1 && (
                      <div className="flex justify-between text-white/50 border-t border-white/10 pt-2">
                        <dt>Per day × {pay.days} days</dt>
                        <dd className="font-mono">{money(pay.total)}</dd>
                      </div>
                    )}
                  </dl>
                  <div className="flex justify-between items-end border-t border-white/10 pt-4">
                    <div className="text-white/50 text-xs uppercase tracking-widest font-black">
                      {hours(pay.totalHours)} worked{pay.totalOvertimeHours > 0 && ` · ${hours(pay.totalOvertimeHours)} overtime`}
                    </div>
                    <div className="text-3xl font-serif italic text-white">{money(pay.gross)}</div>
                  </div>
                  {rule && (
                    <p className="text-xs text-white/40 italic leading-relaxed">
                      {rule.title}: {describeOvertime(rule)}{rule.minimumCallHours ? `, ${rule.minimumCallHours}-hour minimum call` : ''}.
                      {' '}{rule.mealBreakNotes}
                      {rule.sourceUrl && <> <a href={rule.sourceUrl} target="_blank" rel="noreferrer" className="underline hover:text-accent">Source</a></>}
                    </p>
                  )}
                  {form.isUnion && !rule && form.unionTypeId && (
                    <p className="text-xs text-white/40 italic">We don't have this union's overtime rules yet, so this is rate × hours.</p>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-white/50 italic">
                    {worked.total > 0 ? `${hours(worked.total)} worked. Add your rate to see your pay.` : 'Add your hours and rate to see your pay.'}
                  </p>
                  <div>
                    <Label>Or a flat amount you were paid ($)</Label>
                    <Input type="number" min={0} step={0.01} value={form.grossEarnings ?? ''} onChange={e => set({ grossEarnings: num(e.target.value) })} className="h-14 font-mono text-lg" />
                  </div>
                </div>
              )}
            </Card>

            <div className="pt-4 flex flex-col gap-4 items-end">
              {error && <p role="alert" className="text-sm text-red-400 italic self-stretch">{error}</p>}
              <Button onClick={handleSave} isLoading={saving} className="h-20 px-16 shadow-glow w-full md:w-auto">Commit to Your Slate</Button>
              <button onClick={() => navigate('/jobs')} className="text-xs font-black uppercase tracking-[0.6em] text-white/40 hover:text-white transition-colors py-4">Discard Mark</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
