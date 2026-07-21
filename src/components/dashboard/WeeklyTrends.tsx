'use client';
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface WeeklyTrendsProps {
  data: any[];
  targetCalories: number;
}

export function WeeklyTrends({ data, targetCalories }: WeeklyTrendsProps) {
  const [metric, setMetric] = useState<'calories' | 'protein' | 'carbs' | 'fat'>('calories');

  const metricColors = {
    calories: '#34d399', // emerald
    protein: '#3b82f6',  // blue
    carbs: '#f59e0b',    // amber
    fat: '#ef4444'       // red
  };

  const getTarget = () => {
    if (metric === 'calories') return targetCalories;
    // VERY rough mock targets for visual purposes based on tdee
    if (metric === 'protein') return Math.round((targetCalories * 0.3) / 4);
    if (metric === 'carbs') return Math.round((targetCalories * 0.4) / 4);
    return Math.round((targetCalories * 0.3) / 9);
  };

  return (
    <div className="w-full beveled-card p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-display tracking-widest text-white uppercase">7-Day Trends</h3>
        <div className="flex gap-2">
          {['calories', 'protein', 'carbs', 'fat'].map(m => (
            <button 
              key={m}
              onClick={() => setMetric(m as any)}
              className={`px-3 py-1 text-xs rounded-full capitalize font-medium transition-colors ${metric === m ? 'bg-slate-700 text-slate-100' : 'bg-slate-950 text-slate-500 hover:text-slate-300'}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      
      <div className="h-72">
        {data.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-xl text-slate-500">
            <span className="text-3xl mb-2">📊</span>
            <p className="font-medium">No data logged yet.</p>
            <p className="text-sm mt-1">Start tracking to see trends.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="date" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f8fafc' }}
                itemStyle={{ color: metricColors[metric] }}
              />
              <ReferenceLine y={getTarget()} stroke="#94a3b8" strokeDasharray="3 3" label={{ value: 'Target', fill: '#94a3b8', fontSize: 12, position: 'insideTopLeft' }} />
              <Line type="monotone" dataKey={metric} stroke={metricColors[metric]} strokeWidth={3} dot={{ r: 4, fill: metricColors[metric], strokeWidth: 0 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
