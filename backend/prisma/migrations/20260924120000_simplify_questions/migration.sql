-- AlterTable
ALTER TABLE "questions" DROP COLUMN "difficulty",
DROP COLUMN "marks",
DROP COLUMN "tags";

-- DropEnum
DROP TYPE "Difficulty";

