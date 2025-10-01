import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { WorkoutDetail } from "@/components/features/workouts/workout-detail";

export const revalidate = 0;

interface WorkoutPageParams {
  params: {
    id: string;
  };
}

export default async function WorkoutDetailPage({ params }: WorkoutPageParams) {
  const supabase = await createServerSupabaseClient();
  let userId: string | null = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (!error) {
      userId = data.user?.id ?? null;
    }
  } catch (error) {
    console.error('Failed to resolve Supabase user', error);
  }

  if (!userId) {
    notFound();
  }

  try {
    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .select(
        'id, title, notes, scheduled_for, status, created_at, updated_at, workout_entries(id, exercise_id, position, sets, reps, weight, unit, notes, exercises(id, name, muscle_group))'
      )
      .eq('user_id', userId)
      .eq('id', params.id)
      .maybeSingle();

    if (workoutError || !workout) {
      throw workoutError ?? new Error('Workout not found');
    }

    const { data: exercises, error: exerciseError } = await supabase
      .from('exercises')
      .select('id, name, muscle_group')
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (exerciseError) {
      throw exerciseError;
    }

    return <WorkoutDetail workout={workout} exercises={exercises ?? []} />;
  } catch (error) {
    console.error('Failed to load workout detail', error);
    notFound();
  }
}
