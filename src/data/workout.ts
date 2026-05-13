import type { WorkoutDay, Exercise } from '../types'

export const workoutPrinciples = [
  {
    id: 'overload',
    title: 'Progressive Overload',
    body: 'Add weight or reps over time. Consistently challenging the muscle beyond its current capacity is the primary driver of adaptation. This is the most important variable — source: 2026 ACSM Position Stand.',
  },
  {
    id: 'frequency',
    title: 'Train Each Muscle Twice Per Week',
    body: 'Muscle protein synthesis elevation lasts only 36–48 hours after training. Training each muscle group once per week leaves hypertrophic potential unstimulated. The 2026 ACSM review identifies twice-per-week frequency as the most consistent finding in the literature.',
  },
  {
    id: 'volume',
    title: '10+ Sets Per Muscle Per Week',
    body: 'Volume has a dose-response relationship up to approximately 20 sets per muscle group per week, after which returns diminish. The ACSM 2026 guideline sets 10 sets per week as the minimum for hypertrophy.',
  },
  {
    id: 'load',
    title: 'Heavy Loads Are Not Mandatory',
    body: 'Muscle growth occurs across the rep range from ~30% to 100% of one-rep maximum when sufficient effort is applied. This is a major finding of the 2026 ACSM review and contradicts older conventional wisdom. Train hard — the load is flexible.',
  },
  {
    id: 'eccentric',
    title: 'Slow the Lowering Phase',
    body: 'The 2026 ACSM guidelines specifically highlight eccentric contractions as an important hypertrophy variable. Aim for 2–3 seconds on the lowering phase of each rep.',
  },
  {
    id: 'failure',
    title: 'Stop 2–3 Reps Short of Failure',
    body: 'Training to momentary muscle failure did not consistently improve outcomes in the 2026 ACSM review. Stopping with 2–3 reps in reserve is sufficient and protects joints and form.',
  },
  {
    id: 'rest',
    title: 'Rest More Than 60 Seconds Between Sets',
    body: '2024 Frontiers Bayesian meta-analysis: resting more than 60 seconds is beneficial. Use 2–3 minutes for heavy compound movements, 60–90 seconds for isolation exercises.',
  },
]

export const nutritionTips = [
  {
    id: 'protein',
    icon: '🥩',
    label: 'Protein Intake',
    value: '1.6–2.2g per kg bodyweight per day',
    detail: 'Morton et al. 2018 meta-analysis (1,800+ participants). Total daily intake matters most.',
  },
  {
    id: 'creatine',
    icon: '⚡',
    label: 'Creatine Monohydrate',
    value: '3–5g per day, no loading phase',
    detail: 'Most studied and consistently beneficial sports supplement. Increases phosphocreatine for high-intensity work.',
  },
  {
    id: 'caffeine',
    icon: '☕',
    label: 'Caffeine',
    value: '3–6mg per kg bodyweight, 30–60 min before training',
    detail: 'Backed by multiple meta-analyses for strength and endurance improvements.',
  },
  {
    id: 'timing',
    icon: '⏱️',
    label: 'Post-Workout Protein',
    value: 'Within 2 hours of training',
    detail: 'The anabolic window is wider than previously thought — total daily intake matters most, but post-workout protein still supports recovery.',
  },
  {
    id: 'hydration',
    icon: '💧',
    label: 'Hydration',
    value: '500ml 2hr before training, 200–300ml every 15 min during',
    detail: 'ACSM fluid replacement guidelines for training sessions longer than 45 minutes.',
  },
  {
    id: 'sleep',
    icon: '🌙',
    label: 'Sleep',
    value: '7–9 hours — non-negotiable',
    detail: 'Growth hormone secretion, testosterone, and muscle protein synthesis all peak during sleep.',
  },
]

function ex(partial: Omit<Exercise, 'id'>): Exercise {
  return { id: partial.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), ...partial }
}

