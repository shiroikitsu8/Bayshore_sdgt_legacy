-- CreateTable
CREATE TABLE "timeTrialCourseSkill" (
    "id" SERIAL NOT NULL,
    "member" INTEGER NOT NULL,
    "course_id" INTEGER NOT NULL,
    "run_counts" INTEGER NOT NULL DEFAULT 0,
    "skill_level_exp" INTEGER NOT NULL,

    CONSTRAINT "timeTrialCourseSkill_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "timeTrialCourseSkill" ADD CONSTRAINT "timeTrialCourseSkill_member_fkey" FOREIGN KEY ("member") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
