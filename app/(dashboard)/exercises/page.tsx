import { ExerciseLibrary } from "@/components/features/exercises/exercise-library";
import { getCurrentUser } from "@/lib/services/authService";
import { getUserExercises } from "@/lib/services/exerciseService";

export const revalidate = 0;

export default async function ExercisesPage() {
  const user = await getCurrentUser();
  if (!user) {
    return <ExerciseLibrary initialExercises={[]} />;
  }

  try {
    const exercises = await getUserExercises(user.id);
    return <ExerciseLibrary initialExercises={exercises} />;
  } catch (error) {
    console.error("Failed to load exercises", error);
    return <ExerciseLibrary initialExercises={[]} />;
  }
}
