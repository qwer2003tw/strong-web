import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { ExerciseLibrary } from "@/components/features/exercises/exercise-library";

export const revalidate = 0;

export default async function ExercisesPage() {
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
    return <ExerciseLibrary initialExercises={[]} />;
  }

  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('id, name, muscle_group, equipment, notes, updated_at')
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    return <ExerciseLibrary initialExercises={data ?? []} />;
  } catch (error) {
    console.error('Failed to load exercises', error);
    return <ExerciseLibrary initialExercises={[]} />;
  }
}
