import React, { useState, useEffect } from 'react';
import { generateDiet, generateWorkout } from '../api/apiClient';

/* ─────────────────────────────────────────────
   CALORIE / MACRO CALCULATION
───────────────────────────────────────────── */
function calcNutrition(profile) {
  const { age, gender, height_cm, weight_kg, activity_level, aim_kg } = profile;
  const a = parseFloat(age) || 25;
  const h = parseFloat(height_cm) || 170;
  const w = parseFloat(weight_kg) || 70;

  let bmr = 10 * w + 6.25 * h - 5 * a;
  if (gender === 'F') bmr -= 161;
  else bmr += 5;

  const mult = { Light: 1.375, Moderate: 1.55, Heavy: 1.725 }[activity_level] || 1.55;
  const tdee = Math.round(bmr * mult);
  const goal = aim_kg && parseFloat(aim_kg) < w ? tdee - 400 : tdee + 200;
  const calories = Math.max(1200, Math.round(goal));
  const protein = Math.round((calories * 0.30) / 4);
  const carbs   = Math.round((calories * 0.45) / 4);
  const fat     = Math.round((calories * 0.25) / 9);

  return { calories, protein, carbs, fat };
}

/* ─────────────────────────────────────────────
   HELPERS — parse DB plan into meal/workout shape
───────────────────────────────────────────── */

// Backend returns: { message, plan: { diet_plan_breakfast: [[...]], diet_plan_lunch: [[...]], diet_plan_dinner: [[...]] } }
function parseDietPlan(plan, calorieGoal) {
  if (!plan) return null;
  return {
    breakfast: {
      name: 'Breakfast',
      items: plan.diet_plan_breakfast?.[0] || [],
      kcal: Math.round(calorieGoal * 0.3),
      time: '8:00 AM',
    },
    lunch: {
      name: 'Lunch',
      items: plan.diet_plan_lunch?.[0] || [],
      kcal: Math.round(calorieGoal * 0.4),
      time: '1:00 PM',
    },
    dinner: {
      name: 'Dinner',
      items: plan.diet_plan_dinner?.[0] || [],
      kcal: calorieGoal - Math.round(calorieGoal * 0.3) - Math.round(calorieGoal * 0.4),
      time: '7:30 PM',
    },
  };
}

// Backend returns: { message, plan: { workout_plan: {...} } }
function parseWorkoutPlan(plan) {
  if (!plan || !plan.workout_plan) return [];
  const wp = plan.workout_plan;
  const exercises = Array.isArray(wp) ? wp : Object.values(wp);
  return exercises.map(ex => ({
    label: ex.exercise_name || ex.name || ex.label || String(ex),
    icon: ex.icon || '💪',
  }));
}

/* ─────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────── */
function StatCard({ label, value, sub, accent }) {
  return (
    <div className="card" style={accent ? { borderColor: 'var(--accent-border)', background: 'var(--accent-light)' } : {}}>
      <div className="card-label">{label}</div>
      <div className="card-value" style={accent ? { color: 'var(--accent-text)' } : {}}>{value}</div>
      {sub && <div className="card-sub">{sub}</div>}
    </div>
  );
}

