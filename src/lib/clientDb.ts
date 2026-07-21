'use client';

export interface UserStats {
  id: string;
  name: string;
  avatar: string;
  height: number;
  weight: number;
  age: number;
  sex: string;
  activityLevel: string;
  bmr: number;
  tdee: number;
  goal: string;
  equipment: string;
  daysAvailable: number;
  currentLevel: number;
  currentXP: number;
}

export interface Plan {
  id: string;
  userId: string;
  timeline: string;
  weeklyWorkouts: string;
  mealPlan: string;
}

export interface DailyLog {
  id: string;
  dateString: string;
  workoutsCompleted: boolean;
  mealsOnTarget: boolean;
}

export interface Food {
  id: string;
  externalId?: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  servingSize: string;
  isCustom: boolean;
  isFavorite: boolean;
}

export interface FoodLog {
  id: string;
  dateString: string;
  foodId: string;
  mealType: string; // Breakfast, Lunch, Dinner, Snacks
  quantity: number; // Servings
  consumedAt: string;
}

export interface WaterLog {
  id: string;
  dateString: string;
  amountOz: number;
}

export interface Exercise {
  id: string;
  name: string;
  targetMuscleGroup: string;
  secondaryMuscles?: string;
  equipment: string;
  difficulty: string;
  instructions: string;
  defaultSets: number;
  defaultReps: string;
  videoUrl?: string;
  isCardio: boolean;
}

export interface ExerciseLog {
  id: string;
  workoutId: string;
  exerciseId: string;
  order: number;
  targetSets: number;
  targetReps: number;
  targetWeight: number;
  completed: boolean;
  actualSets: number;
  actualReps: number;
  actualWeight: number;
}

export interface Workout {
  id: string;
  dateString: string;
  isCompleted: boolean;
  type: string; // 'generated', 'manual'
  exercises: ExerciseLog[];
}

export interface RecoveryRoutine {
  id: string;
  title: string;
  type: string; // 'massage' or 'stretch'
  targetArea: string;
  durationMinutes: number;
  equipment: string;
  relatedMuscleGroups: string; // JSON array
  instructions: string; // JSON string of steps
  stretchType?: string;
  whenToUse?: string;
  holdDuration?: string;
}

export interface RecoveryLog {
  id: string;
  recoveryRoutineId: string;
  dateString: string;
}

export interface CustomChecklistItem {
  id: string;
  label: string;
  icon: string;
  order: number;
}

export interface DailyChecklistLog {
  id: string;
  dateString: string;
  checklistItemId: string;
  completed: boolean;
}

export interface HourlyLog {
  id: string;
  dateString: string;
  hour: number;
  activity: string;
  completed: boolean;
}

export interface FitQuestState {
  user: UserStats | null;
  plan: Plan | null;
  dailyLogs: DailyLog[];
  foods: Food[];
  foodLogs: FoodLog[];
  waterLogs: WaterLog[];
  workouts: Workout[];
  recoveryLogs: RecoveryLog[];
  customChecklistItems: CustomChecklistItem[];
  dailyChecklistLogs: DailyChecklistLog[];
  hourlyLogs: HourlyLog[];
}

const STORAGE_KEY = 'fitquest-state-v2';

export const DEFAULT_CHECKLIST_ITEMS: CustomChecklistItem[] = [
  { id: 'item-water', label: 'Drink 80oz Water', icon: 'Droplet', order: 0 },
  { id: 'item-stretch', label: '10 Min Stretching', icon: 'Flame', order: 1 },
  { id: 'item-sleep', label: '7-8 Hours Sleep', icon: 'Moon', order: 2 },
];

export const DEFAULT_EXERCISES: Exercise[] = [
  { id: 'ex-1', name: 'Goblet Squat', targetMuscleGroup: 'legs', equipment: 'dumbbell', difficulty: 'beginner', instructions: 'Hold dumbbell at chest level. Squat deep keeping back straight.', defaultSets: 3, defaultReps: '10-12', isCardio: false },
  { id: 'ex-2', name: 'Dumbbell Bench Press', targetMuscleGroup: 'chest', equipment: 'dumbbell', difficulty: 'beginner', instructions: 'Lie on bench. Press dumbbells up until arms extend.', defaultSets: 3, defaultReps: '8-10', isCardio: false },
  { id: 'ex-3', name: 'One-Arm Dumbbell Row', targetMuscleGroup: 'back', equipment: 'dumbbell', difficulty: 'beginner', instructions: 'Pull dumbbell to ribcage keeping elbow close to body.', defaultSets: 3, defaultReps: '10-12', isCardio: false },
  { id: 'ex-4', name: 'Dumbbell Shoulder Press', targetMuscleGroup: 'shoulders', equipment: 'dumbbell', difficulty: 'beginner', instructions: 'Press dumbbells up overhead from shoulder level.', defaultSets: 3, defaultReps: '8-10', isCardio: false },
  { id: 'ex-5', name: 'Pushups', targetMuscleGroup: 'chest', equipment: 'none', difficulty: 'beginner', instructions: 'Standard pushup keeping body straight.', defaultSets: 3, defaultReps: '12-15', isCardio: false },
  { id: 'ex-6', name: 'Plank', targetMuscleGroup: 'core', equipment: 'none', difficulty: 'beginner', instructions: 'Hold forearm plank position keeping core braced.', defaultSets: 3, defaultReps: '30-45s', isCardio: false }
];

