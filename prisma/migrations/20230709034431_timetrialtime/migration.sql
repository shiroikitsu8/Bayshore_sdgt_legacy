-- CreateTable
CREATE TABLE "timeTrialTime" (
    "id" SERIAL NOT NULL,
    "member" INTEGER NOT NULL,
    "course_id" INTEGER NOT NULL,
    "value" INTEGER NOT NULL,
    "store" TEXT NOT NULL,
    "car_id" INTEGER NOT NULL,
    "style_car_id" INTEGER NOT NULL,
    "play_dt" INTEGER NOT NULL,
    "section_time_1" INTEGER NOT NULL,
    "section_time_2" INTEGER NOT NULL,
    "section_time_3" INTEGER NOT NULL,
    "section_time_4" INTEGER NOT NULL,
    "mission" INTEGER NOT NULL,

    CONSTRAINT "timeTrialTime_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "timeTrialTime" ADD CONSTRAINT "timeTrialTime_member_fkey" FOREIGN KEY ("member") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
