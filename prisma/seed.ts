import 'dotenv/config';
import { PrismaClient, AthleteTier, CoachAthleteStatus, LoadTrend } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function mondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Sport types ──────────────────────────────────────────
  const [runSport, bikeSport, swimSport, strengthSport] = await Promise.all([
    prisma.sportType.upsert({ where: { name: 'run' },      update: {}, create: { name: 'run',      icon: 'run' } }),
    prisma.sportType.upsert({ where: { name: 'bike' },     update: {}, create: { name: 'bike',     icon: 'bike' } }),
    prisma.sportType.upsert({ where: { name: 'swim' },     update: {}, create: { name: 'swim',     icon: 'swim' } }),
    prisma.sportType.upsert({ where: { name: 'strength' }, update: {}, create: { name: 'strength', icon: 'dumbbell' } }),
    prisma.sportType.upsert({ where: { name: 'rest' },     update: {}, create: { name: 'rest',     icon: 'bed' } }),
  ]);
  console.log('✅ Sport types');

  // ─── Coach ────────────────────────────────────────────────
  const coachPasswordHash = await bcrypt.hash('coach123', 12);
  const coachUser = await prisma.user.upsert({
    where: { email: 'elena@example.com' },
    update: {},
    create: {
      email: 'elena@example.com',
      passwordHash: coachPasswordHash,
      firstName: 'Elena',
      lastName: 'Navarro',
      role: 'COACH',
      coach: { create: { specialty: 'Triathlon & Endurance', bio: 'Head coach with 10+ years coaching elite triathletes.' } },
    },
    include: { coach: true },
  });
  const coachId = coachUser.coach!.id;
  console.log('✅ Coach: elena@example.com / coach123');

  // ─── Athletes ─────────────────────────────────────────────
  const athletePassword = await bcrypt.hash('athlete123', 12);

  const athleteInputs = [
    { email: 'mara@example.com',  fn: 'Mara',  ln: 'Okafor',    tier: AthleteTier.PRO,    level: 24, xp: 4820, xpNext: 5200, streak: 47, sport: swimSport },
    { email: 'jonah@example.com', fn: 'Jonah', ln: 'Lindqvist', tier: AthleteTier.AMATEUR, level: 19, xp: 3210, xpNext: 3800, streak: 22, sport: runSport  },
    { email: 'amara@example.com', fn: 'Amara', ln: 'Silva',     tier: AthleteTier.PRO,    level: 28, xp: 6100, xpNext: 6600, streak: 63, sport: bikeSport },
    { email: 'dev@example.com',   fn: 'Dev',   ln: 'Patel',     tier: AthleteTier.AMATEUR, level: 12, xp: 1820, xpNext: 2200, streak:  8, sport: swimSport },
    { email: 'sara@example.com',  fn: 'Sara',  ln: 'Kim',       tier: AthleteTier.AMATEUR, level: 16, xp: 2640, xpNext: 3000, streak: 31, sport: swimSport },
    { email: 'luca@example.com',  fn: 'Luca',  ln: 'Romano',    tier: AthleteTier.AMATEUR, level: 22, xp: 3970, xpNext: 4400, streak: 55, sport: runSport  },
    { email: 'noor@example.com',  fn: 'Noor',  ln: 'Abbas',     tier: AthleteTier.AMATEUR, level: 14, xp: 2100, xpNext: 2400, streak:  0, sport: runSport  },
  ];

  const athletes: { id: number }[] = [];
  for (const a of athleteInputs) {
    const u = await prisma.user.upsert({
      where: { email: a.email },
      update: {},
      create: {
        email: a.email,
        passwordHash: athletePassword,
        firstName: a.fn,
        lastName: a.ln,
        role: 'ATHLETE',
        athlete: {
          create: {
            tier: a.tier,
            gamificationLevel: a.level,
            gamificationXp: a.xp,
            gamificationXpNext: a.xpNext,
            streakDays: a.streak,
            primarySportTypeId: a.sport.id,
          },
        },
      },
      include: { athlete: true },
    });
    athletes.push({ id: u.athlete!.id });
  }
  console.log('✅ Athletes: mara@example.com ... noor@example.com / athlete123');

  // ─── Coach-athlete relationships ──────────────────────────
  for (const athlete of athletes) {
    await prisma.coachAthlete.upsert({
      where: { coachId_athleteId: { coachId, athleteId: athlete.id } },
      update: {},
      create: { coachId, athleteId: athlete.id, status: CoachAthleteStatus.ACTIVE },
    });
  }
  console.log('✅ Coach-athlete relationships (7 ACTIVE)');

  // ─── Mara — detailed time series data ─────────────────────
  const maraId = athletes[0].id;
  const today = new Date('2026-04-27T00:00:00Z');

  // Clean previous series for idempotency
  await prisma.readiness.deleteMany({ where: { athleteId: maraId } });
  await prisma.bodyMetric.deleteMany({ where: { athleteId: maraId } });
  await prisma.trainingLoadSnapshot.deleteMany({ where: { athleteId: maraId } });

  // Readiness — 14 days (matching READINESS mock: overall 88 on latest)
  const readinessDays = [
    { sleep: 85, hrv: 78, soreness: 80, mood: 82, nutrition: 74 },
    { sleep: 88, hrv: 79, soreness: 82, mood: 84, nutrition: 76 },
    { sleep: 90, hrv: 80, soreness: 84, mood: 85, nutrition: 77 },
    { sleep: 87, hrv: 81, soreness: 83, mood: 86, nutrition: 75 },
    { sleep: 92, hrv: 82, soreness: 85, mood: 87, nutrition: 79 },
    { sleep: 88, hrv: 80, soreness: 81, mood: 85, nutrition: 76 },
    { sleep: 86, hrv: 79, soreness: 80, mood: 84, nutrition: 75 },
    { sleep: 89, hrv: 81, soreness: 83, mood: 86, nutrition: 77 },
    { sleep: 91, hrv: 82, soreness: 85, mood: 87, nutrition: 78 },
    { sleep: 88, hrv: 80, soreness: 82, mood: 85, nutrition: 76 },
    { sleep: 90, hrv: 81, soreness: 84, mood: 87, nutrition: 78 },
    { sleep: 92, hrv: 83, soreness: 86, mood: 88, nutrition: 80 },
    { sleep: 89, hrv: 82, soreness: 85, mood: 87, nutrition: 79 },
    { sleep: 90, hrv: 82, soreness: 85, mood: 88, nutrition: 78 },
  ];
  for (let i = 0; i < readinessDays.length; i++) {
    const r = readinessDays[i];
    const overall = Math.round((r.sleep + r.hrv + r.soreness + r.mood + r.nutrition) / 5);
    await prisma.readiness.create({
      data: { athleteId: maraId, recordedAt: addDays(today, -(13 - i)), overall, ...r },
    });
  }

  // Body metrics — 14 days (alineado con mock Athlete.tsx)
  const weights  = [65.2,65.0,64.9,64.8,64.7,64.7,64.6,64.5,64.5,64.4,64.3,64.3,64.2,64.2];
  const hrvs     = [68,  69,  71,  72,  73,  74,  75,  77,  78,  79,  80,  81,  82,  82 ];
  const sleeps   = [7.2, 8.1, 6.8, 7.5, 7.9, 8.4, 6.5, 7.8, 8.2, 7.1, 7.6, 8.0, 7.4, 7.7];
  const restHrs  = [52,  51,  52,  51,  50,  50,  49,  49,  49,  48,  48,  49,  48,  48 ];
  for (let i = 0; i < 14; i++) {
    await prisma.bodyMetric.create({
      data: {
        athleteId: maraId,
        recordedAt: addDays(today, -(13 - i)),
        weightKg:   weights[i],
        hrvMs:      hrvs[i],
        sleepHours: sleeps[i],
        restingHr:  restHrs[i],
      },
    });
  }

  // Training load — 6 weeks (from LOAD_HISTORY mock)
  const nowMonday = mondayOf(today);
  const loadWeeks = [
    { acute: 420, chronic: 510, acwr: 0.82, monotony: 1.1, strain: 462, trend: LoadTrend.FLAT },
    { acute: 510, chronic: 520, acwr: 0.98, monotony: 1.2, strain: 612, trend: LoadTrend.UP   },
    { acute: 580, chronic: 530, acwr: 1.09, monotony: 1.3, strain: 754, trend: LoadTrend.UP   },
    { acute: 640, chronic: 555, acwr: 1.15, monotony: 1.3, strain: 832, trend: LoadTrend.UP   },
    { acute: 710, chronic: 595, acwr: 1.19, monotony: 1.4, strain: 994, trend: LoadTrend.UP   },
    { acute: 682, chronic: 625, acwr: 1.09, monotony: 1.3, strain: 884, trend: LoadTrend.UP   },
  ];
  for (let i = 0; i < loadWeeks.length; i++) {
    const weekStart = addDays(nowMonday, -(5 - i) * 7);
    await prisma.trainingLoadSnapshot.create({
      data: { athleteId: maraId, weekStart, ...loadWeeks[i] },
    });
  }
  console.log('✅ Mara: 14 readiness + 14 body metrics + 6 load snapshots');

  // ─── Snapshots for other 6 athletes ──────────────────────
  const otherSnapshots = [
    { load: 540, acwr: 1.21, trend: LoadTrend.UP,   r: { overall: 74, sleep: 72, hrv: 70, soreness: 75, mood: 76, nutrition: 73 } },
    { load: 745, acwr: 0.98, trend: LoadTrend.FLAT, r: { overall: 91, sleep: 93, hrv: 90, soreness: 89, mood: 91, nutrition: 90 } },
    { load: 410, acwr: 1.35, trend: LoadTrend.DOWN, r: { overall: 62, sleep: 60, hrv: 58, soreness: 62, mood: 64, nutrition: 64 } },
    { load: 580, acwr: 1.14, trend: LoadTrend.UP,   r: { overall: 81, sleep: 82, hrv: 79, soreness: 80, mood: 83, nutrition: 81 } },
    { load: 698, acwr: 1.06, trend: LoadTrend.UP,   r: { overall: 79, sleep: 78, hrv: 76, soreness: 80, mood: 80, nutrition: 79 } },
    { load: 280, acwr: 0.62, trend: LoadTrend.DOWN, r: { overall: 54, sleep: 50, hrv: 48, soreness: 55, mood: 57, nutrition: 58 } },
  ];
  for (let i = 1; i < athletes.length; i++) {
    const { id: athleteId } = athletes[i];
    const snap = otherSnapshots[i - 1];
    const chronic = Math.round(snap.load / snap.acwr);

    await prisma.readiness.deleteMany({ where: { athleteId } });
    await prisma.readiness.create({ data: { athleteId, recordedAt: today, ...snap.r } });

    await prisma.trainingLoadSnapshot.deleteMany({ where: { athleteId } });
    await prisma.trainingLoadSnapshot.create({
      data: {
        athleteId, weekStart: nowMonday,
        acute: snap.load, chronic, acwr: snap.acwr,
        monotony: 1.2, strain: Math.round(snap.load * 1.2), trend: snap.trend,
      },
    });
  }
  console.log('✅ Snapshots for remaining 6 athletes');
  console.log('\n🎉 Seed complete!');
  console.log('   Coach:    elena@example.com / coach123');
  console.log('   Athletes: mara@example.com ... noor@example.com / athlete123');
  console.log('   Swagger:  http://localhost:3000/api/docs');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
