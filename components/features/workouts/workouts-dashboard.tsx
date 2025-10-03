"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { WorkoutSummaryView } from "@/types/view";
import { validateWorkoutForm } from "@/lib/validation";
import { readCache, writeCache } from "@/lib/idb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";

type Workout = WorkoutSummaryView;

const statusOptions: Workout["status"][] = [
  "draft",
  "scheduled",
  "completed",
];

interface WorkoutsDashboardProps {
  initialWorkouts: Workout[];
}

export function WorkoutsDashboard({ initialWorkouts }: WorkoutsDashboardProps) {
  const t = useTranslations();
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>(initialWorkouts);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    readCache<Workout[]>("workouts:list").then((cached) => {
      if (cached?.value?.length && !initialWorkouts.length) {
        setWorkouts(cached.value);
      }
    });
  }, [initialWorkouts.length]);

  useEffect(() => {
    writeCache("workouts:list", workouts).catch(() => undefined);
  }, [workouts]);

  const chartData = useMemo(
    () =>
      statusOptions.map((status) => ({
        status,
        count: workouts.filter((workout) => workout.status === status).length,
      })),
    [workouts]
  );

  async function refreshWorkouts() {
    const response = await fetch("/api/workouts");
    if (!response.ok) {
      throw new Error("Failed to refresh workouts");
    }
    const body = (await response.json()) as { data: Workout[] };
    setWorkouts(body.data ?? []);
    await writeCache("workouts:list", body.data ?? []);
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    const workoutPayload = {
      title: String(formData.get("title") ?? ""),
      scheduled_for: String(formData.get("scheduled_for") ?? ""),
      notes: String(formData.get("notes") ?? ""),
      status: String(formData.get("status") ?? "draft"),
    };

    const validation = validateWorkoutForm({
      title: workoutPayload.title,
      scheduled_for: workoutPayload.scheduled_for || undefined,
      notes: workoutPayload.notes || undefined,
    });

    if (!validation.valid) {
      setError(validation.message ?? "Invalid data");
      return;
    }

    const response = await fetch("/api/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...workoutPayload,
        scheduled_for: workoutPayload.scheduled_for || null,
        notes: workoutPayload.notes || null,
      }),
    });

    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      setError(body.error ?? "Unable to create workout");
      return;
    }

    const { data } = (await response.json()) as { data: Workout };
    setWorkouts((previous) => {
      const next = [data, ...previous];
      writeCache("workouts:list", next);
      return next;
    });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("workouts.create")}</CardTitle>
          <Button
            variant="ghost"
            type="button"
            onClick={() =>
              startTransition(async () => {
                try {
                  await refreshWorkouts();
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
            className="grid gap-4 sm:grid-cols-2"
          >
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="title">{t("workouts.name")}</Label>
              <Input id="title" name="title" placeholder="Pull day" required disabled={pending} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduled_for">{t("workouts.schedule")}</Label>
              <Input id="scheduled_for" name="scheduled_for" type="date" disabled={pending} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">{t("workouts.status")}</Label>
              <Select id="status" name="status" defaultValue="draft" disabled={pending}>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">{t("workouts.notes")}</Label>
              <Textarea id="notes" name="notes" rows={3} disabled={pending} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={pending} className="w-full sm:w-auto">
                {t("workouts.save")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status overview</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2">
        {workouts.length === 0 ? (
          <Card className="md:col-span-2">
            <CardContent>{t("workouts.empty")}</CardContent>
          </Card>
        ) : (
          workouts.map((workout) => (
            <Card key={workout.id}>
              <CardHeader className="flex-col items-start gap-1">
                <CardTitle>{workout.title}</CardTitle>
                <p className="text-xs text-slate-500">
                  {workout.scheduled_for
                    ? new Date(workout.scheduled_for).toLocaleDateString()
                    : "No schedule"}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-slate-600 line-clamp-3">{workout.notes ?? ""}</p>
                <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500">
                  <span>{workout.status}</span>
                  <span>{new Date(workout.updated_at ?? workout.created_at ?? Date.now()).toLocaleString()}</span>
                </div>
                <Link
                  href={`/workouts/${workout.id}`}
                  className="inline-flex w-full items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  {t("workouts.detail")}
                </Link>
              </CardContent>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
