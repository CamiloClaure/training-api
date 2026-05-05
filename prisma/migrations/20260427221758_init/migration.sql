-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('COACH', 'ATHLETE', 'ADMIN');

-- CreateEnum
CREATE TYPE "CoachAthleteStatus" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "AthleteTier" AS ENUM ('PRO', 'AMATEUR');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SessionIntensity" AS ENUM ('EASY', 'MODERATE', 'HARD');

-- CreateEnum
CREATE TYPE "ActivitySource" AS ENUM ('GARMIN', 'STRAVA', 'MANUAL');

-- CreateEnum
CREATE TYPE "StreamType" AS ENUM ('HR', 'PACE', 'POWER', 'CADENCE', 'GPS', 'ALTITUDE');

-- CreateEnum
CREATE TYPE "WearableProvider" AS ENUM ('GARMIN', 'STRAVA', 'WAHOO');

-- CreateEnum
CREATE TYPE "LoadTrend" AS ENUM ('UP', 'DOWN', 'FLAT');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "role" "UserRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coaches" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "specialty" TEXT,
    "bio" TEXT,
    "max_athletes" INTEGER NOT NULL DEFAULT 20,

    CONSTRAINT "coaches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "athletes" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "birth_date" DATE,
    "weight_kg" DOUBLE PRECISION,
    "height_cm" DOUBLE PRECISION,
    "resting_hr" INTEGER,
    "max_hr" INTEGER,
    "sport_profiles" JSONB,
    "tier" "AthleteTier" NOT NULL DEFAULT 'AMATEUR',
    "gamification_level" INTEGER NOT NULL DEFAULT 1,
    "gamification_xp" INTEGER NOT NULL DEFAULT 0,
    "gamification_xp_next" INTEGER NOT NULL DEFAULT 1000,
    "streak_days" INTEGER NOT NULL DEFAULT 0,
    "primary_sport_type_id" INTEGER,

    CONSTRAINT "athletes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coach_athletes" (
    "id" SERIAL NOT NULL,
    "coach_id" INTEGER NOT NULL,
    "athlete_id" INTEGER NOT NULL,
    "status" "CoachAthleteStatus" NOT NULL DEFAULT 'PENDING',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coach_athletes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sport_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "metric_definitions" JSONB,

    CONSTRAINT "sport_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sport_type_id" INTEGER NOT NULL,

    CONSTRAINT "exercise_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" SERIAL NOT NULL,
    "category_id" INTEGER NOT NULL,
    "sport_type_id" INTEGER NOT NULL,
    "created_by" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "video_url" TEXT,
    "is_global" BOOLEAN NOT NULL DEFAULT false,
    "default_params" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_plans" (
    "id" SERIAL NOT NULL,
    "coach_id" INTEGER,
    "athlete_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "status" "PlanStatus" NOT NULL DEFAULT 'DRAFT',
    "goal" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_weeks" (
    "id" SERIAL NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "week_number" INTEGER NOT NULL,
    "focus" TEXT,
    "notes" TEXT,

    CONSTRAINT "plan_weeks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_sessions" (
    "id" SERIAL NOT NULL,
    "week_id" INTEGER NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "sport_type_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "estimated_duration_min" INTEGER,
    "intensity" "SessionIntensity" NOT NULL DEFAULT 'MODERATE',

    CONSTRAINT "plan_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_blocks" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "exercise_id" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "params" JSONB,
    "notes" TEXT,

    CONSTRAINT "session_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" SERIAL NOT NULL,
    "athlete_id" INTEGER NOT NULL,
    "session_id" INTEGER,
    "sport_type_id" INTEGER NOT NULL,
    "source" "ActivitySource" NOT NULL,
    "external_id" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL,
    "duration_sec" INTEGER NOT NULL,
    "distance_m" DOUBLE PRECISION,
    "calories" INTEGER,
    "avg_hr" DOUBLE PRECISION,
    "max_hr" DOUBLE PRECISION,
    "avg_pace" DOUBLE PRECISION,
    "avg_power" DOUBLE PRECISION,
    "summary_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_laps" (
    "id" SERIAL NOT NULL,
    "activity_id" INTEGER NOT NULL,
    "lap_number" INTEGER NOT NULL,
    "distance_m" DOUBLE PRECISION NOT NULL,
    "duration_sec" INTEGER NOT NULL,
    "avg_hr" DOUBLE PRECISION,
    "avg_pace" DOUBLE PRECISION,
    "avg_power" DOUBLE PRECISION,

    CONSTRAINT "activity_laps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_streams" (
    "id" SERIAL NOT NULL,
    "activity_id" INTEGER NOT NULL,
    "stream_type" "StreamType" NOT NULL,
    "data_points" JSONB NOT NULL,

    CONSTRAINT "activity_streams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wearable_connections" (
    "id" SERIAL NOT NULL,
    "athlete_id" INTEGER NOT NULL,
    "provider" "WearableProvider" NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT,
    "token_expires_at" TIMESTAMP(3),
    "last_sync_at" TIMESTAMP(3),

    CONSTRAINT "wearable_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "body_metrics" (
    "id" SERIAL NOT NULL,
    "athlete_id" INTEGER NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "weight_kg" DOUBLE PRECISION,
    "body_fat_pct" DOUBLE PRECISION,
    "resting_hr" INTEGER,
    "vo2max" DOUBLE PRECISION,
    "hrv_ms" DOUBLE PRECISION,
    "sleep_hours" DOUBLE PRECISION,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "body_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "readiness" (
    "id" SERIAL NOT NULL,
    "athlete_id" INTEGER NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "overall" INTEGER NOT NULL,
    "sleep" INTEGER NOT NULL,
    "hrv" INTEGER NOT NULL,
    "soreness" INTEGER NOT NULL,
    "mood" INTEGER NOT NULL,
    "nutrition" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "readiness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_load_snapshots" (
    "id" SERIAL NOT NULL,
    "athlete_id" INTEGER NOT NULL,
    "week_start" DATE NOT NULL,
    "acute" DOUBLE PRECISION NOT NULL,
    "chronic" DOUBLE PRECISION NOT NULL,
    "acwr" DOUBLE PRECISION NOT NULL,
    "monotony" DOUBLE PRECISION NOT NULL,
    "strain" DOUBLE PRECISION NOT NULL,
    "trend" "LoadTrend" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_load_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "coaches_user_id_key" ON "coaches"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "athletes_user_id_key" ON "athletes"("user_id");

-- CreateIndex
CREATE INDEX "coach_athletes_athlete_id_status_idx" ON "coach_athletes"("athlete_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "coach_athletes_coach_id_athlete_id_key" ON "coach_athletes"("coach_id", "athlete_id");

-- CreateIndex
CREATE UNIQUE INDEX "sport_types_name_key" ON "sport_types"("name");

-- CreateIndex
CREATE INDEX "training_plans_athlete_id_status_idx" ON "training_plans"("athlete_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "plan_weeks_plan_id_week_number_key" ON "plan_weeks"("plan_id", "week_number");

-- CreateIndex
CREATE INDEX "activities_athlete_id_started_at_idx" ON "activities"("athlete_id", "started_at");

-- CreateIndex
CREATE UNIQUE INDEX "activity_streams_activity_id_stream_type_key" ON "activity_streams"("activity_id", "stream_type");

-- CreateIndex
CREATE UNIQUE INDEX "wearable_connections_athlete_id_provider_key" ON "wearable_connections"("athlete_id", "provider");

-- CreateIndex
CREATE INDEX "body_metrics_athlete_id_recorded_at_idx" ON "body_metrics"("athlete_id", "recorded_at");

-- CreateIndex
CREATE INDEX "readiness_athlete_id_recorded_at_idx" ON "readiness"("athlete_id", "recorded_at");

-- CreateIndex
CREATE UNIQUE INDEX "training_load_snapshots_athlete_id_week_start_key" ON "training_load_snapshots"("athlete_id", "week_start");

-- AddForeignKey
ALTER TABLE "coaches" ADD CONSTRAINT "coaches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athletes" ADD CONSTRAINT "athletes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athletes" ADD CONSTRAINT "athletes_primary_sport_type_id_fkey" FOREIGN KEY ("primary_sport_type_id") REFERENCES "sport_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_athletes" ADD CONSTRAINT "coach_athletes_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_athletes" ADD CONSTRAINT "coach_athletes_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_categories" ADD CONSTRAINT "exercise_categories_sport_type_id_fkey" FOREIGN KEY ("sport_type_id") REFERENCES "sport_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "exercise_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_sport_type_id_fkey" FOREIGN KEY ("sport_type_id") REFERENCES "sport_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "coaches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_plans" ADD CONSTRAINT "training_plans_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_plans" ADD CONSTRAINT "training_plans_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_weeks" ADD CONSTRAINT "plan_weeks_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "training_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_sessions" ADD CONSTRAINT "plan_sessions_week_id_fkey" FOREIGN KEY ("week_id") REFERENCES "plan_weeks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_sessions" ADD CONSTRAINT "plan_sessions_sport_type_id_fkey" FOREIGN KEY ("sport_type_id") REFERENCES "sport_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_blocks" ADD CONSTRAINT "session_blocks_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "plan_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_blocks" ADD CONSTRAINT "session_blocks_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "plan_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_sport_type_id_fkey" FOREIGN KEY ("sport_type_id") REFERENCES "sport_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_laps" ADD CONSTRAINT "activity_laps_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_streams" ADD CONSTRAINT "activity_streams_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wearable_connections" ADD CONSTRAINT "wearable_connections_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "body_metrics" ADD CONSTRAINT "body_metrics_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "readiness" ADD CONSTRAINT "readiness_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_load_snapshots" ADD CONSTRAINT "training_load_snapshots_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
