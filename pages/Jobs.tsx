
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Job, UNIONS, DEPARTMENTS, FILM_ROLES, JobStatus } from '../types';
import { Heading, Text, Button, Input, Select, Badge } from '../components/ui';
import { ArrowLeft, ArrowUpRight, Upload, FileText, Trash2, DollarSign, Lock, FileSpreadsheet, Send, Calendar, Briefcase, Camera, Users, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

// --- Job List View (Project Grid) ---
export const JobsList = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
        const j = await api.jobs.list();
        setJobs(j);
        setLoading(false);
    };
    fetchJobs();
  }, []);

  const handleBulkUpload = () => {
    // Feature Unlocked
    alert("Simulated: 42 Jobs Imported from Spreadsheet.");
  };

  const filteredJobs = filter === 'ALL' ? jobs : jobs.filter(j => j.unionName === filter || (!j.isUnion && filter === 'Non-Union'));

  if (loading) return <Loader2 className="animate-spin text-accent" />;

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
           <Text variant="caption">Production Log</Text>
           <Heading level={1}>Projects</Heading>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex-1 md:w-64">
             <Select value={filter} onChange={e => setFilter(e.target.value)}>
               <option value="ALL">All Projects</option>
               {UNIONS.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
               <option value="Non-Union">Non-Union / Indie</option>
             </Select>
          </div>
          <Button variant="outline" onClick={handleBulkUpload} className="hidden md:flex">
             <FileSpreadsheet className="w-4 h-4 mr-2" /> Import
          </Button>
          <Button onClick={() => navigate('/jobs/new')}>Log Project</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredJobs.length === 0 ? (
           <div className="col-span-full py-24 text-center border border-dashed border-white/10 rounded-3xl">
              <Text variant="subtle" className="text-xl">No projects found.</Text>
              <Button variant="ghost" className="mt-4" onClick={() => navigate('/jobs/new')}>Create First Entry</Button>
           </div>
        ) : (
          filteredJobs.map((job, idx) => (
            <div 
               key={job.id} 
               onClick={() => navigate(`/jobs/${job.id}`)}
               className="group relative aspect-[2/3] rounded-2xl overflow-hidden bg-surfaceHighlight border border-white/5 cursor-pointer shadow-glass hover:shadow-glow transition-all duration-500"
            >
               {/* Cover Image */}
               <img 
                 src={job.imageUrl || "https://i.pinimg.com/736x/2f/e4/e2/2fe4e287633eaed874b09bb0ea45d695.jpg"} 
                 alt={job.productionName} 
                 className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
               />
               
               {/* Overlay Gradient */}
               <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 group-hover:opacity-80 transition-opacity" />
               
               {/* Status Badge */}
               <div className="absolute top-3 right-3">
                  {job.status === 'TENTATIVE' ? (
                     <Badge color="neutral">Hold</Badge>
                  ) : (
                     <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_#22c55e]" />
                  )}
               </div>

               {/* Content */}
               <div className="absolute bottom-0 left-0 w-full p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <div className="mb-1 flex items-center gap-2">
                     <span className="text-[10px] font-bold text-accent uppercase tracking-widest border border-accent/20 px-1 rounded bg-black/50 backdrop-blur-sm">
                        {job.isUnion ? job.unionName : 'Indie'}
                     </span>
                  </div>
                  <h3 className="text-xl font-serif text-white leading-tight mb-1 truncate">{job.productionName}</h3>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{job.role}</p>
                  
                  <div className="mt-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 border-t border-white/10 pt-2">
                     <span className="text-[10px] text-gray-500">{new Date(job.startDate).getFullYear()}</span>
                     <ArrowUpRight className="w-4 h-4 text-white" />
                  </div>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// --- Project Profile View (Detail) ---
export const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // For Agents: track which client this job is for
  const [selectedClientId, setSelectedClientId] = useState<string>('');

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
    documentCount: 0,
    imageUrl: '',
    genre: 'Drama'
  });

  useEffect(() => {
    const init = async () => {
        const u = await api.auth.getUser();
        setCurrentUser(u);
        setSelectedClientId(u?.activeViewId || u?.id || '');

        if (!isNew && id) {
           const jobs = await api.jobs.list(u?.activeViewId || u?.id); // In real app, fetch by ID directly
           const existing = jobs.find(j => j.id === id);
           if (existing) {
               setForm(existing);
               setSelectedClientId(existing.userId);
           } else {
               navigate('/jobs');
           }
        }
        setLoading(false);
    };
    init();
  }, [id, isNew, navigate]);

  if (loading) return <Loader2 className="animate-spin text-accent" />;

  const isAgent = currentUser?.accountType === 'AGENT';

  const handleSave = async () => {
    if (!form.productionName || !form.startDate) return alert('Production Name and Date are required');
    const union = UNIONS.find(u => u.id === form.unionTypeId);
    
    // Determine user context logic
    const targetUserId = selectedClientId || currentUser?.id;
    
    const jobData: Job = {
      id: isNew ? '' : id!, // ID handled by DB on insert
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
      documentCount: form.documentCount || 0,
      createdAt: new Date().toISOString(),
      imageUrl: form.imageUrl,
      genre: form.genre
    };

    if (isNew) {
        await api.jobs.add(jobData);
    } else {
        await api.jobs.update(jobData);
    }
    
    navigate('/jobs');
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/jobs')} className="pl-0 hover:bg-transparent text-gray-500 hover:text-white">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Projects
        </Button>
      </div>

      <div className="grid md:grid-cols-12 gap-8">
         {/* Left Column - Cover Art & Quick Actions */}
         <div className="md:col-span-4 space-y-6">
            <div className="aspect-[2/3] rounded-2xl bg-surfaceHighlight border border-white/10 relative overflow-hidden group shadow-2xl">
               <img 
                  src={form.imageUrl || "https://i.pinimg.com/1200x/93/12/3d/93123dd53e97af01df8790876de7a553.jpg"} 
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                  alt="Cover"
               />
               <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="glass" className="h-10 w-10 rounded-full p-0 flex items-center justify-center">
                     <Camera className="w-4 h-4" />
                  </Button>
               </div>
            </div>
            
            <div className="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-4">
               <Heading level={4} className="text-white">Project Specs</Heading>
               <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Genre</label>
                  <Input value={form.genre} onChange={e => setForm({...form, genre: e.target.value})} placeholder="e.g. Sci-Fi" className="bg-black/50 text-sm py-2" />
               </div>
               <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Company</label>
                  <Input value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} placeholder="Production Co." className="bg-black/50 text-sm py-2" />
               </div>
            </div>
         </div>

         {/* Right Column - Editor Form */}
         <div className="md:col-span-8 space-y-8">
            {/* Agent Client Select */}
            {isAgent && (
                <div className="bg-accent/10 border border-accent/20 p-4 rounded-xl flex items-center gap-4 mb-4 animate-in fade-in">
                    <div className="p-2 bg-accent/20 rounded-lg text-accent"><Users className="w-5 h-5"/></div>
                    <div className="flex-1">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-accent mb-1">Logging on behalf of</label>
                        <select 
                            value={selectedClientId} 
                            onChange={e => setSelectedClientId(e.target.value)}
                            className="w-full bg-black/30 text-white border-none rounded focus:ring-1 focus:ring-accent text-sm py-1"
                        >
                            {/* Option for Agent themselves if they log their own jobs? Usually not, but safer to include */}
                            <option value={currentUser.id}>My Personal Log</option>
                            {currentUser.managedUsers?.map((client: any) => (
                                <option key={client.id} value={client.id}>{client.name} (Client)</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            <div className="border-b border-white/10 pb-6">
               <div className="flex items-center gap-3 mb-2">
                  <Text variant="caption">{isNew ? 'New Entry' : 'Project Profile'}</Text>
                  {form.status === 'TENTATIVE' && <Badge color="neutral">Tentative</Badge>}
               </div>
               <Input 
                  value={form.productionName} 
                  onChange={e => setForm({...form, productionName: e.target.value})}
                  className="text-4xl md:text-5xl font-serif bg-transparent border-none px-0 py-2 focus:ring-0 placeholder:text-white/20"
                  placeholder="Untitled Project"
               />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
               <div className="space-y-4">
                  <div className="flex items-center gap-2 text-accent">
                     <Briefcase className="w-4 h-4" />
                     <h3 className="font-bold text-sm uppercase tracking-wide">Role Details</h3>
                  </div>
                  <div>
                     <label className="block text-xs font-medium text-gray-500 mb-2">Role</label>
                     <Select value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                        <option value="">Select Role...</option>
                        {FILM_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                     </Select>
                  </div>
                  <div>
                     <label className="block text-xs font-medium text-gray-500 mb-2">Union Status</label>
                     <Select value={form.unionTypeId || ''} onChange={e => setForm({...form, unionTypeId: e.target.value, isUnion: !!e.target.value})}>
                        <option value="">Non-Union</option>
                        {UNIONS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                     </Select>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="flex items-center gap-2 text-accent">
                     <Calendar className="w-4 h-4" />
                     <h3 className="font-bold text-sm uppercase tracking-wide">Schedule & Pay</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-2">Start Date</label>
                        <Input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-2">End Date</label>
                        <Input type="date" value={form.endDate || ''} onChange={e => setForm({...form, endDate: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-medium text-gray-500 mb-2">Hours</label>
                        <Input type="number" value={form.totalHours} onChange={e => setForm({...form, totalHours: Number(e.target.value)})} />
                     </div>
                     <div>
                        <label className="block text-xs font-medium text-gray-500 mb-2">Earnings ($)</label>
                        <Input type="number" value={form.grossEarnings} onChange={e => setForm({...form, grossEarnings: Number(e.target.value)})} />
                     </div>
                  </div>
               </div>
            </div>

            <div className="pt-8 flex justify-end gap-4">
               <Button variant="ghost" onClick={() => navigate('/jobs')}>Discard</Button>
               <Button onClick={handleSave} className="bg-white text-black px-8">Save Project</Button>
            </div>
         </div>
      </div>
    </div>
  );
};
