import React, { useEffect, useState } from 'react';
import { Job, User, UserUnionTracking, UNIONS } from '../types';
import { trackingService } from '../services/trackingService';
import { jobService } from '../services/jobService';
import { Heading, Text, Badge, ProgressBar, Button, Disclaimer } from '../components/ui';
import { featureService } from '../services/featureService';
import { useNavigate } from 'react-router-dom';

interface TrackInsight {
  track: UserUnionTracking;
  current: number;
  potential: number;
  target: number;
  missing: string;
  percent: number;
}

export const Roadmap = ({ user }: { user: User }) => {
  const [tracks, setTracks] = useState<UserUnionTracking[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const targetUserId = user.activeViewId || user.id;

  const gate = featureService.hasAccess(user, 'union_wizard');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [t, j] = await Promise.all([
        trackingService.getTrackers(targetUserId),
        jobService.getJobs(targetUserId),
      ]);
      setTracks(t);
      setJobs(j);
      setLoading(false);
    };
    load();
  }, [targetUserId]);

  const buildInsight = (track: UserUnionTracking): TrackInsight => {
    const unionJobs = jobs.filter((j) => j.isUnion && j.unionName === track.unionName);
    const confirmed = unionJobs.filter((j) => j.status === 'CONFIRMED');
    const tentative = unionJobs.filter((j) => j.status === 'TENTATIVE');

    const valueFor = (list: Job[]) => {
      switch (track.targetType) {
        case 'DAYS':
          return list.length + (track.startingValue || 0);
        case 'HOURS':
          return list.reduce((sum, j) => sum + j.totalHours, track.startingValue || 0);
        case 'CREDITS':
          return list.filter((j) => j.creditType && j.creditType !== 'BACKGROUND').length + (track.startingValue || 0);
        case 'EARNINGS':
          return list.reduce((sum, j) => sum + (j.grossEarnings || 0), track.startingValue || 0);
        default:
          return track.startingValue || 0;
      }
    };

    const current = valueFor(confirmed);
    const potential = valueFor(confirmed.concat(tentative));
    const percent = Math.min((current / track.targetValue) * 100, 100);
    const remaining = Math.max(track.targetValue - current, 0);

    const unit = track.targetType === 'HOURS' ? 'hours' : track.targetType.toLowerCase();
    const missing = remaining === 0 ? 'Ready to apply' : `${remaining} ${unit} remaining`;

    return { track, current, potential, target: track.targetValue, missing, percent };
  };

  const insights = tracks.map(buildInsight);

  if (loading) return <div className="p-12 text-center text-neutral-400">Loading roadmap...</div>;

  if (!gate.allowed) {
    return (
      <div className="max-w-3xl mx-auto text-center space-y-6 py-16">
        <Heading level={2}>Union Roadmap</Heading>
        <Text variant="subtle">Upgrade to unlock guided eligibility wizards and progress tracking.</Text>
        <Button onClick={() => navigate('/settings')}>{gate.requiredPlan === 'AGENCY' ? 'Upgrade to Agency' : 'Upgrade to Pro'}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <Text variant="caption">Career Guidance</Text>
          <Heading level={1}>Union Roadmap</Heading>
        </div>
        <Button variant="secondary" onClick={() => navigate('/settings')}>Configure Tracking</Button>
      </div>

      {insights.length === 0 ? (
        <div className="border border-dashed border-neutral-300 p-12 text-center bg-white">
          <Text className="mb-4">No unions selected yet.</Text>
          <Button onClick={() => navigate('/settings')}>Add Unions</Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {insights.map((insight) => {
            const unionMeta = UNIONS.find((u) => u.id === insight.track.unionTypeId);
            return (
              <div key={insight.track.id} className="bg-white border border-neutral-200 p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-2xl">{insight.track.unionName}</h3>
                    <Text variant="small" className="mt-1">{insight.track.tierLabel}</Text>
                  </div>
                  {insight.percent >= 100 ? <Badge color="success">Eligible</Badge> : <Badge color="neutral">In Progress</Badge>}
                </div>
                <ProgressBar progress={insight.percent} />
                <div className="flex justify-between text-sm text-neutral-600">
                  <span>{insight.current} / {insight.target} {insight.track.targetType.toLowerCase()}</span>
                  <span className="font-medium">{insight.missing}</span>
                </div>
                {unionMeta?.tiers && (
                  <div className="text-xs text-neutral-500 leading-relaxed">
                    Next steps: keep accruing in your {insight.track.department || 'department'} lane and prepare documentation (vouchers, references, certificates).
                  </div>
                )}
                <Button variant="outline" onClick={() => navigate('/jobs/new')}>Log experience</Button>
              </div>
            );
          })}
        </div>
      )}

      <Disclaimer>
        CineArch provides educational guidance based on your tracker inputs. Confirm eligibility details with the relevant union before applying.
      </Disclaimer>
    </div>
  );
};
