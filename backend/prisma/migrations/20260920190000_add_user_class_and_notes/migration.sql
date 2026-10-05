-- AlterTable
ALTER TABLE "users" ADD COLUMN     "class_id" TEXT;

-- CreateIndex
CREATE INDEX "users_class_id_idx" ON "users"("class_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

