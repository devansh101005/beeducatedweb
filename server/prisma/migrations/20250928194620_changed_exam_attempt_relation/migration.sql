-- DropForeignKey
ALTER TABLE "public"."ExamAttempt" DROP CONSTRAINT "ExamAttempt_studentId_fkey";

-- AddForeignKey
ALTER TABLE "public"."ExamAttempt" ADD CONSTRAINT "ExamAttempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
