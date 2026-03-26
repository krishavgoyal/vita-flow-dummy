-- Note: This file is just for documentation purposes. These functions exist in the Supabase SQL Editor.

CREATE OR REPLACE FUNCTION calculate_calories(uid UUID)
RETURNS VOID AS $$
DECLARE
    wt NUMERIC;
    ht NUMERIC;
    age_val INT;
    gender_val TEXT;
    activity TEXT;
    goal_wt NUMERIC;
    
    days INT;

    bmr NUMERIC;
    tdee NUMERIC;
    final_cal NUMERIC;
BEGIN
    -- Fetch user data
    SELECT weight_kg, height_cm, age, gender, activity_level, aim_kg,
           GREATEST(1, deadline - CURRENT_DATE)
    INTO wt, ht, age_val, gender_val, activity, goal_wt, days
    FROM "USER_PROFILE"
    WHERE user_id = uid;

    -- BMR calculation
    IF gender_val = 'Male' THEN
        bmr := 10 * wt + 6.25 * ht - 5 * age_val + 5;
    ELSE
        bmr := 10 * wt + 6.25 * ht - 5 * age_val - 161;
    END IF;

    -- Activity multiplier
    IF activity = 'Light' THEN
        tdee := bmr * 1.375;
    ELSIF activity = 'Moderate' THEN
        tdee := bmr * 1.55;
    ELSE
        tdee := bmr * 1.725;
    END IF;

    -- Goal adjustment
    final_cal := tdee + ((goal_wt - wt) * 7700) / days;

    -- Clamp extreme deficits/surplus
    IF final_cal < tdee - 500 THEN
        final_cal := tdee - 500;
    ELSIF final_cal > tdee + 500 THEN
        final_cal := tdee + 500;
    END IF;

    -- Safety minimum calories
    IF gender_val = 'Male' THEN
        final_cal := GREATEST(final_cal, 1500);
    ELSE
        final_cal := GREATEST(final_cal, 1200);
    END IF;

    -- Store result
    UPDATE "USER_PROFILE"
    SET calories_req_per_day = final_cal
    WHERE user_id = uid;

END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_weekly_plan(uid UUID)
RETURNS VOID AS $$
DECLARE
    user_allergies TEXT[];
    pref TEXT;
    daily_cal NUMERIC;

    breakfast_cal NUMERIC;
    lunch_cal NUMERIC;
    dinner_cal NUMERIC;
    base_kcal NUMERIC;
    base_kcal2 NUMERIC;
    base_kcal3 NUMERIC;
    remaining_kcal NUMERIC;
    remaining_kcal2 NUMERIC;
    remaining_kcal3 NUMERIC;

    day INT;

    breakfast_plan TEXT[][] := ARRAY[]::TEXT[][];
    lunch_plan TEXT[][] := ARRAY[]::TEXT[][];
    dinner_plan TEXT[][] := ARRAY[]::TEXT[][];

    BreakfastDrink RECORD;
    DryFruits RECORD;
    Cereal RECORD;
    Fruits RECORD;
    DinnerBreads RECORD;
    Non_Veg_Items RECORD;
    LunchVegetables RECORD;
    DinnerVegetables RECORD;
    Pulses RECORD;
    LunchBread RECORD;

    fruit_quantity INT;
    pulses_quantity INT;
    veg_quantity INT;
    nonveg_quantity INT;
    rice_quantity INT;

    used_breakfast_cereals TEXT[] := ARRAY[]::TEXT[];
    used_fruits TEXT[] := ARRAY[]::TEXT[];
    used_dryfruits TEXT[] := ARRAY[]::TEXT[];
    used_drinks TEXT[] := ARRAY[]::TEXT[];

    used_lunch_breads TEXT[] := ARRAY[]::TEXT[];
    used_lunch_veggies TEXT[] := ARRAY[]::TEXT[];
    used_pulses TEXT[] := ARRAY[]::TEXT[];

    used_dinner_breads TEXT[] := ARRAY[]::TEXT[];
    used_dinner_veggies TEXT[] := ARRAY[]::TEXT[];
    used_nonveg TEXT[] := ARRAY[]::TEXT[];

