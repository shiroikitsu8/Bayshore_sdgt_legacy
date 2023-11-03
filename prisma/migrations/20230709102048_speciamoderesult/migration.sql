-- CreateTable
CREATE TABLE "specialModeResult" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "style_car_id" INTEGER NOT NULL,
    "story_type" INTEGER NOT NULL,
    "vs_type" INTEGER NOT NULL,
    "play_difficulty" INTEGER NOT NULL,
    "cleared_difficulty" INTEGER NOT NULL,
    "weak_difficulty" INTEGER NOT NULL,
    "eval_id" INTEGER NOT NULL,
    "advantage" INTEGER NOT NULL,
    "sec1_advantage_avg" INTEGER NOT NULL,
    "sec2_advantage_avg" INTEGER NOT NULL,
    "sec3_advantage_avg" INTEGER,
    "sec4_advantage_avg" INTEGER,
    "nearby_advantage_rate" INTEGER NOT NULL,
    "win_flag" INTEGER NOT NULL,
    "result" INTEGER NOT NULL,
    "record" INTEGER NOT NULL,
    "course_id" INTEGER NOT NULL,
    "last_play_course_id" INTEGER NOT NULL,
    "course_day" INTEGER NOT NULL,
    "hint_display_flag" INTEGER NOT NULL,

    CONSTRAINT "specialModeResult_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "specialModeResult" ADD CONSTRAINT "specialModeResult_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