export const DEFAULT_ROUTINES: RecoveryRoutine[] = [
  { id: 'rec-1', title: 'Chest Roller Release', type: 'massage', targetArea: 'chest', durationMinutes: 5, equipment: 'foam roller', relatedMuscleGroups: '["chest"]', instructions: '["Place roller under chest", "Slowly roll back and forth", "Hold on tender spots for 30s"]' },
  { id: 'rec-2', title: 'Hamstring Dynamic Stretch', type: 'stretch', targetArea: 'legs', durationMinutes: 8, equipment: 'none', relatedMuscleGroups: '["legs"]', instructions: '["Leg swings forward and back", "Toe touches with slight knee bend", "Perform 3 sets of 10 reps"]' },
  { id: 'rec-3', title: 'Lower Back Static stretch', type: 'stretch', targetArea: 'lower back', durationMinutes: 6, equipment: 'none', relatedMuscleGroups: '["back"]', instructions: '["Lie on back", "Pull knees to chest and hold", "Breathe deeply for 60 seconds"]' }
];

export const DEFAULT_FOODS: Food[] = [
  { id: 'f-1', name: 'Chicken Breast (Cooked)', calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, servingSize: '100g', isCustom: false, isFavorite: true },
  { id: 'f-2', name: 'White Rice (Cooked)', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, servingSize: '100g', isCustom: false, isFavorite: true },
  { id: 'f-3', name: 'Whole Egg (Large)', calories: 70, protein: 6, carbs: 0.6, fat: 5, fiber: 0, servingSize: '1 egg', isCustom: false, isFavorite: true },
  { id: 'f-4', name: 'Oatmeal (Dry)', calories: 150, protein: 5, carbs: 27, fat: 2.5, fiber: 4, servingSize: '40g', isCustom: false, isFavorite: true },
  { id: 'f-5', name: 'Whey Protein Shake', calories: 120, protein: 24, carbs: 3, fat: 1.5, fiber: 0, servingSize: '1 scoop', isCustom: false, isFavorite: true }
];

export function getClientState(): FitQuestState {
  if (typeof window === 'undefined') {
    return {
      user: null, plan: null, dailyLogs: [], foods: DEFAULT_FOODS,
      foodLogs: [], waterLogs: [], workouts: [], recoveryLogs: [],
      customChecklistItems: DEFAULT_CHECKLIST_ITEMS, dailyChecklistLogs: [], hourlyLogs: []
    };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<FitQuestState>;
      return {
        user: parsed.user || null,
        plan: parsed.plan || null,
        dailyLogs: parsed.dailyLogs || [],
        foods: parsed.foods && parsed.foods.length ? parsed.foods : DEFAULT_FOODS,
        foodLogs: parsed.foodLogs || [],
        waterLogs: parsed.waterLogs || [],
        workouts: parsed.workouts || [],
        recoveryLogs: parsed.recoveryLogs || [],
        customChecklistItems: parsed.customChecklistItems && parsed.customChecklistItems.length ? parsed.customChecklistItems : DEFAULT_CHECKLIST_ITEMS,
        dailyChecklistLogs: parsed.dailyChecklistLogs || [],
        hourlyLogs: parsed.hourlyLogs || []
      };
    }
  } catch (e) {
    console.error('Failed to load FitQuest state:', e);
  }
  return {
    user: null, plan: null, dailyLogs: [], foods: DEFAULT_FOODS,
    foodLogs: [], waterLogs: [], workouts: [], recoveryLogs: [],
    customChecklistItems: DEFAULT_CHECKLIST_ITEMS, dailyChecklistLogs: [], hourlyLogs: []
  };
}

export function saveClientState(state: FitQuestState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save FitQuest state:', e);
  }
}
