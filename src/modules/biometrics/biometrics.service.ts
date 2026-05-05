import { ForbiddenException, Injectable } from '@nestjs/common';
import { CoachAthleteStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  BiometricsDto,
  BiometricSeriesDto,
  BiometricPointDto,
  BodyMetricDto,
  CreateBodyMetricDto,
} from './dto/biometrics.dto.js';

type AuthUser = {
  id: number;
  role: UserRole;
  athlete: { id: number } | null;
  coach: { id: number } | null;
};

type MetricKey = 'weight' | 'hrv' | 'sleep' | 'restingHr' | 'bodyFat' | 'vo2max';

const METRIC_META: Record<MetricKey, { field: string; unit: string }> = {
  weight: { field: 'weightKg', unit: 'kg' },
  hrv: { field: 'hrvMs', unit: 'ms' },
  sleep: { field: 'sleepHours', unit: 'h' },
  restingHr: { field: 'restingHr', unit: 'bpm' },
  bodyFat: { field: 'bodyFatPct', unit: '%' },
  vo2max: { field: 'vo2max', unit: 'ml/kg/min' },
};

@Injectable()
export class BiometricsService {
  constructor(private readonly prisma: PrismaService) {}

  async getBiometrics(
    athleteId: number,
    user: AuthUser,
    metricParam?: string,
    days: number = 90,
  ): Promise<BiometricsDto> {
    await this.assertAccess(athleteId, user);

    const requestedMetrics = (metricParam?.split(',') ?? Object.keys(METRIC_META)) as MetricKey[];
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const records = await this.prisma.bodyMetric.findMany({
      where: { athleteId, recordedAt: { gte: from } },
      orderBy: { recordedAt: 'asc' },
    });

    const metricsResult: Record<string, BiometricSeriesDto> = {};

    for (const metric of requestedMetrics) {
      const meta = METRIC_META[metric];
      if (!meta) continue;

      const field = meta.field as keyof typeof records[0];
      const points: BiometricPointDto[] = records
        .filter((r) => r[field] != null)
        .map((r) => ({
          recordedAt: r.recordedAt.toISOString().split('T')[0],
          value: r[field] as number,
        }));

      if (points.length === 0) continue;

      const first = points[0].value;
      const last = points[points.length - 1].value;
      metricsResult[metric] = {
        current: last,
        unit: meta.unit,
        delta: parseFloat((last - first).toFixed(2)),
        dataPoints: points,
      };
    }

    return { athleteId, metrics: metricsResult };
  }

  async createBodyMetric(
    athleteId: number,
    user: AuthUser,
    dto: CreateBodyMetricDto,
  ): Promise<BodyMetricDto> {
    if (user.role !== UserRole.ATHLETE || user.athlete?.id !== athleteId) {
      throw new ForbiddenException('Athletes can only log their own biometrics');
    }

    const record = await this.prisma.bodyMetric.create({
      data: {
        athleteId,
        recordedAt: new Date(dto.recordedAt),
        weightKg: dto.weightKg,
        bodyFatPct: dto.bodyFatPct,
        restingHr: dto.restingHr,
        vo2max: dto.vo2max,
        hrvMs: dto.hrvMs,
        sleepHours: dto.sleepHours,
        notes: dto.notes,
      },
    });

    return {
      id: record.id,
      athleteId: record.athleteId,
      recordedAt: record.recordedAt.toISOString(),
      weightKg: record.weightKg,
      bodyFatPct: record.bodyFatPct,
      restingHr: record.restingHr,
      vo2max: record.vo2max,
      hrvMs: record.hrvMs,
      sleepHours: record.sleepHours,
      notes: record.notes,
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
