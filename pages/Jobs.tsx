
import React, { useState, useEffect } from 'react';
import { jobService } from '../services/jobService';
import { User, Job, UNIONS, DEPARTMENTS, FILM_ROLES, JobStatus } from '../types';
import { Heading, Text, Button, Input, Select, Badge } from '../components/ui';
import { ArrowLeft, ArrowUpRight, Upload, FileText, Trash2, DollarSign, Lock, FileSpreadsheet, Send } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

// --- Job List View ---
export const JobsList = ({ user }: { user: User }) => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const targetUserId = user.activeViewId || user.id;

  useEffect(() => {
    const fetch = async () => {
        setLoading(true);
        const data = await jobService.getJobs(targetUserId);
        setJobs(data);
        setLoading(false);
    }
    fetch();
  }, [targetUserId]);

  const handleBulkUpload = () => {
    if (!user?.isPremium) {
      alert("Bulk Upload is a Premium Feature. Go to Settings to upgrade.");
      return;
    }
    alert("Simulated: Bulk Import UI would open here.");
  };

  const filteredJobs = filter === 'ALL' ? jobs : jobs.filter(j => j.unionName === filter || (!j.isUnion && filter === 'Non-Union'));

  if (loading) return <div className="p-12 text-center text-neutral-400">Loading Production Data...</div>;

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
           <Text variant="caption">Production Log</Text>
           <Heading level={1}>Jobs</Heading>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex-1 md:w-64">
             <Select value={filter} onChange={e => setFilter(e.target.value)}>
               <option value="ALL">Filter: All Records</option>
               {UNIONS.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
               <option value="Non-Union">Non-Union</option>
             </Select>
          </div>
          <Button variant="secondary" onClick={handleBulkUpload}>
             <FileSpreadsheet className="w-4 h-4 mr-2" /> Import
          </Button>
          <Button onClick={() => navigate('/jobs/new')}>Log Job</Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="border-b border-[#121212]">
            <tr>
              <th className="py-4 pr-4 text-xs font-medium uppercase tracking-widest text-neutral-500">Date</th>
              <th className="py-4 pr-4 text-xs font-medium uppercase tracking-widest text-neutral-500">Status</th>
              <th className="py-4 pr-4 text-xs font-medium uppercase tracking-widest text-neutral-500">Production</th>
              <th className="py-4 pr-4 text-xs font-medium uppercase tracking-widest text-neutral-500 hidden md:table-cell">Role / Dept</th>
              <th className="py-4 pr-4 text-xs font-medium uppercase tracking-widest text-neutral-500 text-right">Credit</th>
              <th className="py-4 pl-4 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {filteredJobs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-neutral-400 font-serif text-xl italic">No records found.</td>
              </tr>
            ) : (
              filteredJobs.map(job => (
                <tr key={job.id} onClick={() => navigate(`/jobs/${job.id}`)} className="group cursor-pointer hover:bg-white transition-colors">
                  <td className="py-6 pr-4 align-top w-32">
                    <span className="font-mono text-sm text-neutral-600">
                      {new Date(job.startDate).toLocaleDateString(undefined, { year: '2-digit', month: '2-digit', day: '2-digit' })}
                    </span>
                  </td>
                  <td className="py-6 pr-4 align-top">
                    {job.status === 'TENTATIVE' ? (
                       <Badge color="neutral">Audition / Hold</Badge>
                    ) : (
                       <Badge color="success">Booked</Badge>
                    )}
                  </td>
                  <td className="py-6 pr-4 align-top">
                    <div className="font-serif text-xl text-[#121212] group-hover:text-[#C73E1D] transition-colors">{job.productionName}</div>
                    <div className="text-sm text-neutral-500 mt-1">{job.companyName}</div>
                    <div className="mt-2 md:hidden">
                       {job.isUnion ? <Badge color="neutral">{job.unionName}</Badge> : <Badge>Non-Union</Badge>}
                    </div>
                  </td>
                  <td className="py-6 pr-4 align-top hidden md:table-cell">
                    <div className="text-base text-neutral-900">{job.role}</div>
                    {job.department && <div className="text-xs text-neutral-500 mt-1">{job.department}</div>}
                    {job.isUpgrade && <span className="inline-block mt-1 text-[10px] bg-red-50 text-red-600 px-1 uppercase font-bold">Upgrade</span>}
                  </td>
                  <td className="py-6 pr-4 align-top text-right">
                    <div className="flex flex-col items-end gap-2">
                       <span className={`font-medium text-lg ${job.status === 'TENTATIVE' ? 'text-neutral-400 line-through decoration-neutral-300' : ''}`}>{job.totalHours}h</span>
                       {job.isUnion ? <Badge color="neutral">{job.unionName}</Badge> : <span className="text-xs text-neutral-300 font-medium tracking-wide">PRIVATE</span>}
                    </div>
                  </td>
                  <td className="py-6 pl-4 align-top text-right">
                    <ArrowUpRight className="w-5 h-5 text-neutral-300 group-hover:text-[#121212] transition-colors" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Job Detail / Edit View ---
export const JobDetail = ({ user }: { user: User }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const targetUserId = user.activeViewId || user.id;

  const [form, setForm] = useState<Partial<Job>>({
    status: 'CONFIRMED',
    productionName: '',
    companyName: '',
    role: '',
    department: '',
    isUnion: false,
    unionTypeId: '',
    creditType: 'OTHER',
    productionTier: '',
    isUpgrade: false,
    startDate: new Date().toISOString().split('T')[0],
    totalHours: 0,
    hourlyRate: 0,
    grossEarnings: 0,
    unionDeductions: 0,
    notes: '',
    documentCount: 0
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isNew && id) {
      jobService.getJobs(targetUserId).then(allJobs => {
          const existing = allJobs.find(j => j.id === id);
          if (existing) {
            setForm(existing);
          } else {
            navigate('/jobs');
          }
      });
    }
  }, [id, isNew, navigate, targetUserId]);

  // Auto-calc deductions when earnings or union changes
  useEffect(() => {
    if (form.unionTypeId && form.grossEarnings && form.grossEarnings > 0) {
       const union = UNIONS.find(u => u.id === form.unionTypeId);
       if (union && union.defaultDuesRate > 0) {
          const estimated = Math.round(form.grossEarnings * union.defaultDuesRate * 100) / 100;
          if (estimated !== form.unionDeductions) {
             setForm(prev => ({ ...prev, unionDeductions: estimated }));
          }
       }
    }
  }, [form.grossEarnings, form.unionTypeId]);

  const handleSave = async () => {
    if (!form.productionName || !form.startDate) return alert('Production Name and Date are required');
    setSaving(true);
    
    const union = UNIONS.find(u => u.id === form.unionTypeId);
    
    const jobData: any = {
      userId: targetUserId,
      status: form.status as JobStatus,
      productionName: form.productionName!,
      companyName: form.companyName || '',
      role: form.role || '',
      department: form.department || '',
      isUnion: !!form.unionTypeId,
      unionTypeId: form.unionTypeId,
      unionName: union?.name,
      creditType: form.creditType as any || 'OTHER',
      productionTier: form.productionTier,
      isUpgrade: form.isUpgrade,
      startDate: form.startDate!,
      endDate: form.endDate,
      totalHours: Number(form.totalHours) || 0,
      hourlyRate: Number(form.hourlyRate) || 0,
      grossEarnings: Number(form.grossEarnings) || 0,
      unionDeductions: Number(form.unionDeductions) || 0,
      notes: form.notes,
      documentCount: form.documentCount || 0
    };

    if (isNew) {
      await jobService.addJob(targetUserId, jobData);
    } else {
      await jobService.updateJob(targetUserId, id!, jobData);
    }
    setSaving(false);
    navigate('/jobs');
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      if (id) await jobService.deleteJob(targetUserId, id);
      navigate('/jobs');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-12 pb-24">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => navigate('/jobs')} className="pl-0 hover:bg-transparent">
          <ArrowLeft className="w-5 h-5 mr-2" /> Back
        </Button>
      </div>

      <div className="space-y-2">
         <Text variant="caption">{isNew ? 'New Entry' : 'Edit Entry'}</Text>
         <Heading level={2}>{form.productionName || 'Untitled Production'}</Heading>
      </div>

      <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
        
        {/* Core Info */}
        <div className="space-y-6">
          <Heading level={4}>Production Details</Heading>
          
          <div>
            <label className="block text-xs font-medium uppercase tracking-widest text-neutral-500 mb-2">Job Status</label>
            <Select 
              value={form.status} 
              onChange={e => setForm({...form, status: e.target.value as JobStatus})}
              className={form.status === 'TENTATIVE' ? 'text-neutral-500 italic' : 'text-[#121212] font-medium'}
            >
               <option value="CONFIRMED">Booked / Worked</option>
               <option value="TENTATIVE">Audition / Hold / Tentative</option>
            </Select>
            <Text variant="caption" className="mt-1">"Tentative" hours show as potential progress.</Text>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-widest text-neutral-500 mb-2">Production Name</label>
            <Input 
              value={form.productionName} 
              onChange={e => setForm({...form, productionName: e.target.value})}
              placeholder="e.g. The Handmaid's Tale"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-widest text-neutral-500 mb-2">Company / Producer</label>
            <Input 
              value={form.companyName} 
              onChange={e => setForm({...form, companyName: e.target.value})}
              placeholder="e.g. MGM Television"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-medium uppercase tracking-widest text-neutral-500 mb-2">Date</label>
               <Input 
                 type="date"
                 value={form.startDate} 
                 onChange={e => setForm({...form, startDate: e.target.value})}
               />
             </div>
             <div>
               <label className="block text-xs font-medium uppercase tracking-widest text-neutral-500 mb-2">Hours Worked</label>
               <Input 
                 type="number"
                 value={form.totalHours} 
                 onChange={e => setForm({...form, totalHours: Number(e.target.value)})}
               />
             </div>
          </div>
        </div>

        {/* Role & Classification */}
        <div className="space-y-6">
          <Heading level={4}>Role & Classification</Heading>

          <div>
             <label className="block text-xs font-medium uppercase tracking-widest text-neutral-500 mb-2">Role on Set</label>
             <Select value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
               <option value="">Select Role...</option>
               {FILM_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
             </Select>
          </div>

          <div>
             <label className="block text-xs font-medium uppercase tracking-widest text-neutral-500 mb-2">Department</label>
             <Select value={form.department} onChange={e => setForm({...form, department: e.target.value})}>
               <option value="">Select Department...</option>
               {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
             </Select>
          </div>

          <div className="pt-2 border-t border-neutral-100">
            <div className="flex items-center justify-between py-2">
               <label className="text-sm font-medium">Union Job?</label>
               <input 
                 type="checkbox" 
                 checked={form.isUnion}
                 onChange={e => setForm({...form, isUnion: e.target.checked})}
                 className="w-5 h-5 accent-[#121212]"
               />
            </div>
            
            {form.isUnion && (
               <div className="mt-4 space-y-4 animate-in slide-in-from-top-2">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-widest text-neutral-500 mb-2">Union Jurisdiction</label>
                    <Select value={form.unionTypeId} onChange={e => setForm({...form, unionTypeId: e.target.value})}>
                      <option value="">Select Union...</option>
                      {UNIONS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-widest text-neutral-500 mb-2">Credit Type</label>
                    <Select value={form.creditType} onChange={e => setForm({...form, creditType: e.target.value as any})}>
                      <option value="OTHER">Standard / Other</option>
                      <option value="BACKGROUND">Background</option>
                      <option value="PRINCIPAL">Principal / Actor</option>
                      <option value="STUNT">Stunt</option>
                      <option value="CREW">Crew Member</option>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between py-3 bg-[#F3F3F1] px-3 border border-neutral-200">
                     <label className="text-sm font-medium text-[#C73E1D] flex items-center gap-2">
                        <ArrowUpRight className="w-4 h-4"/>
                        Credit Upgrade?
                     </label>
                     <input 
                       type="checkbox" 
                       checked={form.isUpgrade}
                       onChange={e => setForm({...form, isUpgrade: e.target.checked})}
                       className="w-5 h-5 accent-[#C73E1D]"
                     />
                  </div>
               </div>
            )}
          </div>
        </div>

        {/* Financials (New Section) */}
        <div className="md:col-span-2 space-y-6 pt-6 border-t border-neutral-200">
          <Heading level={4}>Financials (Private)</Heading>
          <div className="grid md:grid-cols-3 gap-6">
             <div>
                <label className="block text-xs font-medium uppercase tracking-widest text-neutral-500 mb-2">Hourly Rate</label>
                <div className="relative">
                   <DollarSign className="w-4 h-4 absolute left-0 top-3 text-neutral-400" />
                   <Input 
                     type="number"
                     className="pl-6"
                     value={form.hourlyRate} 
                     onChange={e => setForm({...form, hourlyRate: Number(e.target.value)})}
                   />
                </div>
             </div>
             <div>
                <label className="block text-xs font-medium uppercase tracking-widest text-neutral-500 mb-2">Gross Earnings</label>
                <div className="relative">
                   <DollarSign className="w-4 h-4 absolute left-0 top-3 text-neutral-400" />
                   <Input 
                     type="number"
                     className="pl-6"
                     value={form.grossEarnings} 
                     onChange={e => setForm({...form, grossEarnings: Number(e.target.value)})}
                   />
                </div>
             </div>
             <div>
                <label className="block text-xs font-medium uppercase tracking-widest text-neutral-500 mb-2 flex justify-between">
                   Union Dues/Fees
                   <span className="text-[10px] text-[#C73E1D]">{form.unionTypeId ? 'AUTO-CALC' : ''}</span>
                </label>
                <div className="relative">
                   <DollarSign className="w-4 h-4 absolute left-0 top-3 text-neutral-400" />
                   <Input 
                     type="number"
                     className="pl-6"
                     value={form.unionDeductions} 
                     onChange={e => setForm({...form, unionDeductions: Number(e.target.value)})}
                   />
                </div>
                <Text variant="caption" className="mt-1">
                   {form.unionTypeId ? `Estimated based on ${UNIONS.find(u => u.id === form.unionTypeId)?.name} standard rates.` : 'Enter manual deductions.'}
                </Text>
             </div>
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-neutral-200 flex justify-between">
        {!isNew && <Button variant="danger" onClick={handleDelete} disabled={saving}>Delete Entry</Button>}
        <div className="flex gap-4 ml-auto">
           <Button variant="ghost" onClick={() => navigate('/jobs')} disabled={saving}>Cancel</Button>
           <Button onClick={handleSave} isLoading={saving}>Save Record</Button>
        </div>
      </div>
    </div>
  );
};
