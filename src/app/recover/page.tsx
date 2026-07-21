'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getClientState, FitQuestState, DEFAULT_ROUTINES, DEFAULT_EXERCISES } from '@/lib/clientDb';
import { RecoverClient } from './RecoverClient';

export default function RecoverPage() {
  const router = useRouter();
  const [state, setState] = useState<FitQuestState | null>(null);

  useEffect(() => {
    const s = getClientState();
    if (!s.user) {
      router.replace('/onboarding');
      return;
    }
    setState(s);
  }, [router]);

  if (!state || !state.user) return null;

  // Suggestion logic
  let suggestedMassageId = null;
  let suggestedStretchId = null;
  
  // Find latest completed workout exercise target group
  const completedWorkouts = state.workouts.filter(w => w.isCompleted);
  let latestMuscleGroup: string | null = null;
  
  if (completedWorkouts.length > 0) {
    const latestWorkout = completedWorkouts[completedWorkouts.length - 1];
    if (latestWorkout.exercises.length > 0) {
      const firstExLog = latestWorkout.exercises[0];
      const exDef = DEFAULT_EXERCISES.find(e => e.id === firstExLog.exerciseId);
      if (exDef) {
        latestMuscleGroup = exDef.targetMuscleGroup;
      }
    }
  }

  if (latestMuscleGroup) {
    const recommended = DEFAULT_ROUTINES.filter(r => {
      try {
        const groups = JSON.parse(r.relatedMuscleGroups);
        return groups.includes(latestMuscleGroup);
      } catch (e) {
        return false;
      }
    });

    suggestedMassageId = recommended.find(r => r.type === 'massage')?.id || null;
    suggestedStretchId = recommended.find(r => r.type === 'stretch')?.id || null;
  }

  const massages = DEFAULT_ROUTINES.filter(r => r.type === 'massage');
  const stretches = DEFAULT_ROUTINES.filter(r => r.type === 'stretch');

  if (!suggestedMassageId && massages.length > 0) suggestedMassageId = massages[0].id;
  if (!suggestedStretchId && stretches.length > 0) suggestedStretchId = stretches[0].id;

  const suggestions = { massage: suggestedMassageId, stretch: suggestedStretchId };

  return (
    <div className="flex-1 p-4 md:p-8 font-sans">
      <RecoverClient routines={DEFAULT_ROUTINES} userId={state.user.id} suggestions={suggestions} />
    </div>
  );
}
