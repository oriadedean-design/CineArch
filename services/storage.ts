import { supabase } from './supabase';
import { registerSession, clearSession, verifySession } from './auth';
import { User, Job, UserUnionTracking, ResidencyDocument, AgencyInvite } from '../types';
import { isDemoMode, DEMO_USER, DEMO_JOBS, DEMO_TRACKING } from './demo';
import type { Tables, TablesInsert, TablesUpdate } from './database.types';

/**
 * CINEARCH DATA BRIDGE (SUPABASE VERSION)
 * All reads/writes go through here. Row <-> model mapping lives in the
 * toX mapping helpers below so column names are defined in one place and
 * checked against the generated schema types.
 */

type ProfileRow = Tables<'profiles'>;
type JobRow = Tables<'jobs'>;
type TrackingRow = Tables<'union_tracking'>;
type DocumentRow = Tables<'residency_documents'>;

const ACTIVE_CLIENT_KEY = 'cinearch_active_client';
const DOCUMENTS_BUCKET = 'documents';

// ── Session helpers ─────────────────────────────────────────

// Reads the locally cached session — no network round trip.
// RLS enforces access on every query, so this is only used to scope them.
const sessionUserId = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user.id ?? null;
};

const requireUserId = async (): Promise<string> => {
  const id = await sessionUserId();
  if (!id) throw new Error('SEC_ERR_05: Session expired.');
  return id;
};

// The user whose data is on screen: the agent's selected client, or the user.
const effectiveUserId = async (): Promise<string> => {
  return localStorage.getItem(ACTIVE_CLIENT_KEY) || requireUserId();
};

// ── Mapping ─────────────────────────────────────────────────

const toUser = (p: ProfileRow): User => ({
  id: p.id,
  name: p.name || p.email,
  email: p.email,
  phone: p.phone ?? undefined,
  country: p.country ?? undefined,
  language: p.language ?? undefined,
  role: p.role || 'Member',
  province: p.province || '',
  region: (p.region ?? undefined) as User['region'],
  isOnboarded: p.is_onboarded || !!p.province,
  isPremium: p.is_premium,
  memberStatus: (p.member_status ?? undefined) as User['memberStatus'],
  careerFocus: p.career_focus ?? undefined,
  department: p.department ?? undefined,
  selectedRoles: p.selected_roles ?? undefined,
  goals: p.goals ?? undefined,
  hasAgentFee: p.has_agent_fee ?? undefined,
  agentFeePercentage: p.agent_fee_pct ?? undefined,
  entityType: (p.entity_type ?? undefined) as User['entityType'],
  cohortYear: p.cohort_year ?? undefined,
  programName: p.program_name ?? undefined,
  organizationName: p.organization_name ?? undefined,
  businessStructure: (p.business_structure ?? undefined) as User['businessStructure'],
  primaryIndustry: p.primary_industry ?? undefined,
  accountType: p.account_type as User['accountType'],
  managedByAgencyId: p.managed_by_agency_id ?? undefined,
  managedUsers: [],
});

// Only columns the authenticated role is granted UPDATE on
// (see 20261008000002_lock_profile_privileges.sql).
const toProfileUpdate = (u: Partial<User>): TablesUpdate<'profiles'> => {
  const row: TablesUpdate<'profiles'> = {};
  if (u.name !== undefined) row.name = u.name;
  if (u.phone !== undefined) row.phone = u.phone;
  if (u.country !== undefined) row.country = u.country;
  if (u.language !== undefined) row.language = u.language;
  if (u.role !== undefined) row.role = u.role;
  if (u.province !== undefined) row.province = u.province;
  if (u.region !== undefined) row.region = u.region;
  if (u.isOnboarded !== undefined) row.is_onboarded = u.isOnboarded;
  if (u.memberStatus !== undefined) row.member_status = u.memberStatus;
  if (u.careerFocus !== undefined) row.career_focus = u.careerFocus;
  if (u.department !== undefined) row.department = u.department;
  if (u.selectedRoles !== undefined) row.selected_roles = u.selectedRoles;
  if (u.goals !== undefined) row.goals = u.goals;
  if (u.hasAgentFee !== undefined) row.has_agent_fee = u.hasAgentFee;
  if (u.agentFeePercentage !== undefined) row.agent_fee_pct = u.agentFeePercentage;
  if (u.entityType !== undefined) row.entity_type = u.entityType;
  if (u.organizationName !== undefined) row.organization_name = u.organizationName;
  if (u.businessStructure !== undefined) row.business_structure = u.businessStructure;
  if (u.primaryIndustry !== undefined) row.primary_industry = u.primaryIndustry;
  if (u.cohortYear !== undefined) row.cohort_year = u.cohortYear;
  if (u.programName !== undefined) row.program_name = u.programName;
  return row;
};

