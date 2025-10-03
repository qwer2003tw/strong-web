import { WorkoutAPI } from "@/lib/api/workoutApi";
import type { ApiRequestOptions } from "@/types/api";
import { unwrapApiResponse } from "@/types/api";
import type {
  WorkoutDetailView,
  WorkoutEntryInsert,
  WorkoutEntryWithExercise,
  WorkoutExportView,
  WorkoutRow,
  WorkoutSummaryView,
  WorkoutUpdate,
} from "@/types/view";

/**
 * Fetches workouts for the specified user ordered by their scheduled date.
 */
export async function getUserWorkouts(
  userId: string,
  options?: ApiRequestOptions
): Promise<WorkoutSummaryView[]> {
  const response = await WorkoutAPI.list(userId, options);
  return unwrapApiResponse(response, "Failed to load workouts");
}

/**
 * Resolves a single workout with all nested entries and exercise references.
 */
export async function getWorkoutDetail(
  userId: string,
  workoutId: string,
  options?: ApiRequestOptions
): Promise<WorkoutDetailView> {
  const response = await WorkoutAPI.fetchById(userId, workoutId, options);
  return unwrapApiResponse(response, "Failed to load workout detail");
}

/**
 * Creates a new workout for the given user.
 */
export async function createWorkout(
  userId: string,
  payload: Partial<WorkoutRow>,
  options?: ApiRequestOptions
): Promise<WorkoutRow> {
  const response = await WorkoutAPI.create(userId, payload, options);
  return unwrapApiResponse(response, "Failed to create workout");
}

/**
 * Updates an existing workout with the provided attributes.
 */
export async function updateWorkout(
  userId: string,
  workoutId: string,
  payload: WorkoutUpdate,
  options?: ApiRequestOptions
): Promise<WorkoutRow> {
  const response = await WorkoutAPI.update(userId, workoutId, payload, options);
  return unwrapApiResponse(response, "Failed to update workout");
}

/**
 * Deletes a workout owned by the user.
 */
export async function deleteWorkout(
  userId: string,
  workoutId: string,
  options?: ApiRequestOptions
): Promise<void> {
  const response = await WorkoutAPI.remove(userId, workoutId, options);
  if (response.error) {
    throw new Error(response.error.message);
  }
}

/**
 * Adds a workout entry to the given workout and returns the created entity.
 */
export async function addWorkoutEntry(
  workoutId: string,
  payload: Omit<WorkoutEntryInsert, "workout_id">,
  options?: ApiRequestOptions
): Promise<WorkoutEntryWithExercise> {
  const response = await WorkoutAPI.addEntry(workoutId, { ...payload, workout_id: workoutId }, options);
  return unwrapApiResponse(response, "Failed to create workout entry");
}

/**
 * Removes a workout entry by its identifier.
 */
export async function removeWorkoutEntry(
  workoutId: string,
  entryId: string,
  options?: ApiRequestOptions
): Promise<void> {
  const response = await WorkoutAPI.removeEntry(workoutId, entryId, options);
  if (response.error) {
    throw new Error(response.error.message);
  }
}

/**
 * Exports all workouts with their entries for the user.
 */
export async function exportUserWorkouts(
  userId: string,
  options?: ApiRequestOptions
): Promise<WorkoutExportView[]> {
  const response = await WorkoutAPI.exportAll(userId, options);
  return unwrapApiResponse(response, "Failed to export workouts");
}
