-- AlterTable
ALTER TABLE "public"."Exam" ALTER COLUMN "createdBy" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "public"."Exam" ADD CONSTRAINT "Exam_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
