"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import type { Database } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";

type Exercise = Database["public"]["Tables"]["exercises"]["Row"];

interface ExerciseLibraryProps {
  initialExercises: Exercise[];
}

export function ExerciseLibrary({ initialExercises }: ExerciseLibraryProps) {
  const router = useRouter();
  const t = useTranslations();
  const [exercises, setExercises] = useState(initialExercises);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function refreshExercises() {
    const response = await fetch("/api/exercises");
    if (!response.ok) {
      throw new Error("Failed to load exercises");
    }
    const body = (await response.json()) as { data: Exercise[] };
    setExercises(body.data ?? []);
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    const payload = {
      name: String(formData.get("name") ?? ""),
      muscle_group: String(formData.get("muscle_group") ?? ""),
      equipment: String(formData.get("equipment") ?? ""),
      notes: String(formData.get("notes") ?? ""),
    };

    if (!payload.name.trim()) {
      setError("Name is required");
      return;
    }

    const response = await fetch("/api/exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        muscle_group: payload.muscle_group || null,
        equipment: payload.equipment || null,
        notes: payload.notes || null,
      }),
    });

    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      setError(body.error ?? "Unable to create exercise");
      return;
    }

    const { data } = (await response.json()) as { data: Exercise };
    setExercises((previous) => [data, ...previous]);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>{t("exercises.create")}</CardTitle>
          <Button
            variant="ghost"
            onClick={() =>
              startTransition(async () => {
                try {
                  await refreshExercises();
                } catch (refreshError) {
                  setError(refreshError instanceof Error ? refreshError.message : String(refreshError));
                }
              })
            }
            disabled={pending}
          >
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {error ? <Alert variant="error" message={error} /> : null}
          <form
            action={(formData) =>
              startTransition(async () => {
                await handleSubmit(formData);
              })
            }
            className="grid gap-4 md:grid-cols-2"
          >
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="Deadlift" required disabled={pending} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="muscle_group">Muscle group</Label>
              <Input id="muscle_group" name="muscle_group" placeholder="Back" disabled={pending} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="equipment">Equipment</Label>
              <Input id="equipment" name="equipment" placeholder="Barbell" disabled={pending} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" rows={3} disabled={pending} />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={pending}>
                Save exercise
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2">
        {exercises.length === 0 ? (
          <Card className="md:col-span-2">
            <CardContent>{t("exercises.empty")}</CardContent>
          </Card>
        ) : (
          exercises.map((exercise) => (
            <Card key={exercise.id}>
              <CardHeader>
                <CardTitle>{exercise.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-600">
                {exercise.muscle_group ? <p>Muscle group: {exercise.muscle_group}</p> : null}
                {exercise.equipment ? <p>Equipment: {exercise.equipment}</p> : null}
                {exercise.notes ? <p>{exercise.notes}</p> : null}
                <p className="text-xs text-slate-400">
                  Updated {exercise.updated_at ? new Date(exercise.updated_at).toLocaleString() : "recently"}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
