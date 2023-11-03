-- AlterTable
ALTER TABLE "car" ALTER COLUMN "pickup_seq" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "modeRank" ALTER COLUMN "story_rank_reward_dist" SET DEFAULT 1,
ALTER COLUMN "time_trial_rank_reward_dist" SET DEFAULT 1,
ALTER COLUMN "online_battle_rank_reward_dist" SET DEFAULT 1,
ALTER COLUMN "store_battle_rank_reward_dist" SET DEFAULT 1,
ALTER COLUMN "theory_rank_reward_dist" SET DEFAULT 1;
