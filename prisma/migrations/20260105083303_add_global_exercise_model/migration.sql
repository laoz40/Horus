/*
  Warnings:

  - You are about to drop the column `name` on the `Exercise` table. All the data in the column will be lost.
  - You are about to drop the column `normalizedName` on the `Exercise` table. All the data in the column will be lost.
  - Added the required column `globalExerciseId` to the `Exercise` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "GlobalExercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Exercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workoutId" TEXT NOT NULL,
    "globalExerciseId" TEXT NOT NULL,
    "difficulty" REAL,
    "notes" TEXT,
    CONSTRAINT "Exercise_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Exercise_globalExerciseId_fkey" FOREIGN KEY ("globalExerciseId") REFERENCES "GlobalExercise" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Exercise" ("difficulty", "id", "notes", "workoutId") SELECT "difficulty", "id", "notes", "workoutId" FROM "Exercise";
DROP TABLE "Exercise";
ALTER TABLE "new_Exercise" RENAME TO "Exercise";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "GlobalExercise_normalizedName_key" ON "GlobalExercise"("normalizedName");