const toJob = (j: JobRow): Job => ({
  id: j.id,
  userId: j.user_id,
  status: j.status as Job['status'],
  productionName: j.production_name,
  companyName: j.company_name,
  role: j.role,
  department: j.department ?? undefined,
  isUnion: j.is_union,
  unionTypeId: j.union_type_id ?? undefined,
  unionName: j.union_name ?? undefined,
  creditType: (j.credit_type ?? undefined) as Job['creditType'],
  isUpgrade: j.is_upgrade ?? undefined,
  productionTier: j.production_tier ?? undefined,
  startDate: j.start_date,
  endDate: j.end_date ?? undefined,
  totalHours: j.total_hours ?? 0,
  hourlyRate: j.hourly_rate ?? undefined,
  grossEarnings: j.gross_earnings ?? undefined,
  unionDeductions: j.union_deductions ?? undefined,
  notes: j.notes ?? undefined,
  documentIds: j.document_ids ?? undefined,
  documentCount: j.document_ids?.length ?? 0,
  imageUrl: j.image_url ?? undefined,
  genre: j.genre ?? undefined,
  province: j.province ?? undefined,
  createdAt: j.created_at,
});

// Postgres `date` columns: keep only YYYY-MM-DD so ISO timestamps and
// CSV values like "2026-03-01T00:00:00Z" don't shift by timezone.
const toDate = (value?: string): string | null => {
  if (!value) return null;
  const iso = /^\d{4}-\d{2}-\d{2}/.exec(value);
  if (iso) return iso[0];
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
};

const toJobRow = (job: Job) => ({
  status: job.status || 'CONFIRMED',
  production_name: job.productionName,
  company_name: job.companyName || '',
  role: job.role || 'Crew',
  department: job.department ?? null,
  is_union: !!job.isUnion,
  union_type_id: job.unionTypeId || null,
  union_name: job.unionName ?? null,
  credit_type: job.creditType ?? null,
  is_upgrade: job.isUpgrade ?? false,
  production_tier: job.productionTier ?? null,
  start_date: toDate(job.startDate) ?? new Date().toISOString().slice(0, 10),
  end_date: toDate(job.endDate),
  total_hours: job.totalHours || 0,
  hourly_rate: job.hourlyRate ?? null,
  gross_earnings: job.grossEarnings ?? null,
  union_deductions: job.unionDeductions ?? null,
  notes: job.notes ?? null,
  image_url: job.imageUrl ?? null,
  genre: job.genre ?? null,
  province: job.province ?? null,
});

// Inclusive day span of a job; single-day when there's no end date.
const workedDays = (job: Job): number => {
  if (!job.endDate) return 1;
  const ms = Date.parse(job.endDate) - Date.parse(job.startDate);
  return isNaN(ms) || ms < 0 ? 1 : Math.round(ms / 86_400_000) + 1;
};

const toTracking = (t: TrackingRow): UserUnionTracking => ({
  id: t.id,
  userId: t.user_id,
  unionTypeId: t.union_type_id,
  unionName: t.union_name,
  tierLabel: t.tier_label,
  department: t.department ?? undefined,
  targetType: t.target_type as UserUnionTracking['targetType'],
  targetValue: t.target_value,
  startingValue: t.starting_value,
});

const toDocument = (d: DocumentRow): ResidencyDocument => ({
  id: d.id,
  userId: d.user_id,
  type: d.type,
  fileName: d.file_name,
  storagePath: d.storage_path,
  uploadedAt: d.uploaded_at,
  verified: d.verified,
});

const fetchProfile = async (id: string): Promise<ProfileRow | null> => {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
};

// ── API ─────────────────────────────────────────────────────

