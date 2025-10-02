"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { Database } from "@/lib/database.types";
import { validateWorkoutForm } from "@/lib/validation";
import { readCache, writeCache } from "@/lib/idb";
import { useSupabaseClient } from "@/components/features/providers/supabase-session-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type WorkoutEntryWithExercise = Database["public"]["Tables"]["workout_entries"]["Row"] & {
  exercises: Pick<Database["public"]["Tables"]["exercises"]["Row"], "id" | "name" | "muscle_group"> | null;
};

type WorkoutDetailData = Database["public"]["Tables"]["workouts"]["Row"] & {
  workout_entries: WorkoutEntryWithExercise[];
};

type Exercise = Pick<Database["public"]["Tables"]["exercises"]["Row"], "id" | "name" | "muscle_group">;

type WorkoutDetailProps = {
  workout: WorkoutDetailData;
  exercises: Exercise[];
};

export function WorkoutDetail({ workout, exercises }: WorkoutDetailProps) {
  const t = useTranslations();
  const router = useRouter();
  const supabase = useSupabaseClient();
  const [formState, setFormState] = useState({
    title: workout.title,
    scheduled_for: workout.scheduled_for ?? "",
    status: workout.status,
    notes: workout.notes ?? "",
  });
  const [entries, setEntries] = useState<WorkoutEntryWithExercise[]>(workout.workout_entries ?? []);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    writeCache(`workout:${workout.id}`, { ...workout, workout_entries: entries }).catch(() => undefined);
  }, [workout, entries]);

  useEffect(() => {
    if (!entries.length) {
      readCache<WorkoutDetailData>(`workout:${workout.id}`).then((cached) => {
        if (cached?.value) {
          setEntries(cached.value.workout_entries ?? []);
        }
      });
    }
  }, [entries.length, workout.id]);

  const exerciseOptions = useMemo(
    () =>
      exercises.map((exercise) => ({
        value: exercise.id,
        label: exercise.name,
      })),
    [exercises]
  );

  async function handleUpdate() {
    setError(null);
    setSuccess(null);

    const validation = validateWorkoutForm({
      title: formState.title,
      scheduled_for: formState.scheduled_for || undefined,
      notes: formState.notes || undefined,
    });

    if (!validation.valid) {
      setError(validation.message ?? "Invalid data");
      return;
    }

    const response = await fetch(`/api/workouts/${workout.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: formState.title,
        scheduled_for: formState.scheduled_for || null,
        notes: formState.notes || null,
        status: formState.status,
      }),
    });

    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      setError(body.error ?? "Unable to update workout");
      return;
    }

    setSuccess("Workout updated");
    router.refresh();
  }

  async function handleDelete() {
    setError(null);
    setSuccess(null);
    const response = await fetch(`/api/workouts/${workout.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      setError(body.error ?? "Unable to delete workout");
      return;
    }

    router.replace("/workouts");
    router.refresh();
  }

  async function handleEntrySubmit(formData: FormData) {
    setError(null);
    setSuccess(null);

    const payload = {
      exercise_id: String(formData.get("exercise_id") ?? ""),
      sets: Number(formData.get("sets") ?? "0"),
      reps: Number(formData.get("reps") ?? "0"),
      weight: formData.get("weight") ? Number(formData.get("weight")) : null,
      unit: formData.get("unit") ? String(formData.get("unit")) : null,
      notes: String(formData.get("entry_notes") ?? ""),
    };

    if (!payload.exercise_id) {
      setError("Exercise is required");
      return;
    }

    const { data, error: insertError } = await supabase
      .from("workout_entries")
      .insert({
        workout_id: workout.id,
        exercise_id: payload.exercise_id,
        sets: payload.sets,
        reps: payload.reps,
        weight: payload.weight,
        unit: payload.unit,
        notes: payload.notes || null,
        position: entries.length + 1,
      })
      .select("id, workout_id, exercise_id, position, sets, reps, weight, unit, notes, exercises(id, name, muscle_group)")
      .single();

    if (insertError || !data) {
      setError(insertError?.message ?? "Unable to add entry");
      return;
    }

    setEntries((previous) => [...previous, data as WorkoutEntryWithExercise]);
    setSuccess("Entry added");
    router.refresh();
  }

  async function handleEntryDelete(id: string) {
    const { error: deleteError } = await supabase
      .from("workout_entries")
      .delete()
      .eq("id", id)
      .eq("workout_id", workout.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setEntries((previous) => previous.filter((entry) => entry.id !== id));
    setSuccess("Entry removed");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>{workout.title}</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() =>
                startTransition(async () => {
                  await handleDelete();
                })
              }
              disabled={pending}
            >
              {t("workouts.delete")}
            </Button>
            <Button
              onClick={() =>
                startTransition(async () => {
                  await handleUpdate();
                })
              }
              disabled={pending}
            >
              {t("workouts.save")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? <Alert variant="error" message={error} /> : null}
          {success ? <Alert variant="success" message={success} /> : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="title">{t("workouts.name")}</Label>
              <Input
                id="title"
                value={formState.title}
                onChange={(event) => setFormState((state) => ({ ...state, title: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduled_for">{t("workouts.schedule")}</Label>
              <Input
                id="scheduled_for"
                type="date"
                value={formState.scheduled_for ?? ""}
                onChange={(event) => setFormState((state) => ({ ...state, scheduled_for: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">{t("workouts.status")}</Label>
              <Select
                id="status"
                value={formState.status}
                onChange={(event) => setFormState((state) => ({ ...state, status: event.target.value as typeof state.status }))}
              >
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">{t("workouts.notes")}</Label>
              <Textarea
                id="notes"
                rows={4}
                value={formState.notes ?? ""}
                onChange={(event) => setFormState((state) => ({ ...state, notes: event.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add exercise</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={(formData) =>
              startTransition(async () => {
                await handleEntrySubmit(formData);
              })
            }
            className="grid gap-4 md:grid-cols-2"
          >
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="exercise_id">Exercise</Label>
              <Select id="exercise_id" name="exercise_id" defaultValue="">
                <option value="" disabled>
                  Select an exercise
                </option>
                {exerciseOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sets">Sets</Label>
              <Input id="sets" name="sets" type="number" min={1} defaultValue={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reps">Reps</Label>
              <Input id="reps" name="reps" type="number" min={1} defaultValue={8} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight</Label>
              <Input id="weight" name="weight" type="number" min={0} step="0.5" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select id="unit" name="unit" defaultValue="metric">
                <option value="metric">Metric</option>
                <option value="imperial">Imperial</option>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="entry_notes">Notes</Label>
              <Textarea id="entry_notes" name="entry_notes" rows={3} />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={pending}>
                Add entry
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workout entries</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {entries.length === 0 ? (
            <p className="text-sm text-slate-500">No entries yet.</p>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                data-testid="workout-entry"
                className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-medium">{entry.exercises?.name ?? "Exercise"}</p>
                  <p className="text-sm text-slate-500">
                    {entry.sets} sets × {entry.reps ?? "-"} reps
                    {entry.weight ? ` • ${entry.weight} ${entry.unit ?? ""}` : ""}
                  </p>
                  {entry.notes ? <p className="text-sm text-slate-500">{entry.notes}</p> : null}
                </div>
                <Button
                  variant="outline"
                  onClick={() =>
                    startTransition(async () => {
                      await handleEntryDelete(entry.id);
                    })
                  }
                  disabled={pending}
                >
                  Remove
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
