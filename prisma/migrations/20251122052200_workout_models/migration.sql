-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "workoutId" TEXT NOT NULL,
    CONSTRAINT "Exercise_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Set" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weight" REAL NOT NULL,
    "reps" INTEGER NOT NULL,
    "exerciseId" TEXT NOT NULL,
    CONSTRAINT "Set_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
