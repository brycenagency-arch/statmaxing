'use client';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts';

interface Props {
  data?: { month: string, count: number }[];
  totalWorkouts?: number;
  totalCalories?: number;
}

export function WorkoutHistory({ data = [], totalWorkouts = 0, totalCalories = 0 }: Props) {
  const currentMonthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-[#1e2433] border border-slate-800/50 rounded-3xl p-6 shadow-2xl mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white tracking-wide">{currentMonthYear}</h2>
        <div className="text-slate-400">•••</div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[#0f1115] rounded-2xl p-4 border border-slate-800/50 text-center">
          <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Workouts</div>
          <div className="text-4xl font-black text-[#a3e635]">{totalWorkouts}</div>
          <p className="text-xs text-slate-400 mt-2">
            {totalWorkouts === 0 ? "You haven't worked out yet." : `You worked out ${totalWorkouts} times this month.`}
          </p>
        </div>
        
        <div className="bg-[#0f1115] rounded-2xl p-4 border border-slate-800/50 text-center flex flex-col justify-center">
          <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Calories</div>
          <div className="text-4xl font-black text-rose-500">{totalCalories.toLocaleString()}</div>
        </div>
      </div>

      <div className="h-40">
        {data.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-xl text-slate-500">
            <span className="text-3xl mb-2">📊</span>
            <p className="font-medium">No workout history.</p>
            <p className="text-sm mt-1">Complete a workout to see stats.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="month" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{ fill: '#334155', opacity: 0.4 }}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f8fafc' }}
              />
              <Bar dataKey="count" fill="#a3e635" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
