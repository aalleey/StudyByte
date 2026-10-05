-- DropForeignKey
ALTER TABLE "bookmarks" DROP CONSTRAINT "bookmarks_question_id_fkey";

-- DropForeignKey
ALTER TABLE "bookmarks" DROP CONSTRAINT "bookmarks_student_id_fkey";

-- DropForeignKey
ALTER TABLE "lessons" DROP CONSTRAINT "lessons_chapter_id_fkey";

-- DropForeignKey
ALTER TABLE "lessons" DROP CONSTRAINT "lessons_created_by_id_fkey";

-- DropForeignKey
ALTER TABLE "mistakes" DROP CONSTRAINT "mistakes_last_attempt_id_fkey";

-- DropForeignKey
ALTER TABLE "mistakes" DROP CONSTRAINT "mistakes_question_id_fkey";

-- DropForeignKey
ALTER TABLE "mistakes" DROP CONSTRAINT "mistakes_student_id_fkey";

-- DropForeignKey
ALTER TABLE "past_papers" DROP CONSTRAINT "past_papers_class_id_fkey";

-- DropForeignKey
ALTER TABLE "past_papers" DROP CONSTRAINT "past_papers_subject_id_fkey";

-- DropForeignKey
ALTER TABLE "quiz_answers" DROP CONSTRAINT "quiz_answers_attempt_id_fkey";

-- DropForeignKey
ALTER TABLE "quiz_answers" DROP CONSTRAINT "quiz_answers_question_id_fkey";

-- DropForeignKey
ALTER TABLE "quiz_answers" DROP CONSTRAINT "quiz_answers_selected_option_id_fkey";

-- DropForeignKey
ALTER TABLE "quiz_attempts" DROP CONSTRAINT "quiz_attempts_quiz_id_fkey";

-- DropForeignKey
ALTER TABLE "quiz_attempts" DROP CONSTRAINT "quiz_attempts_student_id_fkey";

-- DropForeignKey
ALTER TABLE "quiz_questions" DROP CONSTRAINT "quiz_questions_question_id_fkey";

-- DropForeignKey
ALTER TABLE "quiz_questions" DROP CONSTRAINT "quiz_questions_quiz_id_fkey";

-- DropForeignKey
ALTER TABLE "quizzes" DROP CONSTRAINT "quizzes_chapter_id_fkey";

-- DropForeignKey
ALTER TABLE "quizzes" DROP CONSTRAINT "quizzes_created_by_id_fkey";

-- DropForeignKey
ALTER TABLE "student_progress" DROP CONSTRAINT "student_progress_lesson_id_fkey";

-- DropForeignKey
ALTER TABLE "student_progress" DROP CONSTRAINT "student_progress_student_id_fkey";

-- DropForeignKey
ALTER TABLE "study_materials" DROP CONSTRAINT "study_materials_chapter_id_fkey";

-- DropForeignKey
ALTER TABLE "study_materials" DROP CONSTRAINT "study_materials_created_by_id_fkey";

-- DropForeignKey
ALTER TABLE "study_materials" DROP CONSTRAINT "study_materials_subject_id_fkey";

-- DropTable
DROP TABLE "bookmarks";

-- DropTable
DROP TABLE "lessons";

-- DropTable
DROP TABLE "mistakes";

-- DropTable
DROP TABLE "past_papers";

-- DropTable
DROP TABLE "quiz_answers";

-- DropTable
DROP TABLE "quiz_attempts";

-- DropTable
DROP TABLE "quiz_questions";

-- DropTable
DROP TABLE "quizzes";

-- DropTable
DROP TABLE "student_progress";

-- DropTable
DROP TABLE "study_materials";

-- DropEnum
DROP TYPE "MaterialType";

-- DropEnum
DROP TYPE "ProgressStatus";

-- DropEnum
DROP TYPE "QuizAttemptStatus";

