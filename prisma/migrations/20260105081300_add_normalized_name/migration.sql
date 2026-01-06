/*
  Warnings:

  - Added the required column `normalizedName` to the `Exercise` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Exercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "workoutId" TEXT NOT NULL,
    "difficulty" REAL,
    "notes" TEXT,
    CONSTRAINT "Exercise_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Exercise" ("difficulty", "id", "name", "notes", "workoutId") SELECT "difficulty", "id", "name", "notes", "workoutId" FROM "Exercise";
DROP TABLE "Exercise";
ALTER TABLE "new_Exercise" RENAME TO "Exercise";
CREATE UNIQUE INDEX "Exercise_normalizedName_key" ON "Exercise"("normalizedName");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
