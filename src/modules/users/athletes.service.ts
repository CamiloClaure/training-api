import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AthleteTier, CoachAthleteStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { PaginatedResult } from '../../common/dto/pagination.dto.js';
import type { AthleteProfileDto, ActivePlanSummaryDto } from './dto/athlete-profile.dto.js';
import type { AthleteListItemDto, RosterQueryDto, InviteAthleteDto, CoachAthleteDto } from './dto/roster.dto.js';
import type { UpdateAthleteDto } from './dto/athlete-profile.dto.js';

type AuthUser = {
  id: number;
  role: UserRole;
  athlete: { id: number } | null;
  coach: { id: number } | null;
};

@Injectable()
export class AthletesService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyProfile(user: AuthUser): Promise<AthleteProfileDto> {
    if (!user.athlete) throw new ForbiddenException('Not an athlete account');
    return this.buildProfile(user.athlete.id, user.id);
  }

  async getAthleteById(athleteId: number, user: AuthUser): Promise<AthleteProfileDto> {
    if (user.role === UserRole.ATHLETE) {
      if (!user.athlete || user.athlete.id !== athleteId) {
        throw new ForbiddenException();
      }
    } else if (user.role === UserRole.COACH) {
      await this.assertCoachOwnsAthlete(user.coach!.id, athleteId);
    }
    const athlete = await this.prisma.athlete.findUnique({ where: { id: athleteId } });
    if (!athlete) throw new NotFoundException('Athlete not found');
    return this.buildProfile(athleteId, athlete.userId);
  }

  async updateMyProfile(user: AuthUser, dto: UpdateAthleteDto): Promise<AthleteProfileDto> {
    if (!user.athlete) throw new ForbiddenException('Not an athlete account');
    await this.prisma.athlete.update({
      where: { id: user.athlete.id },
      data: {
        ...(dto.birthDate && { birthDate: new Date(dto.birthDate) }),
        ...(dto.weightKg !== undefined && { weightKg: dto.weightKg }),
        ...(dto.heightCm !== undefined && { heightCm: dto.heightCm }),
        ...(dto.restingHr !== undefined && { restingHr: dto.restingHr }),
        ...(dto.maxHr !== undefined && { maxHr: dto.maxHr }),
        ...(dto.tier && { tier: dto.tier as AthleteTier }),
      },
    });
    return this.buildProfile(user.athlete.id, user.id);
  }

  async getRoster(coachUser: AuthUser, query: RosterQueryDto): Promise<PaginatedResult<AthleteListItemDto>> {
    if (!coachUser.coach) throw new ForbiddenException('Not a coach account');
    const { page, pageSize, search, tier } = query;
    const skip = (page - 1) * pageSize;

    const coachAthleteWhere = {
      coachId: coachUser.coach.id,
      status: CoachAthleteStatus.ACTIVE,
      athlete: {
        ...(tier && { tier: tier as AthleteTier }),
        ...(search && {
          user: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' as const } },
              { lastName: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
            ],
          },
        }),
      },
    };

    const [total, relations] = await Promise.all([
      this.prisma.coachAthlete.count({ where: coachAthleteWhere }),
      this.prisma.coachAthlete.findMany({
        where: coachAthleteWhere,
        skip,
        take: pageSize,
        include: {
          athlete: {
            include: {
              user: true,
              primarySport: true,
              readinessRecords: { orderBy: { recordedAt: 'desc' }, take: 1 },
              loadSnapshots: { orderBy: { weekStart: 'desc' }, take: 1 },
            },
          },
        },
      }),
    ]);

    const data: AthleteListItemDto[] = relations.map((r) => {
      const a = r.athlete;
      const latestReadiness = a.readinessRecords[0];
      const latestLoad = a.loadSnapshots[0];
      return {
        id: a.id,
        firstName: a.user.firstName,
        lastName: a.user.lastName,
        initials: this.initials(a.user.firstName, a.user.lastName),
        avatarUrl: a.user.avatarUrl,
        sport: a.primarySport?.name ?? 'Unknown',
        sportTypeId: a.primarySportTypeId,
        tier: a.tier,
        level: a.gamificationLevel,
        xp: a.gamificationXp,
        streak: a.streakDays,
        readiness: latestReadiness?.overall ?? 0,
        load: latestLoad?.acute ?? 0,
        acwr: latestLoad?.acwr ?? 0,
        trend: latestLoad?.trend.toLowerCase() ?? 'flat',
        coachAthleteStatus: r.status,
      };
    });

    return { data, meta: { total, page, pageSize } };
  }

  async inviteAthlete(coachUser: AuthUser, dto: InviteAthleteDto): Promise<CoachAthleteDto> {
    if (!coachUser.coach) throw new ForbiddenException('Not a coach account');

    let athleteId: number;
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { athlete: true },
    });

    if (existing?.athlete) {
      athleteId = existing.athlete.id;
    } else if (existing) {
      const athlete = await this.prisma.athlete.create({ data: { userId: existing.id } });
      athleteId = athlete.id;
    } else {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          passwordHash: '',
          firstName: dto.email.split('@')[0],
          lastName: '',
          role: UserRole.ATHLETE,
          athlete: { create: {} },
        },
        include: { athlete: true },
      });
      athleteId = user.athlete!.id;
    }

    const relation = await this.prisma.coachAthlete.upsert({
      where: { coachId_athleteId: { coachId: coachUser.coach.id, athleteId } },
      create: { coachId: coachUser.coach.id, athleteId, status: CoachAthleteStatus.PENDING },
      update: { status: CoachAthleteStatus.PENDING },
    });

    return {
      id: relation.id,
      coachId: relation.coachId,
      athleteId: relation.athleteId,
      status: relation.status,
      startedAt: relation.startedAt.toISOString(),
    };
  }

  async removeAthlete(coachUser: AuthUser, athleteId: number): Promise<void> {
    if (!coachUser.coach) throw new ForbiddenException('Not a coach account');
    await this.assertCoachOwnsAthlete(coachUser.coach.id, athleteId);
    await this.prisma.coachAthlete.update({
      where: { coachId_athleteId: { coachId: coachUser.coach.id, athleteId } },
      data: { status: CoachAthleteStatus.INACTIVE },
    });
  }

  // ─── helpers ──────────────────────────────────────────────

  private async buildProfile(athleteId: number, userId: number): Promise<AthleteProfileDto> {
    const [athlete, user, latestReadiness, latestLoad, activePlan] = await Promise.all([
      this.prisma.athlete.findUniqueOrThrow({
        where: { id: athleteId },
        include: { primarySport: true },
      }),
      this.prisma.user.findUniqueOrThrow({ where: { id: userId } }),
      this.prisma.readiness.findFirst({
        where: { athleteId },
        orderBy: { recordedAt: 'desc' },
      }),
      this.prisma.trainingLoadSnapshot.findFirst({
        where: { athleteId },
        orderBy: { weekStart: 'desc' },
      }),
      this.prisma.trainingPlan.findFirst({
        where: { athleteId, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        include: { weeks: { orderBy: { weekNumber: 'asc' } } },
      }),
    ]);

    let activePlanDto: ActivePlanSummaryDto | null = null;
    if (activePlan) {
      const totalWeeks = activePlan.weeks.length;
      const currentWeek = this.currentWeekNumber(activePlan.startDate);
      activePlanDto = {
        id: activePlan.id,
        name: activePlan.name,
        phase: activePlan.goal ?? 'Base',
        weekNumber: currentWeek,
        totalWeeks,
      };
    }

    const sportProfiles = athlete.primarySport
      ? [{ sportTypeId: athlete.primarySport.id, sportTypeName: athlete.primarySport.name, isPrimary: true }]
      : [];

    return {
      id: athlete.id,
      userId,
      firstName: user.firstName,
      lastName: user.lastName,
      initials: this.initials(user.firstName, user.lastName),
      avatarUrl: user.avatarUrl,
      birthDate: athlete.birthDate ? athlete.birthDate.toISOString().split('T')[0] : null,
      weightKg: athlete.weightKg,
      heightCm: athlete.heightCm,
      restingHr: athlete.restingHr,
      maxHr: athlete.maxHr,
      tier: athlete.tier,
      sportProfiles,
      activePlan: activePlanDto,
      nextRace: null,
      level: athlete.gamificationLevel,
      xp: athlete.gamificationXp,
      xpNext: athlete.gamificationXpNext,
      streak: athlete.streakDays,
      rank: null,
      badgesEarned: 0,
      badgesTotal: 0,
      readiness: latestReadiness?.overall ?? 0,
      load: latestLoad?.acute ?? 0,
      acwr: latestLoad?.acwr ?? 0,
      trend: latestLoad?.trend.toLowerCase() ?? 'flat',
    };
  }

  private initials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  private currentWeekNumber(startDate: Date): number {
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    return Math.max(1, Math.floor((Date.now() - startDate.getTime()) / msPerWeek) + 1);
  }

  private async assertCoachOwnsAthlete(coachId: number, athleteId: number): Promise<void> {
    const relation = await this.prisma.coachAthlete.findUnique({
      where: { coachId_athleteId: { coachId, athleteId } },
    });
    if (!relation || relation.status === CoachAthleteStatus.INACTIVE) {
      throw new ForbiddenException('Athlete not in your roster');
    }
  }
}
