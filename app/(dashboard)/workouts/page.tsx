import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { WorkoutsDashboard } from "@/components/features/workouts/workouts-dashboard";

export const revalidate = 0;

export default async function WorkoutsPage() {
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
    return <WorkoutsDashboard initialWorkouts={[]} />;
  }

  try {
    const { data, error } = await supabase
      .from('workouts')
      .select('id, title, notes, scheduled_for, status, created_at, updated_at')
      .eq('user_id', userId)
      .order('scheduled_for', { ascending: true, nullsFirst: true });

    if (error) {
      throw error;
    }

    return <WorkoutsDashboard initialWorkouts={data ?? []} />;
  } catch (error) {
    console.error('Failed to load workouts', error);
    return <WorkoutsDashboard initialWorkouts={[]} />;
  }
}
