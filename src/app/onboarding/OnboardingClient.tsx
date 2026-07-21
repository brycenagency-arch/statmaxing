'use client';

import { useState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';

export default function OnboardingClient() {
  const [bmi, setBmi] = useState(0);
  const [tdee, setTdee] = useState(0);
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      name: '',
      avatar: '👤',
      heightFt: 5,
      heightIn: 9,
      weightLbs: 160,
      age: 30,
      sex: 'male',
      activityLevel: 'sedentary',
      goal: 'General Fitness',
      equipment: 'none',
      daysAvailable: 3,
    },
  });

  const watchAllFields = watch();

  useEffect(() => {
    const { heightFt, heightIn, weightLbs, age, sex, activityLevel } = watchAllFields;
    if (heightFt && weightLbs) {
      const heightInCm = (Number(heightFt) * 12 + Number(heightIn || 0)) * 2.54;
      const weightInKg = Number(weightLbs) / 2.20462;
      const heightInMeters = heightInCm / 100;
      
      setBmi(+(weightInKg / (heightInMeters * heightInMeters)).toFixed(1));

      let calculatedBmr = 10 * weightInKg + 6.25 * heightInCm - 5 * age;
      calculatedBmr += sex === 'male' ? 5 : -161;

      const multipliers: Record<string, number> = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.9,
      };
      
      const calculatedTdee = calculatedBmr * (multipliers[activityLevel] || 1.2);
      setTdee(Math.round(calculatedTdee));
    }
  }, [watchAllFields]);

  const onSubmit = (data: any) => {
    startTransition(() => {
      const heightInCm = (Number(data.heightFt) * 12 + Number(data.heightIn || 0)) * 2.54;
      const weightInKg = Number(data.weightLbs) / 2.20462;

      let calculatedBmr = 10 * weightInKg + 6.25 * heightInCm - 5 * data.age;
      calculatedBmr += data.sex === 'male' ? 5 : -161;

      const userStats = {
        id: Math.random().toString(36).slice(2, 10),
        name: data.name || 'Adventurer',
        avatar: data.avatar || '👤',
        height: Number(heightInCm.toFixed(1)),
        weight: Number(weightInKg.toFixed(1)),
        age: Number(data.age),
        sex: data.sex,
        activityLevel: data.activityLevel,
        bmr: calculatedBmr,
        tdee,
        goal: data.goal,
        equipment: data.equipment,
        daysAvailable: Number(data.daysAvailable),
        currentLevel: 1,
        currentXP: 0,
      };

      const mockPlan = {
        id: Math.random().toString(36).slice(2, 10),
        userId: userStats.id,
        timeline: '8-week',
        weeklyWorkouts: JSON.stringify({
          Monday: 'Full Body Strength',
          Wednesday: 'Cardio & Core',
          Friday: 'Full Body Strength',
        }),
        mealPlan: JSON.stringify({
          calories: tdee,
          protein: Math.round(Number(data.weightLbs)), // rough 1g per lb
          carbs: Math.round((tdee * 0.4) / 4), // 40% from carbs
          fat: Math.round((tdee * 0.3) / 9), // 30% from fat
        }),
      };

      import('@/lib/clientDb').then(({ getClientState, saveClientState }) => {
        const state = getClientState();
        state.user = userStats;
        state.plan = mockPlan;
        saveClientState(state);
        window.location.href = '/dashboard';
      });
    });
  };

  const inputClass = "w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all";
  const labelClass = "block text-sm font-medium text-slate-400 mb-1";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 md:py-12 font-sans">
      <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        
        <div className="p-8 border-b border-slate-800 bg-slate-900/50">
          <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Character Creation
          </h1>
          <p className="text-slate-400 text-center">Enter your stats to generate your custom quest line.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className={labelClass}>Character Name</label>
              <input type="text" placeholder="e.g. Thor" {...register('name')} className={inputClass} required />
            </div>
            
            <div className="md:col-span-2">
              <label className={labelClass}>Choose Avatar</label>
              <div className="flex gap-4">
                {['👤', '🧔‍♂️', '👩‍🦰', '🦁', '🐉', '🐺'].map(emoji => (
                  <label key={emoji} className="cursor-pointer text-4xl hover:scale-110 transition-transform">
                    <input type="radio" value={emoji} {...register('avatar')} className="hidden" />
                    <span className={watchAllFields.avatar === emoji ? "ring-2 ring-emerald-500 rounded-full p-1" : "p-1"}>{emoji}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>Height</label>
              <div className="flex gap-2">
                <div className="w-1/2">
                  <input type="number" placeholder="Ft" {...register('heightFt')} className={inputClass} />
                </div>
                <div className="w-1/2">
                  <input type="number" placeholder="In" {...register('heightIn')} className={inputClass} />
                </div>
              </div>
            </div>
            <div>
              <label className={labelClass}>Weight (lbs)</label>
              <input type="number" {...register('weightLbs')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Age</label>
              <input type="number" {...register('age')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Sex</label>
              <select {...register('sex')} className={inputClass}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Activity Level</label>
              <select {...register('activityLevel')} className={inputClass}>
                <option value="sedentary">Sedentary (Office job, little exercise)</option>
                <option value="light">Light (Exercise 1-3 days/wk)</option>
                <option value="moderate">Moderate (Exercise 3-5 days/wk)</option>
                <option value="active">Active (Exercise 6-7 days/wk)</option>
                <option value="very_active">Very Active (Physical job + exercise)</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Goal</label>
              <select {...register('goal')} className={inputClass}>
                <option value="Lean & Toned">Lean & Toned</option>
                <option value="Build Muscle">Build Muscle</option>
                <option value="Athletic Performance">Athletic Performance</option>
                <option value="Lose Weight">Lose Weight</option>
                <option value="General Fitness">General Fitness</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Equipment Available</label>
              <select {...register('equipment')} className={inputClass}>
                <option value="none">None (Bodyweight)</option>
                <option value="home">Home (Dumbbells/Bands)</option>
                <option value="gym">Full Gym</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Days per week available</label>
              <input type="number" min="1" max="7" {...register('daysAvailable')} className={inputClass} />
            </div>
          </div>

          {/* Live Stats UI */}
          <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 flex items-center justify-around">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400">{bmi}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Est. BMI</div>
            </div>
            <div className="w-px h-12 bg-slate-800"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-400">{tdee}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Target Calories (TDEE)</div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] disabled:opacity-50"
          >
            {isPending ? 'Generating Quest Line...' : 'Start Your Quest'}
          </button>
        </form>
      </div>
    </div>
  );
}
