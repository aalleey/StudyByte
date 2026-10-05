-- DropForeignKey
ALTER TABLE "lessons" DROP CONSTRAINT "lessons_topic_id_fkey";

-- DropForeignKey
ALTER TABLE "questions" DROP CONSTRAINT "questions_topic_id_fkey";

-- DropForeignKey
ALTER TABLE "quizzes" DROP CONSTRAINT "quizzes_topic_id_fkey";

-- DropForeignKey
ALTER TABLE "study_materials" DROP CONSTRAINT "study_materials_topic_id_fkey";

-- DropForeignKey
ALTER TABLE "topics" DROP CONSTRAINT "topics_chapter_id_fkey";

-- DropForeignKey
ALTER TABLE "topics" DROP CONSTRAINT "topics_created_by_id_fkey";

-- DropIndex
DROP INDEX "lessons_topic_id_slug_key";

-- DropIndex
DROP INDEX "questions_topic_id_idx";

-- DropIndex
DROP INDEX "quizzes_topic_id_idx";

-- DropIndex
DROP INDEX "study_materials_topic_id_idx";

-- AlterTable
ALTER TABLE "lessons" DROP COLUMN "topic_id",
ADD COLUMN     "chapter_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "questions" DROP COLUMN "topic_id",
ADD COLUMN     "chapter_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "quizzes" DROP COLUMN "topic_id",
ADD COLUMN     "chapter_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "study_materials" DROP COLUMN "topic_id";

-- DropTable
DROP TABLE "topics";

-- CreateIndex
CREATE UNIQUE INDEX "lessons_chapter_id_slug_key" ON "lessons"("chapter_id", "slug");

-- CreateIndex
CREATE INDEX "questions_chapter_id_idx" ON "questions"("chapter_id");

-- CreateIndex
CREATE INDEX "quizzes_chapter_id_idx" ON "quizzes"("chapter_id");

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

