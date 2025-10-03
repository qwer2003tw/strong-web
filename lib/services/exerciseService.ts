import { ExerciseAPI } from "@/lib/api/exerciseApi";
import type { ApiRequestOptions } from "@/types/api";
import { unwrapApiResponse } from "@/types/api";
import type { ExerciseExportView, ExerciseRow, ExerciseSummaryView } from "@/types/view";

/**
 * Retrieves the user's exercise library ordered alphabetically.
 */
export async function getUserExercises(
  userId: string,
  options?: ApiRequestOptions
): Promise<ExerciseSummaryView[]> {
  const response = await ExerciseAPI.list(userId, options);
  return unwrapApiResponse(response, "Failed to load exercises");
}

/**
 * Creates a new exercise entry for the user.
 */
export async function createExercise(
  userId: string,
  payload: Partial<ExerciseRow>,
  options?: ApiRequestOptions
): Promise<ExerciseRow> {
  const response = await ExerciseAPI.create(userId, payload, options);
  return unwrapApiResponse(response, "Failed to create exercise");
}

/**
 * Exports the complete exercise catalogue for the user.
 */
export async function exportUserExercises(
  userId: string,
  options?: ApiRequestOptions
): Promise<ExerciseExportView[]> {
  const response = await ExerciseAPI.exportAll(userId, options);
  return unwrapApiResponse(response, "Failed to export exercises");
}