export const workoutDays: WorkoutDay[] = [
  {
    day: 1,
    label: 'Push A',
    focus: 'Chest · Shoulders · Triceps',
    summary: 'Chest is the primary mover today. Two pressing compounds plus isolation work for shoulders and triceps.',
    exercises: [
      ex({ name: 'Barbell Bench Press', muscles: 'Chest, anterior delt, triceps', sets: 4, reps: '6–8', rest: '2–3 min', cue: 'Lower the bar with control over 2–3 seconds, drive through the full press.' }),
      ex({ name: 'Incline Dumbbell Press', muscles: 'Upper chest', sets: 3, reps: '8–10', rest: '2 min', cue: '30–45° incline, elbows at ~45° to the torso.' }),
      ex({ name: 'Overhead Press', muscles: 'Medial and anterior deltoid, triceps', sets: 3, reps: '8–10', rest: '2–3 min', cue: 'Brace the core hard, keep the bar path close to the face.' }),
      ex({ name: 'Cable Lateral Raise', muscles: 'Medial deltoid', sets: 4, reps: '12–15', rest: '60–90 sec', cue: 'Slight forward lean, lead with the elbow not the wrist.' }),
      ex({ name: 'Rope Tricep Pushdown', muscles: 'Triceps lateral head', sets: 3, reps: '12–15', rest: '60 sec', cue: 'Pin elbows to sides throughout the movement.' }),
      ex({ name: 'Overhead Tricep Extension', muscles: 'Triceps long head', sets: 3, reps: '12–15', rest: '60 sec', cue: 'Full stretch at the bottom for maximum long-head activation.' }),
    ],
  },
  {
    day: 2,
    label: 'Pull A',
    focus: 'Lats · Back · Biceps',
    summary: 'Lat width is the focus today. Heavy row plus curls for full posterior upper body volume.',
    exercises: [
      ex({ name: 'Pull-Ups / Lat Pulldown', muscles: 'Lats, biceps', sets: 4, reps: '6–10', rest: '2–3 min', cue: 'Retract shoulder blades at the top, full hang at the bottom.' }),
      ex({ name: 'Barbell Bent-Over Row', muscles: 'Mid-back, lats', sets: 4, reps: '8–10', rest: '2 min', cue: 'Hinge to ~45°, pull to the lower sternum, brace hard.' }),
      ex({ name: 'Seated Cable Row (Wide Grip)', muscles: 'Rhomboids, mid-traps', sets: 3, reps: '10–12', rest: '90 sec', cue: 'Pause at the chest for one second, full stretch at extension.' }),
      ex({ name: 'Single-Arm Dumbbell Row', muscles: 'Lats, lower traps', sets: 3, reps: '10–12 per side', rest: '90 sec', cue: 'Brace off the bench, pull the elbow to the hip.' }),
      ex({ name: 'Face Pulls', muscles: 'Rear delts, rotator cuff', sets: 3, reps: '15–20', rest: '60 sec', cue: 'Pull to forehead height with external rotation at end range. Protects shoulder health — do not skip.' }),
      ex({ name: 'Barbell / EZ Bar Curl', muscles: 'Biceps', sets: 3, reps: '10–12', rest: '60–90 sec', cue: 'No swinging, supinate the wrist fully at the top.' }),
      ex({ name: 'Hammer Curl', muscles: 'Brachialis, brachioradialis', sets: 3, reps: '12', rest: '60 sec', cue: 'Neutral grip throughout, controlled lowering.' }),
    ],
  },
  {
    day: 3,
    label: 'Legs A',
    focus: 'Quads · Hamstrings · Calves',
    summary: 'Quad-dominant day. Squat-based loading with hamstring accessory work and calf volume.',
    exercises: [
      ex({ name: 'Barbell Back Squat', muscles: 'Quads, glutes, hamstrings', sets: 4, reps: '6–8', rest: '3 min', cue: 'Break parallel, knees tracking over toes, brace throughout the entire rep.' }),
      ex({ name: 'Romanian Deadlift', muscles: 'Hamstrings, glutes', sets: 3, reps: '8–10', rest: '2–3 min', cue: 'Hip hinge with soft knees, bar close to the legs, feel the hamstring stretch at the bottom.' }),
      ex({ name: 'Leg Press', muscles: 'Quads', sets: 3, reps: '10–12', rest: '2 min', cue: 'Full range of motion, do not lock out the knees at the top.' }),
      ex({ name: 'Walking Lunges', muscles: 'Quads, glutes (unilateral)', sets: 3, reps: '12 per leg', rest: '90 sec', cue: 'Upright torso, controlled step.' }),
      ex({ name: 'Lying Leg Curl', muscles: 'Hamstrings', sets: 3, reps: '12–15', rest: '60–90 sec', cue: 'Full extension at the start, full flexion at the finish.' }),
      ex({ name: 'Standing Calf Raise', muscles: 'Gastrocnemius', sets: 4, reps: '15–20', rest: '45–60 sec', cue: 'Full stretch at the bottom, 2-second pause at the top.' }),
    ],
  },
  {
    day: 4,
    label: 'Push B',
    focus: 'Shoulders · Chest Variation · Triceps',
    summary: 'Shoulder-primary day. Overhead press leads, chest comes second. Higher rep ranges on laterals for volume.',
    exercises: [
      ex({ name: 'Barbell Overhead Press', muscles: 'Shoulders, triceps', sets: 4, reps: '6–8', rest: '3 min', cue: 'Today this is the primary compound — not an accessory. Full lockout at top.' }),
      ex({ name: 'Incline Barbell Press', muscles: 'Upper chest', sets: 3, reps: '8–10', rest: '2 min', cue: 'Variation from Day 1 flat press — change the stimulus.' }),
      ex({ name: 'Cable Fly / Pec Deck', muscles: 'Chest (isolation)', sets: 3, reps: '12–15', rest: '60–90 sec', cue: 'Lead with the chest, not the arms. Maintain a slight elbow bend.' }),
      ex({ name: 'Dumbbell Lateral Raise', muscles: 'Medial deltoid', sets: 4, reps: '15–20', rest: '60 sec', cue: 'Higher rep range than Day 1 to accumulate volume. Control the lowering.' }),
      ex({ name: 'EZ Bar Skull Crushers', muscles: 'Triceps long head', sets: 3, reps: '10–12', rest: '90 sec', cue: 'Lower slowly behind the head, elbows fixed in place.' }),
    ],
  },
  {
    day: 5,
    label: 'Pull B',
    focus: 'Deadlift · Back Thickness · Biceps',
    summary: 'Deadlift-focused day. Heavy posterior chain loading with back accessories after the main lift.',
    exercises: [
      ex({ name: 'Conventional Deadlift', muscles: 'Full posterior chain', sets: 4, reps: '4–6', rest: '3–4 min', cue: 'Hip hinge, neutral spine, bar stays in contact with the legs throughout the pull.' }),
      ex({ name: 'Weighted Pull-Up / Close-Grip Pulldown', muscles: 'Lats, biceps', sets: 3, reps: '8–10', rest: '2 min', cue: 'Different grip from Day 2 to vary the stimulus and target different lat fibres.' }),
      ex({ name: 'Chest-Supported Dumbbell Row', muscles: 'Mid-back', sets: 3, reps: '12 per side', rest: '90 sec', cue: 'Supported position reduces lower back fatigue after heavy deadlifts.' }),
      ex({ name: 'Seated Cable Row (Close Grip)', muscles: 'Rhomboids, mid-traps', sets: 3, reps: '10–12', rest: '90 sec', cue: 'Pause one second at full contraction.' }),
      ex({ name: 'Incline Dumbbell Curl', muscles: 'Biceps', sets: 3, reps: '12', rest: '60–90 sec', cue: 'Arms behind the torso at the start for full bicep stretch.' }),
      ex({ name: 'Reverse Curl', muscles: 'Brachialis, forearms', sets: 2, reps: '15', rest: '60 sec', cue: 'Overhand grip, controlled lowering.' }),
    ],
  },
  {
    day: 6,
    label: 'Legs B',
    focus: 'Glutes · Posterior Chain · Hamstrings',
    summary: 'Posterior-chain emphasis. Hip thrust leads glute work, varied loading from Day 3.',
    exercises: [
      ex({ name: 'Hack Squat / Front Squat', muscles: 'Quads, glutes', sets: 4, reps: '6–10', rest: '2–3 min', cue: 'High foot placement on hack squat increases glute involvement.' }),
      ex({ name: 'Barbell Hip Thrust', muscles: 'Glutes', sets: 4, reps: '10–12', rest: '2 min', cue: 'Drive through the heels, achieve posterior pelvic tilt at the top. Most effective glute isolation in the evidence base.' }),
      ex({ name: 'Sumo Romanian Deadlift', muscles: 'Inner hamstrings, adductors', sets: 3, reps: '10', rest: '2 min', cue: 'Wider stance creates a different stimulus than the conventional RDL on Day 3.' }),
      ex({ name: 'Leg Extension', muscles: 'Quads (isolation)', sets: 3, reps: '12–15', rest: '60 sec', cue: 'Research supports isolation exercises for complete quad development.' }),
      ex({ name: 'Seated Leg Curl', muscles: 'Hamstrings (hip-flexed position)', sets: 3, reps: '12–15', rest: '60–90 sec', cue: 'Different to lying leg curl — varied stimulation for complete hamstring development.' }),
      ex({ name: 'Seated Calf Raise', muscles: 'Soleus', sets: 4, reps: '15–20', rest: '45 sec', cue: 'Seated targets the soleus — differs from the gastrocnemius targeted by standing calf raise on Day 3.' }),
    ],
  },
  {
    day: 7,
    label: 'Rest',
    focus: 'Active Recovery',
    summary: 'Structured rest. Light activity improves recovery without adding fatigue to the next training week.',
    isRest: true,
    exercises: [
      ex({ name: 'Zone-2 Cardio', muscles: 'Full body (low intensity)', sets: 1, reps: '20–30 min', rest: '—', cue: 'Walking, cycling, or swimming at conversational pace. Improves lactate clearance and blood flow.' }),
      ex({ name: 'Static Stretching', muscles: 'All major muscle groups', sets: 1, reps: '20–30 sec per stretch', rest: '—', cue: 'Hold each stretch calmly. Improves long-term range of motion over weeks.' }),
      ex({ name: 'Foam Rolling', muscles: 'Major trained muscles', sets: 1, reps: '60 sec per group', rest: '—', cue: '2015 Cheatham et al. meta-analysis confirmed reduction in perceived muscle soreness.' }),
    ],
  },
]

