import type { Database } from "./db";

export type WorkoutRow = Database["public"]["Tables"]["workouts"]["Row"];
export type WorkoutInsert = Database["public"]["Tables"]["workouts"]["Insert"];
export type WorkoutUpdate = Database["public"]["Tables"]["workouts"]["Update"];
export type ExerciseRow = Database["public"]["Tables"]["exercises"]["Row"];
export type ExerciseInsert = Database["public"]["Tables"]["exercises"]["Insert"];
export type ExerciseUpdate = Database["public"]["Tables"]["exercises"]["Update"];
export type WorkoutEntryRow = Database["public"]["Tables"]["workout_entries"]["Row"];
export type WorkoutEntryInsert = Database["public"]["Tables"]["workout_entries"]["Insert"];
export type WorkoutEntryUpdate = Database["public"]["Tables"]["workout_entries"]["Update"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type WorkoutSummaryView = Pick<
  WorkoutRow,
  "id" | "title" | "notes" | "scheduled_for" | "status" | "created_at" | "updated_at"
>;

export type ExerciseSummaryView = Pick<
  ExerciseRow,
  "id" | "name" | "muscle_group" | "equipment" | "notes" | "updated_at"
>;

export type WorkoutEntryWithExercise = WorkoutEntryRow & {
  exercises: Pick<ExerciseRow, "id" | "name" | "muscle_group"> | null;
};

export type WorkoutDetailView = WorkoutRow & {
  workout_entries: WorkoutEntryWithExercise[];
};

export type WorkoutDetailWithExercises = {
  workout: WorkoutDetailView;
  exercises: Pick<ExerciseRow, "id" | "name" | "muscle_group">[];
};

export type ProfileView = ProfileRow;

export type WorkoutExportView = WorkoutRow & {
  workout_entries: WorkoutEntryRow[];
};

export type ExerciseExportView = Pick<
  ExerciseRow,
  "id" | "name" | "muscle_group" | "equipment" | "notes" | "created_at" | "updated_at"
>;
