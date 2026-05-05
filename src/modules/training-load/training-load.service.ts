import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CoachAthleteStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { TrainingLoadDto } from './dto/training-load.dto.js';

type AuthUser = {
  id: number;
  role: UserRole;
  athlete: { id: number } | null;
  coach: { id: number } | null;
};

@Injectable()
export class TrainingLoadService {
  constructor(private readonly prisma: PrismaService) {}

  async getLoad(athleteId: number, user: AuthUser, weeks: number = 6): Promise<TrainingLoadDto> {
    await this.assertAccess(athleteId, user);

    const snapshots = await this.prisma.trainingLoadSnapshot.findMany({
      where: { athleteId },
      orderBy: { weekStart: 'desc' },
      take: weeks,
    });

    if (snapshots.length === 0) {
      throw new NotFoundException('No training load data found for this athlete');
    }

    const [latest, ...rest] = snapshots;
    const history = [...rest, latest].reverse().map((s) => ({
      weekStart: s.weekStart.toISOString().split('T')[0],
      acute: s.acute,
      chronic: s.chronic,
    }));

    return {
      athleteId,
      current: {
        acute: latest.acute,
        chronic: latest.chronic,
        acwr: latest.acwr,
        trend: latest.trend.toLowerCase(),
        monotony: latest.monotony,
        strain: latest.strain,
      },
      history,
    };
  }

  private async assertAccess(athleteId: number, user: AuthUser): Promise<void> {
    if (user.role === UserRole.ATHLETE) {
      if (user.athlete?.id !== athleteId) throw new ForbiddenException();
    } else if (user.role === UserRole.COACH) {
      const rel = await this.prisma.coachAthlete.findUnique({
        where: { coachId_athleteId: { coachId: user.coach!.id, athleteId } },
      });
      if (!rel || rel.status !== CoachAthleteStatus.ACTIVE) {
        throw new ForbiddenException('Athlete not in your roster');
      }
    }
  }
}
