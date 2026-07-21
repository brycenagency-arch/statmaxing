'use client';
import { useState } from 'react';
import { MacroRing } from '@/components/ui/MacroRing';
import { motion } from 'framer-motion';
import { Plus, Droplets, CheckCircle2, Circle, X } from 'lucide-react';
import { getClientState, saveClientState } from '@/lib/clientDb';

export function FuelClient({ dailyLog, waterLog, user, tdee }: any) {
  const [mealType, setMealType] = useState('');
  const [waterOz, setWaterOz] = useState(waterLog.amountOz);
  const [loading, setLoading] = useState(false);
  const [foodLogsList, setFoodLogsList] = useState<any[]>(dailyLog.foodLogs);

  const refreshState = (state: any) => {
    const today = new Date().toISOString().split('T')[0];
    const log = state.foodLogs.filter((l: any) => l.dateString === today).map((l: any) => {
      const food = state.foods.find((f: any) => f.id === l.foodId);
      return { ...l, food };
    });
    setFoodLogsList(log);
  };

  // Calculate totals
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  foodLogsList.forEach((log: any) => {
    if (log.food) {
      totals.calories += log.food.calories * log.quantity;
      totals.protein += log.food.protein * log.quantity;
      totals.carbs += log.food.carbs * log.quantity;
      totals.fat += log.food.fat * log.quantity;
    }
  });

  const targetProtein = Math.round(user.weight * 2.2);
  const targetCarbs = Math.round((tdee * 0.4) / 4);
  const targetFat = Math.round((tdee * 0.3) / 9);

  const handleAddWater = () => {
    const next = waterOz + 8;
    setWaterOz(next);
    
    const state = getClientState();
    const today = new Date().toISOString().split('T')[0];
    const idx = state.waterLogs.findIndex(w => w.dateString === today);
    if (idx !== -1) {
      state.waterLogs[idx].amountOz = next;
    } else {
      state.waterLogs.push({ id: Math.random().toString(36).slice(2, 10), dateString: today, amountOz: next });
    }
    saveClientState(state);
  };

  const handleSubWater = () => {
    const next = Math.max(0, waterOz - 8);
    setWaterOz(next);

    const state = getClientState();
    const today = new Date().toISOString().split('T')[0];
    const idx = state.waterLogs.findIndex(w => w.dateString === today);
    if (idx !== -1) {
      state.waterLogs[idx].amountOz = next;
      saveClientState(state);
    }
  };

  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const todayIdx = new Date().getDay();

  return (
    <div className="max-w-md mx-auto space-y-6 pb-24">
      
      {/* Calendar Header */}
      <div className="bg-[#1e2433] rounded-3xl p-6 shadow-xl border border-slate-800/50">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-black text-white">Today ▾</h1>
          <div className="text-sm font-bold text-slate-400">🔥 0 Day Streak</div>
        </div>
        
        <div className="flex justify-between items-center px-2">
          {days.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <span className="text-xs font-bold text-slate-500">{d}</span>
              {i === todayIdx ? (
                <CheckCircle2 className="w-5 h-5 text-white" />
              ) : (
                <Circle className="w-5 h-5 text-slate-700" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Calories Card */}
      <div className="bg-[#1e2433] rounded-3xl p-6 shadow-xl border border-slate-800/50">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Calories</h2>
        <div className="flex justify-between items-end mb-4">
          <div>
            <span className="text-4xl font-black text-white">{Math.round(totals.calories)}</span>
            <span className="text-sm font-bold text-slate-400"> cal / {tdee}</span>
          </div>
          <div className="text-sm font-bold text-slate-400">{Math.max(0, tdee - Math.round(totals.calories))} left</div>
        </div>
        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (totals.calories / tdee) * 100)}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"
          />
        </div>
      </div>

      {/* Macro Rings & Water */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#1e2433] rounded-3xl p-6 shadow-xl border border-slate-800/50 flex justify-between items-center">
          <MacroRing label="Carbs" current={totals.carbs} target={targetCarbs} color="#06b6d4" size={56} />
          <MacroRing label="Fat" current={totals.fat} target={targetFat} color="#d946ef" size={56} />
          <MacroRing label="Protein" current={totals.protein} target={targetProtein} color="#f59e0b" size={56} />
        </div>
        
        <div className="bg-[#1e2433] rounded-3xl p-6 shadow-xl border border-slate-800/50 flex flex-col items-center justify-center relative">
          <Droplets className="w-8 h-8 text-cyan-400 mb-2" />
          <div className="text-2xl font-black text-white">{waterOz}<span className="text-sm text-slate-500">oz</span></div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Water</div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleSubWater} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors text-white">
              <span className="text-lg font-bold leading-none">-</span>
            </button>
            <button onClick={handleAddWater} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors text-white">
              <span className="text-lg font-bold leading-none">+</span>
            </button>
          </div>
        </div>
      </div>

      {/* Diary Sections */}
      <div className="space-y-4">
        {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map((meal) => (
          <div key={meal} className="bg-[#1e2433] rounded-3xl p-6 shadow-xl border border-slate-800/50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-white">{meal}</h3>
              <button 
                onClick={() => setMealType(meal)} 
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              {foodLogsList.filter((l: any) => l.mealType === meal).map((log: any) => (
                <div key={log.id} className="flex justify-between items-center bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50">
                  <div>
                    <div className="font-bold text-white text-sm">{log.food?.name}</div>
                    <div className="text-slate-500 text-xs mt-1">{log.quantity} x {log.food?.servingSize}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-blue-400">{Math.round((log.food?.calories || 0) * log.quantity)} <span className="text-xs text-slate-500">cal</span></div>
                  </div>
                </div>
              ))}
              {foodLogsList.filter((l: any) => l.mealType === meal).length === 0 && (
                <div className="text-sm text-slate-500 italic py-2 text-center">No foods logged.</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Food Modal */}
      {mealType !== '' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1e2433] w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-800"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Add to {mealType}</h2>
              <button onClick={() => setMealType('')} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                setLoading(true);
                const formData = new FormData(e.currentTarget);
                const customFood = {
                  id: Math.random().toString(36).slice(2, 10),
                  name: formData.get('name') as string,
                  calories: Number(formData.get('calories')),
                  protein: Number(formData.get('protein')),
                  carbs: Number(formData.get('carbs')),
                  fat: Number(formData.get('fat')),
                  fiber: 0,
                  servingSize: '1 serving',
                  isCustom: true,
                  isFavorite: false
                };

                const state = getClientState();
                state.foods.push(customFood);

                const today = new Date().toISOString().split('T')[0];
                state.foodLogs.push({
                  id: Math.random().toString(36).slice(2, 10),
                  dateString: today,
                  foodId: customFood.id,
                  mealType: mealType,
                  quantity: 1,
                  consumedAt: new Date().toISOString()
                });

                saveClientState(state);
                refreshState(state);
                setLoading(false);
                setMealType('');
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Food Name</label>
                <input required name="name" type="text" className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-cyan-500" placeholder="e.g. Chicken Breast" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Calories</label>
                  <input required name="calories" type="number" className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500" placeholder="0" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Protein (g)</label>
                  <input required name="protein" type="number" className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-amber-500" placeholder="0" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Carbs (g)</label>
                  <input required name="carbs" type="number" className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-cyan-500" placeholder="0" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Fat (g)</label>
                  <input required name="fat" type="number" className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-fuchsia-500" placeholder="0" />
                </div>
              </div>
              <button 
                disabled={loading}
                type="submit" 
                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-colors"
              >
                {loading ? 'Adding...' : 'Add Food'}
              </button>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
