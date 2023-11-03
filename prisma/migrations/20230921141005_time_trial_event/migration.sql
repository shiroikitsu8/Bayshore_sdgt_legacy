-- CreateTable
CREATE TABLE "timetrialEvent" (
    "id" SERIAL NOT NULL,
    "timetrial_event_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "start_dt" INTEGER NOT NULL,
    "end_dt" INTEGER NOT NULL,
    "course_id" INTEGER NOT NULL,
    "point" INTEGER[],

    CONSTRAINT "timetrialEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timetrialRewardEvent" (
    "id" SERIAL NOT NULL,
    "timetrial_event_id" INTEGER NOT NULL,
    "reward_category_a" INTEGER NOT NULL,
    "reward_type_a" INTEGER NOT NULL,
    "reward_category_b" INTEGER NOT NULL,
    "reward_type_b" INTEGER NOT NULL,

    CONSTRAINT "timetrialRewardEvent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "timetrialRewardEvent" ADD CONSTRAINT "timetrialRewardEvent_timetrial_event_id_fkey" FOREIGN KEY ("timetrial_event_id") REFERENCES "timetrialEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
