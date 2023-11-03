-- CreateTable
CREATE TABLE "timetrialPoint" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "timetrial_event_id" INTEGER NOT NULL,
    "point" INTEGER NOT NULL,

    CONSTRAINT "timetrialPoint_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "timetrialPoint" ADD CONSTRAINT "timetrialPoint_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
