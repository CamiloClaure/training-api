import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RedisService } from '../../redis/redis.service.js';
import type { AuthResponseDto, MeDto } from './dto/auth-response.dto.js';
import type { LoginDto } from './dto/login.dto.js';
import type { RegisterDto } from './dto/register.dto.js';

const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.issueTokens(user.id, user.email, user.role);
  }

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const role = dto.role === 'COACH' ? UserRole.COACH : UserRole.ATHLETE;

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role,
        ...(role === UserRole.COACH
          ? { coach: { create: {} } }
          : { athlete: { create: {} } }),
      },
    });

    return this.issueTokens(user.id, user.email, user.role);
  }

  async refresh(token: string): Promise<AuthResponseDto> {
    let payload: { sub: number; email: string; role: string };
    try {
      payload = this.jwtService.verify<typeof payload>(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const stored = await this.redisService.get(`refresh:${payload.sub}`);
    if (stored !== token) throw new UnauthorizedException('Refresh token revoked');

    return this.issueTokens(payload.sub, payload.email, payload.role as UserRole);
  }

  async logout(userId: number): Promise<void> {
    await this.redisService.del(`refresh:${userId}`);
  }

  async getMe(userId: number): Promise<MeDto> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatarUrl: user.avatarUrl,
    };
  }

  private async issueTokens(
    userId: number,
    email: string,
    role: UserRole | string,
  ): Promise<AuthResponseDto> {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('jwt.accessExpiresIn', '15m') as any,
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn', '7d') as any,
    });

    await this.redisService.set(`refresh:${userId}`, refreshToken, REFRESH_TTL_SECONDS);

    const user = await this.getMe(userId);
    return { accessToken, refreshToken, user };
  }
}
