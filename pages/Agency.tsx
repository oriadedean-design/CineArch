
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Heading, Text, Card, Button, Badge, ProgressBar } from '../components/ui';
import { OrgSeat, OrgMembership, UsageCounter, Subscription } from '../types';
import { Users, Mail, CreditCard, Shield, Activity, UserPlus, Upload, AlertCircle } from 'lucide-react';

export const Agency = () => {
    const [orgId, setOrgId] = useState<string | null>(localStorage.getItem('cinearch_org_id'));
    const [seats, setSeats] = useState<OrgSeat[]>([]);
    const [roster, setRoster] = useState<OrgMembership[]>([]);
    const [usage, setUsage] = useState<UsageCounter | null>(null);
    const [sub, setSub] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orgId) return;
        const load = async () => {
            const [s, r, u, sb] = await Promise.all([
                api.orgs.getSeats(orgId),
                api.orgs.getRoster(orgId),
                api.orgs.getUsage(orgId),
                api.orgs.getSubscription(orgId)
            ]);
            setSeats(s);
            setRoster(r);
            setUsage(u);
            setSub(sb);
            setLoading(false);
        };
        load();
    }, [orgId]);

    const handleInvite = async () => {
        const email = prompt("Enter email to invite:");
        if (email && orgId) {
            try {
                await api.orgs.inviteMember(orgId, email);
                alert("Invitation sent!");
            } catch (e) {
                alert("Failed to send invite. Check usage limits.");
            }
        }
    };

    if (loading) return <div>Loading Agency Portal...</div>;

    const assignedSeats = seats.filter(s => s.assigned_user_id).length;
    const totalSeats = seats.length; // Or unlimited depending on plan logic

    return (
        <div className="space-y-12">
            <div className="flex justify-between items-end">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Badge color="accent">Agency Portal</Badge>
                        <span className="text-xs font-mono text-gray-500 uppercase">ID: {orgId?.slice(0,8)}</span>
                    </div>
                    <Heading level={1}>Command Center</Heading>
                    <Text className="text-textSecondary">Manage your roster, seats, and billing.</Text>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => alert("Bulk Import CSV flow")}>
                        <Upload className="w-4 h-4 mr-2" /> Bulk Import
                    </Button>
                    <Button onClick={handleInvite}>
                        <UserPlus className="w-4 h-4 mr-2" /> Invite Member
                    </Button>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid md:grid-cols-4 gap-6">
                <Card className="p-6 bg-surfaceHighlight/20 border-white/10">
                    <div className="flex items-center gap-3 mb-4 text-gray-400">
                        <Users className="w-5 h-5" />
                        <span className="text-xs font-bold uppercase tracking-widest">Seat Usage</span>
                    </div>
                    <div className="text-4xl font-serif text-white mb-2">{assignedSeats} <span className="text-lg text-gray-500 font-sans">/ {totalSeats || '∞'}</span></div>
                    <ProgressBar progress={(assignedSeats / (totalSeats || 1)) * 100} className="h-1.5" />
                </Card>

                <Card className="p-6 bg-surfaceHighlight/20 border-white/10">
                    <div className="flex items-center gap-3 mb-4 text-gray-400">
                        <Activity className="w-5 h-5" />
                        <span className="text-xs font-bold uppercase tracking-widest">Monthly Credits</span>
                    </div>
                    <div className="flex justify-between items-end mb-1">
                        <span className="text-sm text-gray-400">Invites</span>
                        <span className="text-white font-bold">{usage?.invites_used || 0} used</span>
                    </div>
                    <div className="flex justify-between items-end">
                        <span className="text-sm text-gray-400">Imports</span>
                        <span className="text-white font-bold">{usage?.import_credits_used || 0} used</span>
                    </div>
                </Card>

                <Card className="p-6 bg-surfaceHighlight/20 border-white/10">
                     <div className="flex items-center gap-3 mb-4 text-gray-400">
                        <CreditCard className="w-5 h-5" />
                        <span className="text-xs font-bold uppercase tracking-widest">Subscription</span>
                    </div>
                    <div className="text-2xl font-serif text-white capitalize">{sub?.tier || 'Free'} Plan</div>
                    <div className="flex items-center gap-2 mt-2">
                        <span className={`w-2 h-2 rounded-full ${sub?.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-xs text-gray-400 uppercase">{sub?.status || 'Inactive'}</span>
                    </div>
                </Card>
            </div>

            {/* Roster Table */}
            <div className="space-y-4">
                <Heading level={3}>Active Roster</Heading>
                <div className="rounded-xl border border-white/10 overflow-hidden bg-surface">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/5 text-gray-400 font-bold uppercase text-xs">
                            <tr>
                                <th className="p-4">Name</th>
                                <th className="p-4">Role</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {roster.map(mem => (
                                <tr key={mem.user_id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-white">{mem.profile?.name || 'Unknown'}</div>
                                        <div className="text-xs text-gray-500">{mem.profile?.email}</div>
                                    </td>
                                    <td className="p-4">
                                        <Badge color={mem.member_role === 'owner' ? 'accent' : 'neutral'}>{mem.member_role}</Badge>
                                    </td>
                                    <td className="p-4 text-gray-400 capitalize">{mem.status}</td>
                                    <td className="p-4 text-right">
                                        <Button variant="ghost" className="text-xs h-8">Manage</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
