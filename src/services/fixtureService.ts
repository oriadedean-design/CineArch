import { jobService } from './jobService';
import { trackingService } from './trackingService';
import { UNIONS, UserUnionTracking } from '../types';
import { api } from './storage';

export const fixtureService = {
  async seedWaveOne(userId: string) {
    const union = UNIONS[0];
    const trackers: UserUnionTracking[] = [
      {
        id: `track_${Date.now()}`,
        userId,
        unionTypeId: union.id,
        unionName: union.name,
        tierLabel: union.tiers[0].name,
        targetType: union.tiers[0].targetType,
        targetValue: union.tiers[0].targetValue,
        department: union.tiers[0].requiresDepartment ? 'Production' : undefined,
        startingValue: 3,
      },
    ];

    if (api.tracking) {
      api.tracking.save(userId, trackers);
    } else {
      await trackingService.saveTrackers(userId, trackers);
    }

    const sampleJob = {
      userId,
      status: 'CONFIRMED' as const,
      productionName: 'Pilot Episode',
      companyName: 'Northern Studios',
      role: 'Background Performer',
      department: 'Production',
      isUnion: true,
      unionTypeId: union.id,
      unionName: union.name,
      creditType: 'ACTOR' as const,
      isUpgrade: false,
      productionTier: 'Tier B',
      startDate: new Date().toISOString().split('T')[0],
      totalHours: 10,
      hourlyRate: 35,
      grossEarnings: 350,
      unionDeductions: 8,
      notes: 'Seeded sample',
      documentCount: 0,
    };

    await jobService.addJob(userId, sampleJob as any);
  },
};