function MealCard({ meal, type, consumed, onToggle }) {
  const headerName = type.charAt(0).toUpperCase() + type.slice(1);
  return (
    <div className={`meal-card ${type}`}>
      <div className="meal-time-badge">
        {type === 'breakfast' && '🌅'}
        {type === 'lunch'     && '☀️'}
        {type === 'dinner'    && '🌙'}
        {' '}{meal.time}
      </div>
      <div className="meal-name">{headerName}</div>
      <div className="meal-items">
        <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
          {meal.items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="meal-kcal">{meal.kcal} kcal</span>
        <button
          onClick={onToggle}
          style={{
            fontSize: 12, fontWeight: 600, padding: '4px 12px',
            borderRadius: 20, border: '1.5px solid', cursor: 'pointer',
            transition: 'all 160ms ease', fontFamily: 'var(--font-body)',
            borderColor: consumed ? 'var(--success)' : 'var(--border-default)',
            background: consumed ? 'var(--success-light)' : 'transparent',
            color: consumed ? 'var(--success)' : 'var(--text-muted)',
          }}
        >
          {consumed ? '✓ Logged' : 'Log meal'}
        </button>
      </div>
    </div>
  );
}

function MacroBar({ label, current, goal, color }) {
  const pct = Math.min(100, Math.round((current / goal) * 100));
  return (
    <div className="macro-row">
      <div className="macro-header">
        <span className="macro-label">{label}</span>
        <span className="macro-amount">{current}g / {goal}g</span>
      </div>
      <div className="macro-track">
        <div className="macro-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function DayPlanner() {
  const profile = (() => {
    try { return JSON.parse(localStorage.getItem('vita-profile')) || {}; } catch { return {}; }
  })();

  const nutrition = calcNutrition(profile);

  const [meals, setMeals] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [dietLoading, setDietLoading] = useState(true);
  const [workoutLoading, setWorkoutLoading] = useState(true);
  const [dietError, setDietError] = useState(null);
  const [workoutError, setWorkoutError] = useState(null);

  // ── Fetch diet plan ──
  useEffect(() => {
    const fetchDiet = async () => {
      try {
        const res = await generateDiet({
          meal_preference: profile.meal_pref || 'Veg',
          allergies: profile.allergies || '',
          calories: nutrition.calories,
        });
        console.log('Diet response:', res.data);
        const parsed = parseDietPlan(res.data.plan, nutrition.calories);
        console.log('Parsed diet:', parsed);
        setMeals(parsed);
      } catch (err) {
        console.error('Diet error:', err.response?.data || err.message);
        setDietError(
          typeof err.response?.data?.error === 'string'
            ? err.response.data.error
            : err.response?.data?.message || err.message || 'Failed to load diet plan.'
        );
      } finally {
        setDietLoading(false);
      }
    };
    fetchDiet();
  }, []);

  // ── Fetch workout plan ──
  useEffect(() => {
    const fetchWorkout = async () => {
      try {
        const res = await generateWorkout({
          activity_level: profile.activity_level || 'Moderate',
        });
        console.log('Workout response:', res.data);
        const parsed = parseWorkoutPlan(res.data.plan);
        console.log('Parsed workout:', parsed);
        setWorkouts(parsed);
      } catch (err) {
        console.error('Workout error:', err.response?.data || err.message);
        setWorkoutError(
          typeof err.response?.data?.error === 'string'
            ? err.response.data.error
            : err.response?.data?.message || err.message || 'Failed to load workout plan.'
        );
      } finally {
        setWorkoutLoading(false);
      }
    };
    fetchWorkout();
  }, []);

  const dateStr = new Date().toISOString().split('T')[0];
  const [logged, setLogged] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('vita-daily-log'));
      return (saved && saved.date === dateStr) ? saved.logged : { breakfast: false, lunch: false, dinner: false };
    } catch { return { breakfast: false, lunch: false, dinner: false }; }
  });
  const [water, setWater] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('vita-daily-log'));
      return (saved && saved.date === dateStr) ? saved.water : 0;
    } catch { return 0; }
  });
  const WATER_GOAL = 8;

  useEffect(() => {
    localStorage.setItem('vita-daily-log', JSON.stringify({ date: dateStr, logged, water }));
  }, [dateStr, logged, water]);

  const caloriesConsumed = meals
    ? (logged.breakfast ? (meals.breakfast?.kcal || 0) : 0) +
      (logged.lunch     ? (meals.lunch?.kcal     || 0) : 0) +
      (logged.dinner    ? (meals.dinner?.kcal     || 0) : 0)
    : 0;

  const calPct = Math.min(100, Math.round((caloriesConsumed / nutrition.calories) * 100));

  const loggedMeals = meals ? [
    logged.breakfast && meals.breakfast,
    logged.lunch     && meals.lunch,
    logged.dinner    && meals.dinner,
  ].filter(Boolean) : [];
  const totalLogged = loggedMeals.reduce((s, m) => s + (m?.kcal || 0), 0);
  const totalAll = meals
    ? (meals.breakfast?.kcal || 0) + (meals.lunch?.kcal || 0) + (meals.dinner?.kcal || 0)
    : 1;
  const fracLogged = totalAll > 0 ? totalLogged / totalAll : 0;

  const proteinConsumed = Math.round(nutrition.protein * fracLogged);
  const carbsConsumed   = Math.round(nutrition.carbs   * fracLogged);
  const fatConsumed     = Math.round(nutrition.fat     * fracLogged);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const name = profile.name ? `, ${profile.name.split(' ')[0]}` : '';
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  const schedule = [
    { time: '8:00 AM', title: 'Breakfast', done: logged.breakfast, active: !logged.breakfast },
    { time: '1:00 PM', title: 'Lunch',     done: logged.lunch,     active: !logged.lunch && logged.breakfast },
    { time: '7:30 PM', title: 'Dinner',    done: logged.dinner,    active: !logged.dinner && logged.lunch },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <div className="greeting">{greeting}{name} 👋</div>
          <div className="greeting-date">{today}</div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 16px', borderRadius: 20,
          background: 'var(--bg-card)', border: '1.5px solid var(--border-subtle)',
          fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)',
        }}>
          <span style={{ color: 'var(--accent-text)', fontFamily: 'var(--font-heading)', fontSize: 16 }}>{caloriesConsumed}</span>
          <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>/ {nutrition.calories} kcal</span>
        </div>
      </div>

      <div className="page-body">

        <div className="stat-grid">
          <StatCard label="Calorie goal" value={`${nutrition.calories} kcal`} sub={`${nutrition.calories - caloriesConsumed} remaining today`} accent />
          <StatCard label="Water intake" value={`${water * 250} ml`} sub={`Goal: ${WATER_GOAL * 250} ml (${WATER_GOAL} cups)`} />
          <StatCard label="Workout plan" value={workoutLoading ? 'Loading...' : `${workouts.length} exercises`} sub={`${profile.activity_level || 'Moderate'} intensity`} />
        </div>

        <div className="dash-grid-main">
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <div>
                <div className="card-label">Energy today</div>
                <div className="card-value">{caloriesConsumed} <span style={{ fontSize: 16, fontWeight: 400, color: 'var(--text-muted)' }}>kcal consumed</span></div>
              </div>
              <div style={{ padding: '4px 12px', borderRadius: 20, background: 'var(--accent-light)', color: 'var(--accent-text)', fontSize: 12, fontWeight: 700 }}>{calPct}%</div>
            </div>
            <div className="prog-track">
              <div className="prog-fill" style={{ width: `${calPct}%`, background: calPct >= 100 ? 'var(--success)' : calPct >= 70 ? 'var(--warning)' : 'var(--accent)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
              <span>0 kcal</span>
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>{nutrition.calories - caloriesConsumed} kcal left</span>
              <span>{nutrition.calories} kcal</span>
            </div>
          </div>

          <div className="card">
            <div className="card-label">Hydration tracker</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
              <div className="card-value" style={{ fontSize: 26 }}>{water * 250}</div>
              <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>ml</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
              {WATER_GOAL - water > 0 ? `${(WATER_GOAL - water) * 250}ml to reach your daily goal` : '🎉 Daily goal reached!'}
            </div>
            <div className="water-track">
              {Array.from({ length: WATER_GOAL }).map((_, i) => (
                <div key={i} className={`water-cup${i < water ? ' filled' : ''}`} onClick={() => setWater(i < water ? i : i + 1)} title={`${(i + 1) * 250}ml`}>💧</div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={() => setWater(w => Math.min(WATER_GOAL, w + 1))} className="btn-primary" style={{ height: 36, fontSize: 13 }}>+ 250 ml</button>
              {water > 0 && <button onClick={() => setWater(w => Math.max(0, w - 1))} className="btn-ghost" style={{ height: 36, fontSize: 13 }}>Undo</button>}
            </div>
          </div>
        </div>

        {/* ── Meal Plan ── */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div className="card-label" style={{ marginBottom: 0 }}>Today's meal plan</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {profile.meal_pref === 'Non-Veg' ? '🍗 Non-Vegetarian plan' : '🥦 Vegetarian plan'}
                {profile.allergies ? ` · Avoiding: ${profile.allergies}` : ''}
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{Object.values(logged).filter(Boolean).length}/3 meals logged</div>
          </div>

          {dietLoading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>⏳ Generating your personalised meal plan...</div>
          ) : dietError ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--error)' }}>{dietError}</div>
          ) : meals ? (
            <div className="meals-row">
              {['breakfast', 'lunch', 'dinner'].map(type => meals[type] && (
                <MealCard key={type} meal={meals[type]} type={type} consumed={logged[type]} onToggle={() => setLogged(l => ({ ...l, [type]: !l[type] }))} />
              ))}
            </div>
          ) : null}
        </div>

        {/* ── Exercise Regime ── */}
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div className="card-label" style={{ marginBottom: 0 }}>Today's exercise regime</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Recommended activities</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{workouts.length} exercises</div>
          </div>

          {workoutLoading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>⏳ Generating your workout plan...</div>
          ) : workoutError ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--error)' }}>{workoutError}</div>
          ) : (
            <div className="meals-row">
              {workouts.map((w, i) => (
                <div key={i} className="meal-card" style={{ borderLeftColor: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px' }}>
                  <span style={{ fontSize: 24 }}>{w.icon}</span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{w.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Macros + Schedule ── */}
        <div className="dash-grid-bottom">
          <div className="card">
            <div className="card-label">Macro breakdown</div>
            <div className="macro-list">
              <MacroBar label="Protein"       current={proteinConsumed} goal={nutrition.protein} color="#3B82F6" />
              <MacroBar label="Carbohydrates" current={carbsConsumed}   goal={nutrition.carbs}   color="#10B981" />
              <MacroBar label="Fats"          current={fatConsumed}     goal={nutrition.fat}     color="#F59E0B" />
            </div>
            <div style={{ marginTop: 18, padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              💡 <strong>Tip:</strong>{' '}
              {proteinConsumed < nutrition.protein * 0.5
                ? "You're low on protein today. Add eggs, legumes, or a shake to your dinner."
                : carbsConsumed < nutrition.carbs * 0.5
                ? 'Low on carbs — consider a banana or whole grain snack before your workout.'
                : '✓ Great progress! Keep logging your meals to stay on track.'}
            </div>
          </div>

          <div className="card">
            <div className="card-label">Today's schedule</div>
            <div className="timeline">
              {schedule.map((item, i) => (
                <div className="timeline-item" key={i}>
                  <div className="timeline-time">{item.time}</div>
                  <div className={`timeline-dot${item.done ? ' done' : item.active ? ' active' : ''}`} />
                  <div className="timeline-body">
                    <div className={`timeline-title${item.done ? ' done' : ''}`}>{item.title}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Insight banner ── */}
        <div style={{ padding: '18px 24px', borderRadius: 'var(--radius-lg)', background: 'var(--accent-light)', border: '1.5px solid var(--accent-border)', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>📊</span>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--accent-text)', marginBottom: 4, fontSize: 14 }}>Your personalised plan is live</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Based on your profile — {profile.weight_kg}kg current, {profile.aim_kg || profile.weight_kg}kg target — your daily calorie goal is{' '}
              <strong>{nutrition.calories} kcal</strong> with <strong>{nutrition.protein}g protein</strong>,{' '}
              <strong>{nutrition.carbs}g carbs</strong>, and <strong>{nutrition.fat}g fat</strong>.
              Calories are calculated using the Mifflin-St Jeor formula adjusted for your activity level.
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