BEGIN
    -- Fetch user data
    SELECT allergies, meal_preferences, calories_req_per_day
    INTO user_allergies, pref, daily_cal
    FROM "USER_PROFILE"
    WHERE user_id = uid;

    -- Calorie split
    breakfast_cal := daily_cal * 0.25;
    lunch_cal := daily_cal * 0.40;
    dinner_cal := daily_cal * 0.35;

    FOR day IN 1..7 LOOP

        -- BREAKFAST
        -- Breakfast Drink
        SELECT * INTO BreakfastDrink
        FROM "FOOD"
        WHERE what_criteria = 'BreakfastDrink'
        AND which_meal = 'Breakfast'
        AND (
            user_allergies IS NULL OR NOT EXISTS (
                SELECT 1 FROM unnest(user_allergies) a
                WHERE LOWER(name) LIKE '%' || LOWER(a) || '%'
            )
        )
        AND name <> ALL(used_drinks)
        ORDER BY md5(name || uid::text || day::text)
        LIMIT 1;
        IF BreakfastDrink.name IS NOT NULL THEN
        used_drinks := array_append(used_drinks, BreakfastDrink.name);
        END IF;

        IF BreakfastDrink.name IS NULL THEN
            SELECT * INTO BreakfastDrink
            FROM "FOOD"
            WHERE what_criteria = 'BreakfastDrink'
            AND which_meal = 'Breakfast'
            ORDER BY RANDOM()
            LIMIT 1;
        END IF;

        -- Dry Fruits
        SELECT * INTO DryFruits
        FROM "FOOD"
        WHERE what_criteria = 'DryFruits'
        AND which_meal = 'Breakfast'
        AND (
            user_allergies IS NULL OR NOT EXISTS (
                SELECT 1 FROM unnest(user_allergies) a
                WHERE LOWER(name) LIKE '%' || LOWER(a) || '%'
            )
        )
        AND name <> ALL(used_dryfruits)
        ORDER BY md5(name || uid::text || day::text)
        LIMIT 1;
        IF DryFruits.name IS NOT NULL THEN
        used_dryfruits := array_append(used_dryfruits, DryFruits.name);
        END IF;

        IF DryFruits.name IS NULL THEN
            SELECT * INTO DryFruits
            FROM "FOOD"
            WHERE what_criteria = 'DryFruits'
            AND which_meal = 'Breakfast'
            ORDER BY RANDOM()
            LIMIT 1;
        END IF;

        -- Cereal
        SELECT * INTO Cereal
        FROM "FOOD"
        WHERE what_criteria = 'Cereal'
        AND which_meal = 'Breakfast'
        AND (
            user_allergies IS NULL OR NOT EXISTS (
                SELECT 1 FROM unnest(user_allergies) a
                WHERE LOWER(name) LIKE '%' || LOWER(a) || '%'
            )
        )
        AND name <> ALL(used_breakfast_cereals)
        ORDER BY md5(name || uid::text || day::text)
        LIMIT 1;
        IF Cereal.name IS NOT NULL THEN
        used_breakfast_cereals := array_append(used_breakfast_cereals, Cereal.name);
        END IF;

        IF Cereal.name IS NULL THEN
            SELECT * INTO Cereal
            FROM "FOOD"
            WHERE what_criteria = 'Cereal'
            AND which_meal = 'Breakfast'
            ORDER BY RANDOM()
            LIMIT 1;
        END IF;

        -- Fruit
        SELECT * INTO Fruits
        FROM "FOOD"
        WHERE what_criteria = 'Fruits'
        AND which_meal = 'Breakfast'
        AND (
            user_allergies IS NULL OR NOT EXISTS (
                SELECT 1 FROM unnest(user_allergies) a
                WHERE LOWER(name) LIKE '%' || LOWER(a) || '%'
            )
        )
        AND name <> ALL(used_fruits)
        ORDER BY md5(name || uid::text || day::text)
        LIMIT 1;
        IF Fruits.name IS NOT NULL THEN
        used_fruits := array_append(used_fruits, Fruits.name);
        END IF;

        IF Fruits.name IS NULL THEN
            SELECT * INTO Fruits
            FROM "FOOD"
            WHERE what_criteria = 'Fruits'
            AND which_meal = 'Breakfast'
            ORDER BY RANDOM()
            LIMIT 1;
        END IF;

        -- Calculate remaining breakfast calories
        base_kcal :=
            COALESCE(Cereal.kcal, 0) +
            COALESCE(DryFruits.kcal, 0) +
            COALESCE(BreakfastDrink.kcal, 0);

        remaining_kcal := breakfast_cal - base_kcal;

        fruit_quantity :=
            GREATEST(
                    1,
                    CEIL(
                        GREATEST(remaining_kcal, 0)
                        / COALESCE(NULLIF(Fruits.kcal, 0), 1)
                    )
                );
            
        

        breakfast_plan := array_cat(
            breakfast_plan,
            ARRAY[
                ARRAY[
                    COALESCE(Cereal.name, 'Oats') || ' (' || COALESCE(Cereal.serving_size, '250g') || ')',
                    COALESCE(Fruits.name, 'Apple') || ' (' || COALESCE(fruit_quantity, 1) || ' piece(s))',
                    COALESCE(DryFruits.name, 'Dates') || ' (' || COALESCE(DryFruits.serving_size, '30g') || ')',
                    COALESCE(BreakfastDrink.name, 'Milk') || ' (' || COALESCE(BreakfastDrink.serving_size, '200ml') || ')'
                ]
            ]::TEXT[][]
        );

        -- LUNCH
        -- Lunch Bread
        SELECT * INTO LunchBread
        FROM "FOOD"
        WHERE what_criteria = 'LunchBread'
        AND which_meal = 'Lunch'
        AND (
            user_allergies IS NULL OR NOT EXISTS (
                SELECT 1 FROM unnest(user_allergies) a
                WHERE LOWER(name) LIKE '%' || LOWER(a) || '%'
            )
        )
        AND name <> ALL(used_lunch_breads)
        ORDER BY md5(name || uid::text || day::text)
        LIMIT 1;
        IF LunchBread.name IS NOT NULL THEN
        used_lunch_breads := array_append(used_lunch_breads, LunchBread.name);
        END IF;

        IF LunchBread.name IS NULL THEN
            SELECT * INTO LunchBread
            FROM "FOOD"
            WHERE what_criteria = 'LunchBread'
            AND which_meal = 'Lunch'
            ORDER BY RANDOM()
            LIMIT 1;
        END IF;

        -- Vegetables
        SELECT * INTO LunchVegetables 
        FROM "FOOD"
        WHERE what_criteria = 'Vegetables'
        AND (
            user_allergies IS NULL OR NOT EXISTS (
                SELECT 1 FROM unnest(user_allergies) a
                WHERE LOWER(name) LIKE '%' || LOWER(a) || '%'
            )
        )
        AND name <> ALL(used_lunch_veggies)
        ORDER BY md5(name || uid::text || day::text)
        LIMIT 1;
        IF LunchVegetables.name IS NOT NULL THEN
        used_lunch_veggies := array_append(used_lunch_veggies, LunchVegetables.name);
        END IF;

        IF LunchVegetables.name IS NULL THEN
            SELECT * INTO LunchVegetables
            FROM "FOOD"
            WHERE what_criteria = 'Vegetables'
            AND which_meal = 'Dinner'
            ORDER BY RANDOM()
            LIMIT 1;
        END IF;

        -- Pulses
        SELECT * INTO Pulses 
        FROM "FOOD"
        WHERE what_criteria = 'Pulses'
        AND which_meal = 'Lunch'
        AND (
            user_allergies IS NULL OR NOT EXISTS (
                SELECT 1 FROM unnest(user_allergies) a
                WHERE LOWER(name) LIKE '%' || LOWER(a) || '%'
            )
        )
        AND proteins > 5
        AND name <> ALL(used_pulses)
        ORDER BY md5(name || uid::text || day::text)
        LIMIT 1;
        IF Pulses.name IS NOT NULL THEN
        used_pulses := array_append(used_pulses, Pulses.name);
        END IF;

        IF Pulses.name IS NULL THEN
            SELECT * INTO Pulses
            FROM "FOOD"
            WHERE what_criteria = 'Pulses'
            AND which_meal = 'Lunch'
            ORDER BY RANDOM()
            LIMIT 1;
        END IF;

        -- Calculate remaining calories after bread + vegetables
        base_kcal2 :=
            COALESCE(LunchBread.kcal, 0) +
            COALESCE(LunchVegetables.kcal, 0);

        remaining_kcal2 := lunch_cal - base_kcal2;

        -- Decide pulses quantity
        pulses_quantity := CEIL(remaining_kcal2 / Pulses.kcal);            

        lunch_plan := array_cat(lunch_plan,
            ARRAY[
                ARRAY[
                    COALESCE(LunchBread.name, 'Roti') || ' (' || COALESCE(LunchBread.serving_size, '3pcs') || ')',
                    COALESCE(LunchVegetables.name, 'Tofu') || ' (' || COALESCE(LunchVegetables.serving_size, '150g') || ')',
                    COALESCE(Pulses.name, 'Chana Dal') || ' (' || pulses_quantity || 'x' || COALESCE(Pulses.serving_size, '200g') || ')'
                ]
            ]::TEXT[][]
        );

        -- DINNER
        -- DinnerBreads
        SELECT * INTO DinnerBreads 
        FROM "FOOD"
        WHERE what_criteria = 'DinnerBreads'
        AND which_meal = 'Dinner'
        AND (
            user_allergies IS NULL OR NOT EXISTS (
                SELECT 1 FROM unnest(user_allergies) a
                WHERE LOWER(name) LIKE '%' || LOWER(a) || '%'
            )
        )
        AND name <> ALL(used_dinner_breads)
        ORDER BY md5(name || uid::text || day::text)
        LIMIT 1;
        IF DinnerBreads.name IS NOT NULL THEN
        used_dinner_breads := array_append(used_dinner_breads, DinnerBreads.name);
        END IF;

        IF DinnerBreads.name IS NULL THEN
            SELECT * INTO DinnerBreads
            FROM "FOOD"
            WHERE what_criteria = 'DinnerBreads'
            AND which_meal = 'Dinner'
            ORDER BY RANDOM()
            LIMIT 1;
        END IF;

        -- Non-Veg Item
        SELECT * INTO Non_Veg_Items
        FROM "FOOD"
        WHERE what_criteria = 'Non-Veg_Items'
        AND which_meal = 'Dinner'
        AND (
            user_allergies IS NULL OR NOT EXISTS (
                SELECT 1 FROM unnest(user_allergies) a
                WHERE LOWER(name) LIKE '%' || LOWER(a) || '%'
            )
        )
        AND name <> ALL(used_nonveg)
        ORDER BY md5(name || uid::text || day::text)
        LIMIT 1;
        IF Non_Veg_Items.name IS NOT NULL THEN
        used_nonveg := array_append(used_nonveg, Non_Veg_Items.name);
        END IF;

        IF Non_Veg_Items.name IS NULL THEN
            SELECT * INTO Non_Veg_Items
            FROM "FOOD"
            WHERE what_criteria = 'Non-Veg_Items'
            AND which_meal = 'Dinner'
            ORDER BY RANDOM()
            LIMIT 1;
        END IF;

        -- Veg Item
        SELECT * INTO DinnerVegetables FROM "FOOD"
        WHERE what_criteria = 'Vegetables'
        AND which_meal = 'Dinner'
        AND (
            user_allergies IS NULL OR NOT EXISTS (
                SELECT 1 FROM unnest(user_allergies) a
                WHERE LOWER(name) LIKE '%' || LOWER(a) || '%'
            )
        )
        AND name <> ALL(used_dinner_veggies)
        ORDER BY md5(name || uid::text || day::text)
        LIMIT 1;
        IF DinnerVegetables.name IS NOT NULL THEN
        used_dinner_veggies := array_append(used_dinner_veggies, DinnerVegetables.name);
        END IF;

        IF DinnerVegetables.name IS NULL THEN
            SELECT * INTO DinnerVegetables
            FROM "FOOD"
            WHERE what_criteria = 'Vegetables'
            AND which_meal = 'Dinner'
            ORDER BY RANDOM()
            LIMIT 1;
        END IF;

        base_kcal3 :=
            COALESCE(DinnerBreads.kcal, 0) +
            CASE 
                WHEN pref = 'Veg' THEN COALESCE(DinnerVegetables.kcal, 0)
                ELSE COALESCE(Non_Veg_Items.kcal, 0)
            END;

        remaining_kcal3 := dinner_cal - base_kcal3;

        rice_quantity := CEIL(remaining_kcal3 / COALESCE(NULLIF(DinnerBreads.kcal,0),1));
        
        veg_quantity := 1;
        nonveg_quantity := 1;

        dinner_plan := array_cat(dinner_plan,
            ARRAY[
                ARRAY[
                    COALESCE(DinnerBreads.name, 'White Rice') || 
                    ' (' || CASE 
                                WHEN DinnerBreads.serving_size LIKE '%pcs%' THEN 
                                    DinnerBreads.serving_size
                                ELSE 
                                    rice_quantity || 'x' || COALESCE(DinnerBreads.serving_size, '100g')
                            END || ')',

                    CASE
                        WHEN pref = 'Veg' THEN 
                            COALESCE(DinnerVegetables.name, 'Cabbage') || 
                            ' (' || veg_quantity || 'x' || COALESCE(DinnerVegetables.serving_size, '150g') || ')'
                        ELSE 
                            COALESCE(Non_Veg_Items.name, 'Chicken') || 
                            ' (' || nonveg_quantity || 'x' || COALESCE(Non_Veg_Items.serving_size, '150g') || ')'
                    END
                ]
            ]::TEXT[][]
        );

    END LOOP;

    -- Store plans
    UPDATE "USER_PROFILE"
    SET 
        diet_plan_breakfast = breakfast_plan,
        diet_plan_lunch = lunch_plan,
        diet_plan_dinner = dinner_plan
    WHERE user_id = uid;

END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_full_plan(uid UUID)
RETURNS VOID AS $$
BEGIN
    PERFORM calculate_calories(uid);
    PERFORM generate_weekly_plan(uid);
END;
$$ LANGUAGE plpgsql;