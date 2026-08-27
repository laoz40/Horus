ALTER TABLE "workout_sets" ADD COLUMN "is_weight_pr" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "workout_sets" ADD COLUMN "is_volume_pr" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "workout_sets" ADD COLUMN "is_bodyweight_reps_pr" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "workouts" ADD COLUMN "total_pr_sets" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "workout_sets" ADD CONSTRAINT "workout_sets_pr_requires_completion" CHECK (not ("workout_sets"."is_weight_pr" or "workout_sets"."is_volume_pr" or "workout_sets"."is_bodyweight_reps_pr") or "workout_sets"."completed");--> statement-breakpoint
ALTER TABLE "workout_sets" ADD CONSTRAINT "workout_sets_pr_matches_weight_type" CHECK (not "workout_sets"."is_bodyweight_reps_pr" or ("workout_sets"."weight" = 0 and not "workout_sets"."is_weight_pr" and not "workout_sets"."is_volume_pr"));--> statement-breakpoint
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_total_pr_sets_nonnegative" CHECK ("workouts"."total_pr_sets" >= 0);