// ── Beginner 3-day full-body programme ───────────────────────────────────────
// Designed for trainees with < 3–6 months of consistent training.
// Schedule: Full Body A (Mon) · Rest (Tue) · Full Body B (Wed) · Rest (Thu)
//           Full Body C (Fri) · Rest (Sat) · Active Recovery (Sun)

function bex(partial: Omit<Exercise, 'id'>): Exercise {
  return { id: 'b-' + partial.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), ...partial }
}

export const beginnerDays: WorkoutDay[] = [
  {
    day: 1,
    label: 'Full Body A',
    focus: 'Squat · Push · Pull · Hinge',
    summary: 'First full-body session of the week. Focus on learning movement patterns with light loads. Use 2–3 reps in reserve on every set.',
    exercises: [
      bex({ name: 'Goblet Squat', muscles: 'Quads, glutes, core', sets: 3, reps: '10', rest: '2 min', cue: 'Hold a dumbbell at your chest, keep the chest tall, knees track over toes.' }),
      bex({ name: 'Dumbbell Bench Press', muscles: 'Chest, anterior delt, triceps', sets: 3, reps: '10', rest: '90 sec', cue: 'Control the lowering over 2 seconds, elbows at 45° to the torso.' }),
      bex({ name: 'Single-Arm Dumbbell Row', muscles: 'Lats, mid-back, biceps', sets: 3, reps: '10 per side', rest: '90 sec', cue: 'Brace off the bench, pull the elbow to the hip.' }),
      bex({ name: 'Romanian Deadlift', muscles: 'Hamstrings, glutes', sets: 3, reps: '10', rest: '2 min', cue: 'Hip hinge with soft knees, bar close to the legs, feel the hamstring stretch at the bottom.' }),
      bex({ name: 'Plank', muscles: 'Core, shoulders', sets: 3, reps: '30 sec', rest: '60 sec', cue: 'Brace the abdomen like you expect a punch, neutral spine, breathe steadily.' }),
    ],
  },
  {
    day: 2,
    label: 'Rest',
    focus: 'Recovery',
    summary: 'Rest day between sessions. Go for a walk if you like — low-intensity movement aids recovery without adding fatigue.',
    isRest: true,
    exercises: [
      bex({ name: 'Light Walking', muscles: 'Full body (low intensity)', sets: 1, reps: '20–30 min', rest: '—', cue: 'Conversational pace only. Optional but beneficial.' }),
    ],
  },
  {
    day: 3,
    label: 'Full Body B',
    focus: 'Hinge · Push Variation · Pull Variation',
    summary: 'Second session. Slightly different exercise selection to vary the stimulus and target muscles at different angles.',
    exercises: [
      bex({ name: 'Leg Press', muscles: 'Quads, glutes', sets: 3, reps: '12', rest: '2 min', cue: 'Full range of motion, do not lock out the knees at the top.' }),
      bex({ name: 'Overhead Press', muscles: 'Shoulders, triceps', sets: 3, reps: '10', rest: '90 sec', cue: 'Brace the core hard, keep the bar path close to the face.' }),
      bex({ name: 'Lat Pulldown', muscles: 'Lats, biceps', sets: 3, reps: '12', rest: '90 sec', cue: 'Retract the shoulder blades at the top of each rep, full hang at the bottom.' }),
      bex({ name: 'Walking Lunges', muscles: 'Quads, glutes (unilateral)', sets: 3, reps: '10 per leg', rest: '90 sec', cue: 'Upright torso, controlled step, front knee tracks over toes.' }),
      bex({ name: 'Dumbbell Lateral Raise', muscles: 'Medial deltoid', sets: 3, reps: '12', rest: '60 sec', cue: 'Slight forward lean, lead with the elbow not the wrist.' }),
    ],
  },
  {
    day: 4,
    label: 'Rest',
    focus: 'Recovery',
    summary: 'Rest before the final session of the week. Prioritise sleep — growth hormone secretion peaks during slow-wave sleep.',
    isRest: true,
    exercises: [
      bex({ name: 'Static Stretching', muscles: 'All major muscle groups', sets: 1, reps: '20–30 sec per stretch', rest: '—', cue: 'Focus on areas that feel tight. Improves long-term range of motion over weeks.' }),
    ],
  },
  {
    day: 5,
    label: 'Full Body C',
    focus: 'Glutes · Press Variation · Row Variation',
    summary: 'Third and final session. Hip thrust leads glute work. Face pulls protect shoulder health — never skip them.',
    exercises: [
      bex({ name: 'Barbell Hip Thrust', muscles: 'Glutes', sets: 3, reps: '12', rest: '90 sec', cue: 'Drive through the heels, achieve posterior pelvic tilt at the top.' }),
      bex({ name: 'Incline Dumbbell Press', muscles: 'Upper chest, anterior delt', sets: 3, reps: '10', rest: '90 sec', cue: '30–45° incline, elbows at ~45° to the torso.' }),
      bex({ name: 'Seated Cable Row', muscles: 'Rhomboids, mid-traps, biceps', sets: 3, reps: '12', rest: '90 sec', cue: 'Pause at the chest for one second, full stretch at extension.' }),
      bex({ name: 'Lying Leg Curl', muscles: 'Hamstrings', sets: 3, reps: '12', rest: '60–90 sec', cue: 'Full extension at the start, full flexion at the finish.' }),
      bex({ name: 'Face Pulls', muscles: 'Rear delts, rotator cuff', sets: 3, reps: '15', rest: '60 sec', cue: 'Pull to forehead height with external rotation. Protects shoulder health — do not skip.' }),
    ],
  },
  {
    day: 6,
    label: 'Rest',
    focus: 'Recovery',
    summary: 'Weekend rest. Let your body adapt to the week of training.',
    isRest: true,
    exercises: [
      bex({ name: 'Foam Rolling', muscles: 'Major trained muscles', sets: 1, reps: '60 sec per group', rest: '—', cue: 'Spend 60 seconds on each major muscle group you trained this week.' }),
    ],
  },
  {
    day: 7,
    label: 'Rest',
    focus: 'Active Recovery',
    summary: 'Active recovery day. Light movement aids lactate clearance and prepares you for next week.',
    isRest: true,
    exercises: [
      bex({ name: 'Zone-2 Cardio', muscles: 'Full body (low intensity)', sets: 1, reps: '20–30 min', rest: '—', cue: 'Walking, cycling, or swimming at conversational pace.' }),
      bex({ name: 'Static Stretching', muscles: 'All major muscle groups', sets: 1, reps: '20–30 sec per stretch', rest: '—', cue: 'Hold each stretch calmly.' }),
    ],
  },
]
