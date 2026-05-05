import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { CoachProfileDto, UpdateCoachDto } from './dto/coach-profile.dto.js';

type AuthUser = {
  id: number;
  role: UserRole;
  coach: { id: number } | null;
};

@Injectable()
export class CoachesService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyProfile(user: AuthUser): Promise<CoachProfileDto> {
    if (!user.coach) throw new ForbiddenException('Not a coach account');
    return this.buildProfile(user.coach.id, user.id);
  }

  async updateMyProfile(user: AuthUser, dto: UpdateCoachDto): Promise<CoachProfileDto> {
    if (!user.coach) throw new ForbiddenException('Not a coach account');
    await this.prisma.coach.update({
      where: { id: user.coach.id },
      data: {
        ...(dto.specialty !== undefined && { specialty: dto.specialty }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
      },
    });
    return this.buildProfile(user.coach.id, user.id);
  }

  private async buildProfile(coachId: number, userId: number): Promise<CoachProfileDto> {
    const [coach, user, athleteCount] = await Promise.all([
      this.prisma.coach.findUniqueOrThrow({ where: { id: coachId } }),
      this.prisma.user.findUniqueOrThrow({ where: { id: userId } }),
      this.prisma.coachAthlete.count({
        where: { coachId, status: 'ACTIVE' },
      }),
    ]);

    return {
      id: coach.id,
      userId,
      firstName: user.firstName,
      lastName: user.lastName,
      initials: `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase(),
      avatarUrl: user.avatarUrl,
      specialty: coach.specialty,
      bio: coach.bio,
      athleteCount,
    };
  }
}
