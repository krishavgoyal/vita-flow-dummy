-- Note: This file is just for documentation purposes. These functions exist in the Supabase SQL Editor.

-- ================================
-- 1. CALCULATE WORKOUT CALORIES
-- ================================
CREATE OR REPLACE FUNCTION calculate_workout_calories(uid UUID)
RETURNS NUMERIC AS $$
DECLARE
  wt NUMERIC;
  aim_wt NUMERIC;
  deadline_date DATE;
  days_rem INT;
  act_level TEXT;
  diet_cals NUMERIC;
  tdee NUMERIC;
  workout_cals NUMERIC;
BEGIN

  SELECT weight_kg, aim_kg, deadline, activity_level, calories_req_per_day
  INTO wt, aim_wt, deadline_date, act_level, diet_cals
  FROM "USER_PROFILE"
  WHERE user_id = uid;

  IF wt IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  days_rem := GREATEST(1, deadline_date - CURRENT_DATE);

  tdee := wt * 24 *
    CASE
      WHEN act_level = 'Light' THEN 1.375
      WHEN act_level = 'Moderate' THEN 1.55
      WHEN act_level = 'Heavy' THEN 1.725
      ELSE 1.55
    END;

  workout_cals := ((wt - aim_wt) * 7700 / days_rem) - (tdee - diet_cals);

  RETURN GREATEST(workout_cals, 50);
END;
$$ LANGUAGE plpgsql;



-- ================================
-- 2. GENERATE WEEKLY WORKOUT PLAN
-- ================================
CREATE OR REPLACE FUNCTION generate_weekly_workout_plan(uid UUID, workout_cals NUMERIC)
RETURNS VOID AS $$
DECLARE
  d INT;
  m_focus TEXT;
  d_name TEXT;
  ex RECORD;
  plan JSONB[] := ARRAY[]::JSONB[];
  exercises JSONB;
  ex_count INT;
BEGIN

FOR d IN 1..7 LOOP

  CASE d
    WHEN 1 THEN m_focus := 'Upper Body'; d_name := 'Monday';
    WHEN 2 THEN m_focus := 'Legs'; d_name := 'Tuesday';
    WHEN 3 THEN m_focus := 'Core'; d_name := 'Wednesday';
    WHEN 4 THEN m_focus := 'Cardio'; d_name := 'Thursday';
    WHEN 5 THEN m_focus := 'Full Body'; d_name := 'Friday';
    WHEN 6 THEN m_focus := 'Flexibility / Recovery'; d_name := 'Saturday';
    WHEN 7 THEN m_focus := 'Rest'; d_name := 'Sunday';
  END CASE;

  -- Rest day
  IF m_focus = 'Rest' THEN
    plan := plan || jsonb_build_object(
      'day', d,
      'day_name', d_name,
      'focus', 'Rest',
      'exercises', '[]'::jsonb
    );
    CONTINUE;
  END IF;

  -- Decide number of exercises based on calorie target
  IF workout_cals < 200 THEN
    ex_count := 2;
  ELSIF workout_cals < 400 THEN
    ex_count := 3;
  ELSE
    ex_count := 4;
  END IF;

  exercises := '[]'::jsonb;

  FOR ex IN
    SELECT *
    FROM "EXERCISE_temp"
    WHERE muscle_group = m_focus
    ORDER BY MD5(exercise_id::TEXT || uid::TEXT || d::TEXT)
    LIMIT ex_count
  LOOP

    exercises := exercises || jsonb_build_object(
      'name', ex.exercise_name,
      'sets',
        CASE
          WHEN workout_cals < 200 THEN 2
          WHEN workout_cals < 400 THEN 3
          ELSE 4
        END,
      'reps',
        CASE
          WHEN m_focus = 'Cardio' THEN NULL
          ELSE 10 + (random()*10)::INT
        END,
      'duration_min',
        CASE
          WHEN m_focus = 'Cardio' THEN (workout_cals / 8)::INT
          ELSE NULL
        END
    );

  END LOOP;

  plan := plan || jsonb_build_object(
    'day', d,
    'day_name', d_name,
    'focus', m_focus,
    'exercises', exercises
  );

END LOOP;

UPDATE "USER_PROFILE"
SET workout_plan = to_jsonb(plan)
WHERE user_id = uid;

END;
$$ LANGUAGE plpgsql;



-- ================================
-- 3. FULL WORKOUT PIPELINE
-- ================================
CREATE OR REPLACE FUNCTION generate_full_workout_plan(uid UUID)
RETURNS VOID AS $$
DECLARE
  target NUMERIC;
BEGIN
  target := calculate_workout_calories(uid);
  PERFORM generate_weekly_workout_plan(uid, target);
END;
$$ LANGUAGE plpgsql;