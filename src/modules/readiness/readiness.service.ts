import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CoachAthleteStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { CreateReadinessDto, ReadinessDto } from './dto/readiness.dto.js';

type AuthUser = {
  id: number;
  role: UserRole;
  athlete: { id: number } | null;
  coach: { id: number } | null;
};

@Injectable()
export class ReadinessService {
  constructor(private readonly prisma: PrismaService) {}

  async getLatest(athleteId: number, user: AuthUser): Promise<ReadinessDto> {
    await this.assertAccess(athleteId, user);
    const record = await this.prisma.readiness.findFirst({
      where: { athleteId },
      orderBy: { recordedAt: 'desc' },
    });
    if (!record) throw new NotFoundException('No readiness data found');
    return this.toDto(record);
  }

  async getHistory(
    athleteId: number,
    user: AuthUser,
    from?: string,
    to?: string,
  ): Promise<ReadinessDto[]> {
    await this.assertAccess(athleteId, user);
    const records = await this.prisma.readiness.findMany({
      where: {
        athleteId,
        ...(from || to
          ? {
              recordedAt: {
                ...(from && { gte: new Date(from) }),
                ...(to && { lte: new Date(to) }),
              },
            }
          : {}),
      },
      orderBy: { recordedAt: 'asc' },
    });
    return records.map(this.toDto);
  }

  async create(
    athleteId: number,
    user: AuthUser,
    dto: CreateReadinessDto,
  ): Promise<ReadinessDto> {
    if (user.role !== UserRole.ATHLETE || user.athlete?.id !== athleteId) {
      throw new ForbiddenException('Athletes can only log their own readiness');
    }

    const overall = Math.round(
      (dto.sleep + dto.hrv + dto.soreness + dto.mood + dto.nutrition) / 5,
    );

    const record = await this.prisma.readiness.create({
      data: {
        athleteId,
        recordedAt: new Date(dto.recordedAt),
        overall,
        sleep: dto.sleep,
        hrv: dto.hrv,
        soreness: dto.soreness,
        mood: dto.mood,
        nutrition: dto.nutrition,
      },
    });
    return this.toDto(record);
  }

  private toDto(r: {
    id: number;
    athleteId: number;
    recordedAt: Date;
    overall: number;
    sleep: number;
    hrv: number;
    soreness: number;
    mood: number;
    nutrition: number;
  }): ReadinessDto {
    return {
      id: r.id,
      athleteId: r.athleteId,
      recordedAt: r.recordedAt.toISOString(),
      overall: r.overall,
      sleep: r.sleep,
      hrv: r.hrv,
      soreness: r.soreness,
      mood: r.mood,
      nutrition: r.nutrition,
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