export const api = {
  auth: {
    // 1. Get Current Session & Profile
    getUser: async (): Promise<User | null> => {
      if (isDemoMode()) return DEMO_USER;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      // If agent is viewing a client, return that client's profile.
      // RLS only returns it if the client is on this agent's roster.
      const activeClientId = localStorage.getItem(ACTIVE_CLIENT_KEY);
      if (activeClientId && activeClientId !== session.user.id) {
        const client = await fetchProfile(activeClientId).catch(() => null);
        if (client) return { ...toUser(client), accountType: 'INDIVIDUAL', activeViewId: activeClientId };
        localStorage.removeItem(ACTIVE_CLIENT_KEY);
      }

      const profile = await fetchProfile(session.user.id);

      // The signup trigger creates the profile; if it's missing, send the user to onboarding.
      if (!profile) {
        return {
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Member',
          email: session.user.email!,
          role: 'Member',
          province: '',
          isOnboarded: false,
          accountType: 'INDIVIDUAL',
          isPremium: false,
          managedUsers: [],
        };
      }

      const user = toUser(profile);

      if (user.accountType === 'AGENT') {
        const [{ data: roster, error: rosterError }, { data: invites, error: inviteError }] = await Promise.all([
          supabase.from('profiles').select('*').eq('managed_by_agency_id', profile.id).order('name'),
          supabase.from('agency_invites').select('*').eq('agency_id', profile.id).eq('status', 'PENDING'),
        ]);
        if (rosterError) throw rosterError;
        if (inviteError) throw inviteError;

        user.managedUsers = [
          ...(roster || []).map(r => ({ ...toUser(r), isOnboarded: true })),
          ...(invites || []).map(i => ({
            id: i.id,
            name: i.name || i.email,
            email: i.email,
            role: 'Invited',
            province: i.province || '',
            isOnboarded: false,
            accountType: 'INDIVIDUAL' as const,
            inviteStatus: 'PENDING' as const,
          })),
        ];
      } else {
        const { data: invites } = await supabase.rpc('my_pending_invites');
        user.pendingInvites = (invites || []).map(i => ({
          id: i.id,
          agencyId: i.agency_id,
          agencyName: i.agency_name,
          createdAt: i.created_at,
        }));
      }

      return user;
    },

    // 2. Database Authentication (Login)
    async login(email: string, password?: string): Promise<User> {
      if (!password) throw new Error("SEC_ERR_04: Authentication key required.");

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error("AUTH_ERR: Failed to retrieve user session.");

      await registerSession();
      const user = await api.auth.getUser();
      if (!user) throw new Error("PROFILE_ERR: CineArch profile not found.");
      return user;
    },

    // 2b. Database Registration (New Personnel)
    // The profile row is created by the handle_new_user trigger.
    async register(email: string, password?: string, asAgent: boolean = false): Promise<User> {
      if (!password) throw new Error("SEC_ERR_04: Access key required.");
      if (password.length < 8) throw new Error("AUTH_ERR: Access key must be at least 8 characters.");

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: email.split('@')[0],
            account_type: asAgent ? 'AGENT' : 'INDIVIDUAL'
          }
        }
      });

      if (error) throw error;
      if (!data.user) throw new Error("AUTH_ERR: Personnel record creation failed.");

      // Email confirmation is on: no session until the link is clicked.
      if (!data.session) {
        throw new Error("REG_SUCCESS: Verification required. Please check your digital coordinate (email).");
      }

      await registerSession();
      const user = await api.auth.getUser();
      if (!user) throw new Error("PROFILE_ERR: CineArch profile initialization failed.");
      return user;
    },

    // 2c. Google OAuth Authentication
    async loginWithGoogle() {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
      return data;
    },

    // 2d. Password reset: email a recovery link that returns to the app,
    // where ResetPassword sets the new key.
    async requestPasswordReset(email: string): Promise<void> {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
    },

    async updatePassword(password: string): Promise<void> {
      if (password.length < 8) throw new Error("AUTH_ERR: Access key must be at least 8 characters.");
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    },

    // Called on app start / SIGNED_IN: records this device and signs out
    // devices evicted by the 3-session cap.
    verifySession,
    registerSession,

    // 3. Update the signed-in user's own profile
    async updateUser(updates: Partial<User>): Promise<User | null> {
      if (localStorage.getItem(ACTIVE_CLIENT_KEY)) {
        throw new Error("Client profiles can only be edited by the client. Exit client view to edit your own profile.");
      }
      const targetId = await requireUserId();
      const row = toProfileUpdate(updates);

      if (Object.keys(row).length > 0) {
        const { error } = await supabase.from('profiles').update(row).eq('id', targetId);
        if (error) throw error;
      }
      return api.auth.getUser();
    },

    async logout() {
      await clearSession();
      const { error } = await supabase.auth.signOut();
      if (error) console.error("Sign Out Error:", error);
      localStorage.removeItem(ACTIVE_CLIENT_KEY);
      localStorage.removeItem('cinearch_user');
      window.location.reload();
    },

    // Manage active client context for agents
    switchClient: async (clientId: string | null): Promise<void> => {
      if (clientId) localStorage.setItem(ACTIVE_CLIENT_KEY, clientId);
      else localStorage.removeItem(ACTIVE_CLIENT_KEY);
    },

    // Invite an individual to the agent's roster. They appear on the roster
    // once they accept from their own account (Settings → Agency Link).
    addClient: async (client: Pick<User, 'name' | 'email' | 'province'>): Promise<AgencyInvite> => {
      const agencyId = await requireUserId();
      const { data, error } = await supabase
        .from('agency_invites')
        .upsert(
          { agency_id: agencyId, email: client.email.trim().toLowerCase(), name: client.name, province: client.province, status: 'PENDING' },
          { onConflict: 'agency_id,email' }
        )
        .select()
        .single();
      if (error) throw error;
      return { id: data.id, agencyId: data.agency_id, agencyName: '', createdAt: data.created_at };
    },

    // Invitee accepts or declines an agency invite
    respondToInvite: async (inviteId: string, accept: boolean): Promise<void> => {
      const { error } = await supabase.rpc('respond_to_agency_invite', { p_invite_id: inviteId, p_accept: accept });
      if (error) throw error;
    },

    // The agency the current individual is linked to
    getAgency: async (): Promise<{ id: string; name: string } | null> => {
      const { data, error } = await supabase.rpc('my_agency');
      if (error) throw error;
      const agency = data?.[0];
      return agency ? { id: agency.id, name: agency.organization_name || agency.name || 'Agency' } : null;
    },

    // Revoke agency access to individual's profile
    revokeAgency: async (): Promise<void> => {
      const { error } = await supabase.rpc('leave_agency');
      if (error) throw error;
    },

    // Remove a managed individual (or cancel a pending invite) from an agent's roster
    removeManagedUser: async (clientId: string, isPendingInvite = false): Promise<void> => {
      const { error } = isPendingInvite
        ? await supabase.from('agency_invites').delete().eq('id', clientId)
        : await supabase.rpc('release_client', { p_client: clientId });
      if (error) throw error;
      if (localStorage.getItem(ACTIVE_CLIENT_KEY) === clientId) localStorage.removeItem(ACTIVE_CLIENT_KEY);
    }
  },

  jobs: {
    // Jobs for the effective user. Per-user job counts are small (a career
    // is hundreds of rows), and union progress needs the full history.
    async list(): Promise<Job[]> {
      if (isDemoMode()) return DEMO_JOBS;
      return api.jobs.listForClient(await effectiveUserId());
    },

    async listForClient(clientId: string): Promise<Job[]> {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', clientId)
        .order('start_date', { ascending: false });
      if (error) throw error;
      return (data || []).map(toJob);
    },

    // All roster clients' jobs in one query (agency dashboards)
    async listForClients(clientIds: string[]): Promise<Job[]> {
      if (clientIds.length === 0) return [];
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .in('user_id', clientIds)
        .order('start_date', { ascending: false });
      if (error) throw error;
      return (data || []).map(toJob);
    },

    async add(job: Job): Promise<Job> {
      const userId = job.userId && job.userId !== 'anon' ? job.userId : await effectiveUserId();
      const { data, error } = await supabase
        .from('jobs')
        .insert({ ...toJobRow(job), user_id: userId })
        .select()
        .single();
      if (error) throw error;
      return toJob(data);
    },

    // Bulk insert in one request (CSV import)
    async addMany(jobs: Job[], userId?: string): Promise<number> {
      if (jobs.length === 0) return 0;
      const target = userId || await effectiveUserId();
      const rows: TablesInsert<'jobs'>[] = jobs.map(j => ({ ...toJobRow(j), user_id: target }));
      const { error, count } = await supabase.from('jobs').insert(rows, { count: 'exact' });
      if (error) throw error;
      return count ?? rows.length;
    },

    async get(id: string): Promise<Job | null> {
      const { data, error } = await supabase.from('jobs').select('*').eq('id', id).maybeSingle();
      if (error || !data) return null;
      return toJob(data);
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase.from('jobs').delete().eq('id', id);
      if (error) throw error;
    },

    // Update existing job record
    async update(job: Job): Promise<Job> {
      const { data, error } = await supabase
        .from('jobs')
        .update(toJobRow(job))
        .eq('id', job.id)
        .select()
        .single();
      if (error) throw error;
      return toJob(data);
    }
  },

  tracking: {
    // Retrieve union tracking records for a user
    get: async (userId?: string): Promise<UserUnionTracking[]> => {
      if (isDemoMode()) return DEMO_TRACKING;
      const targetId = userId || await effectiveUserId();
      const { data, error } = await supabase.from('union_tracking').select('*').eq('user_id', targetId);
      if (error) throw error;
      return (data || []).map(toTracking);
    },

    // All roster clients' tracking in one query (agency dashboards)
    getForClients: async (clientIds: string[]): Promise<UserUnionTracking[]> => {
      if (clientIds.length === 0) return [];
      const { data, error } = await supabase.from('union_tracking').select('*').in('user_id', clientIds);
      if (error) throw error;
      return (data || []).map(toTracking);
    },

    // Persist union tracking records (one per union per user)
    save: async (trackings: UserUnionTracking[]): Promise<void> => {
      if (trackings.length === 0) return;
      const targetId = await effectiveUserId();
      const rows: TablesInsert<'union_tracking'>[] = trackings.map(t => ({
        user_id: targetId,
        union_type_id: t.unionTypeId,
        union_name: t.unionName,
        tier_label: t.tierLabel,
        department: t.department ?? null,
        target_type: t.targetType,
        target_value: t.targetValue,
        starting_value: t.startingValue || 0,
      }));
      const { error } = await supabase.from('union_tracking').upsert(rows, { onConflict: 'user_id,union_type_id' });
      if (error) throw error;
    },

    remove: async (unionTypeId: string): Promise<void> => {
      const targetId = await effectiveUserId();
      const { error } = await supabase.from('union_tracking').delete()
        .eq('user_id', targetId).eq('union_type_id', unionTypeId);
      if (error) throw error;
    },

    // Calculate progress towards union tier requirements
    calculateProgress: (track: UserUnionTracking, jobs: Job[]) => {
      const relevantJobs = jobs.filter(j =>
        (track.unionTypeId && j.unionTypeId === track.unionTypeId) || j.unionName === track.unionName
      );
      let current = track.startingValue || 0;
      if (track.targetType === 'HOURS') {
        current += relevantJobs.reduce((acc, job) => acc + (job.totalHours || 0), 0);
      } else if (track.targetType === 'EARNINGS') {
        current += relevantJobs.reduce((acc, job) => acc + (job.grossEarnings || 0), 0);
      } else if (track.targetType === 'DAYS') {
        current += relevantJobs.reduce((acc, job) => acc + workedDays(job), 0);
      } else {
        current += relevantJobs.length;
      }
      const percent = track.targetValue > 0 ? Math.min(100, (current / track.targetValue) * 100) : 0;
      return { percent, current, target: track.targetValue };
    }
  },

  vault: {
    // List documents for the signed-in user (documents are never shared with agents)
    list: async (): Promise<ResidencyDocument[]> => {
      if (isDemoMode()) return [];
      const userId = await sessionUserId();
      if (!userId) return [];
      const { data, error } = await supabase
        .from('residency_documents')
        .select('*')
        .eq('user_id', userId)
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(toDocument);
    },

    // Upload a file to the private bucket and record it. Path: <user_id>/<uuid>-<name>
    upload: async (file: File, type: string): Promise<ResidencyDocument> => {
      const userId = await requireUserId();
      const safeName = file.name.replace(/[^\w.\-]+/g, '_');
      const path = `${userId}/${crypto.randomUUID()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from('residency_documents')
        .insert({ user_id: userId, type, file_name: file.name, storage_path: path })
        .select()
        .single();
      if (error) {
        await supabase.storage.from(DOCUMENTS_BUCKET).remove([path]);
        throw error;
      }
      return toDocument(data);
    },

    // Short-lived link for viewing a private document
    getUrl: async (doc: ResidencyDocument, expiresInSeconds = 300): Promise<string> => {
      const { data, error } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .createSignedUrl(doc.storagePath!, expiresInSeconds);
      if (error) throw error;
      return data.signedUrl;
    },

    // Delete document metadata and its file
    delete: async (id: string): Promise<void> => {
      const { data, error } = await supabase
        .from('residency_documents')
        .delete()
        .eq('id', id)
        .select('storage_path')
        .maybeSingle();
      if (error) throw error;
      if (data?.storage_path) await supabase.storage.from(DOCUMENTS_BUCKET).remove([data.storage_path]);
    }
  },

  system: {
    // Purge the signed-in user's jobs, union tracking and documents (reset protocol)
    resetData: async (): Promise<void> => {
      const userId = await requireUserId();
      const { data: docs } = await supabase.from('residency_documents').select('storage_path').eq('user_id', userId);
      const results = await Promise.all([
        supabase.from('jobs').delete().eq('user_id', userId),
        supabase.from('union_tracking').delete().eq('user_id', userId),
        supabase.from('residency_documents').delete().eq('user_id', userId),
      ]);
      const failed = results.find(r => r.error);
      if (failed?.error) throw failed.error;
      const paths = (docs || []).map(d => d.storage_path);
      if (paths.length) await supabase.storage.from(DOCUMENTS_BUCKET).remove(paths);
    }
  }
};
