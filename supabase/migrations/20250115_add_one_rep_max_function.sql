-- ============================================
-- One Rep Max analytics helper
-- ============================================

CREATE OR REPLACE FUNCTION public.get_one_rep_max(
  exercise_ids uuid[] DEFAULT NULL,
  from_date date DEFAULT NULL,
  to_date date DEFAULT NULL,
  method text DEFAULT 'epley'
)
RETURNS TABLE (
  exercise_id uuid,
  exercise_name text,
  performed_on date,
  estimated_1rm numeric,
  reps integer,
  weight numeric,
  unit text,
  source_entry_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  method_safe text := lower(coalesce(method, 'epley'));
BEGIN
  IF method_safe NOT IN ('epley', 'brzycki') THEN
    RAISE EXCEPTION USING MESSAGE = 'Unsupported 1RM method', ERRCODE = '22023';
  END IF;

  RETURN QUERY
  WITH filtered_entries AS (
    SELECT
      we.id AS entry_id,
      we.exercise_id,
      e.name AS exercise_name,
      COALESCE((w.scheduled_for AT TIME ZONE 'UTC')::date, (we.created_at AT TIME ZONE 'UTC')::date) AS performed_on,
      we.reps,
      we.weight,
      we.unit
    FROM workout_entries we
    JOIN workouts w ON w.id = we.workout_id
    JOIN exercises e ON e.id = we.exercise_id
    WHERE w.user_id = auth.uid()
      AND we.weight IS NOT NULL
      AND we.weight > 0
      AND we.reps IS NOT NULL
      AND we.reps > 0
      AND (method_safe <> 'brzycki' OR we.reps < 37)
      AND (exercise_ids IS NULL OR we.exercise_id = ANY(exercise_ids))
      AND (from_date IS NULL OR COALESCE((w.scheduled_for AT TIME ZONE 'UTC')::date, (we.created_at AT TIME ZONE 'UTC')::date) >= from_date)
      AND (to_date IS NULL OR COALESCE((w.scheduled_for AT TIME ZONE 'UTC')::date, (we.created_at AT TIME ZONE 'UTC')::date) <= to_date)
  ),
  ranked_entries AS (
    SELECT
      entry_id,
      exercise_id,
      exercise_name,
      performed_on,
      reps,
      weight,
      unit,
      CASE
        WHEN method_safe = 'brzycki' THEN weight * (36::numeric / (37 - reps))
        ELSE weight * (1 + reps::numeric / 30)
      END AS estimated_1rm,
      ROW_NUMBER() OVER (
        PARTITION BY exercise_id, performed_on
        ORDER BY
          CASE
            WHEN method_safe = 'brzycki' THEN weight * (36::numeric / (37 - reps))
            ELSE weight * (1 + reps::numeric / 30)
          END DESC
      ) AS rank
    FROM filtered_entries
  )
  SELECT
    exercise_id,
    exercise_name,
    performed_on,
    estimated_1rm,
    reps,
    weight,
    unit,
    entry_id AS source_entry_id
  FROM ranked_entries
  WHERE rank = 1
  ORDER BY performed_on ASC, exercise_name ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_one_rep_max(uuid[], date, date, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_one_rep_max(uuid[], date, date, text) TO anon;
