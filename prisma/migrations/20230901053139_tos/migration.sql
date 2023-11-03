-- CreateTable
CREATE TABLE "theoryData" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "play_count" INTEGER NOT NULL,
    "play_count_multi" INTEGER NOT NULL,
    "partner_id" INTEGER NOT NULL,
    "partner_progress" INTEGER NOT NULL,
    "partner_progress_score" INTEGER NOT NULL,
    "practice_start_rank" INTEGER NOT NULL,
    "general_flag" INTEGER NOT NULL,
    "vs_history" INTEGER NOT NULL,
    "vs_history_multi" INTEGER NOT NULL,
    "win_count" INTEGER NOT NULL,
    "win_count_multi" INTEGER NOT NULL,

    CONSTRAINT "theoryData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "theoryCourseData" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "course_id" INTEGER NOT NULL,
    "max_victory_grade" INTEGER NOT NULL,
    "run_count" INTEGER NOT NULL,
    "powerhouse_lv" INTEGER NOT NULL,
    "powerhouse_exp" INTEGER NOT NULL,
    "played_powerhouse_lv" INTEGER NOT NULL,
    "update_dt" INTEGER NOT NULL,

    CONSTRAINT "theoryCourseData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "theoryPartnerData" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "partner_id" INTEGER NOT NULL,
    "fellowship_lv" INTEGER NOT NULL,
    "fellowship_exp" INTEGER NOT NULL,

    CONSTRAINT "theoryPartnerData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "theoryRunningPramData" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "course_id" INTEGER NOT NULL,
    "attack" INTEGER NOT NULL,
    "defense" INTEGER NOT NULL,
    "safety" INTEGER NOT NULL,
    "runaway" INTEGER NOT NULL,
    "trick_flag" INTEGER NOT NULL,

    CONSTRAINT "theoryRunningPramData_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "theoryData" ADD CONSTRAINT "theoryData_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theoryCourseData" ADD CONSTRAINT "theoryCourseData_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theoryPartnerData" ADD CONSTRAINT "theoryPartnerData_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theoryRunningPramData" ADD CONSTRAINT "theoryRunningPramData_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
