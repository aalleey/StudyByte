-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "QuizAttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "MaterialType" AS ENUM ('NOTE', 'PDF', 'IMAGE', 'VIDEO', 'DEFINITION');

-- AlterEnum
BEGIN;
CREATE TYPE "QuestionType_new" AS ENUM ('MCQ', 'TRUE_FALSE', 'FILL_BLANK', 'SHORT_ANSWER', 'LONG_ANSWER');
ALTER TABLE "questions" ALTER COLUMN "type" TYPE "QuestionType_new" USING ("type"::text::"QuestionType_new");
ALTER TYPE "QuestionType" RENAME TO "QuestionType_old";
ALTER TYPE "QuestionType_new" RENAME TO "QuestionType";
DROP TYPE "QuestionType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "bookmarks" DROP CONSTRAINT "bookmarks_lesson_id_fkey";

-- DropForeignKey
ALTER TABLE "questions" DROP CONSTRAINT "questions_lesson_id_fkey";

-- DropIndex
DROP INDEX "bookmarks_lesson_id_idx";

-- DropIndex
DROP INDEX "bookmarks_student_id_lesson_id_key";

-- DropIndex
DROP INDEX "questions_lesson_id_idx";

-- AlterTable
ALTER TABLE "bookmarks" DROP COLUMN "lesson_id",
ADD COLUMN     "question_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "mistakes" ADD COLUMN     "consecutive_correct_count" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "past_papers" DROP COLUMN "file_url",
ADD COLUMN     "allow_download" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "board" TEXT NOT NULL,
ADD COLUMN     "class_id" TEXT NOT NULL,
ADD COLUMN     "file_name" TEXT NOT NULL,
ADD COLUMN     "file_size_bytes" INTEGER NOT NULL,
ADD COLUMN     "is_published" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mime_type" TEXT NOT NULL,
ADD COLUMN     "paper_type" TEXT NOT NULL,
ADD COLUMN     "storage_key" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "questions" DROP COLUMN "lesson_id",
ADD COLUMN     "correct_answer_text" TEXT,
ADD COLUMN     "created_by_id" TEXT NOT NULL,
ADD COLUMN     "difficulty" "Difficulty" NOT NULL,
ADD COLUMN     "is_published" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "marks" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "topic_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "quiz_answers" ADD COLUMN     "answer_text" TEXT;

-- AlterTable
ALTER TABLE "quiz_attempts" ADD COLUMN     "expires_at" TIMESTAMP(3),
ADD COLUMN     "status" "QuizAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS';

-- AlterTable
ALTER TABLE "quizzes" ADD COLUMN     "created_by_id" TEXT NOT NULL,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "difficulty" "Difficulty" NOT NULL,
ADD COLUMN     "is_published" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passing_marks" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_marks" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "study_materials" DROP COLUMN "file_url",
DROP COLUMN "type",
ADD COLUMN     "chapter_id" TEXT,
ADD COLUMN     "content" TEXT,
ADD COLUMN     "created_by_id" TEXT NOT NULL,
ADD COLUMN     "file_name" TEXT,
ADD COLUMN     "file_size_bytes" INTEGER,
ADD COLUMN     "is_published" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "material_type" "MaterialType" NOT NULL,
ADD COLUMN     "mime_type" TEXT,
ADD COLUMN     "storage_key" TEXT,
ADD COLUMN     "topic_id" TEXT;

-- CreateIndex
CREATE INDEX "bookmarks_question_id_idx" ON "bookmarks"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "bookmarks_student_id_question_id_key" ON "bookmarks"("student_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "mistakes_student_id_question_id_key" ON "mistakes"("student_id", "question_id");

-- CreateIndex
CREATE INDEX "past_papers_class_id_idx" ON "past_papers"("class_id");

-- CreateIndex
CREATE INDEX "questions_topic_id_idx" ON "questions"("topic_id");

-- CreateIndex
CREATE INDEX "questions_created_by_id_idx" ON "questions"("created_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_answers_attempt_id_question_id_key" ON "quiz_answers"("attempt_id", "question_id");

-- CreateIndex
CREATE INDEX "quizzes_created_by_id_idx" ON "quizzes"("created_by_id");

-- CreateIndex
CREATE INDEX "study_materials_chapter_id_idx" ON "study_materials"("chapter_id");

-- CreateIndex
CREATE INDEX "study_materials_topic_id_idx" ON "study_materials"("topic_id");

-- CreateIndex
CREATE INDEX "study_materials_created_by_id_idx" ON "study_materials"("created_by_id");

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "past_papers" ADD CONSTRAINT "past_papers_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_materials" ADD CONSTRAINT "study_materials_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_materials" ADD CONSTRAINT "study_materials_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_materials" ADD CONSTRAINT "study_materials_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

