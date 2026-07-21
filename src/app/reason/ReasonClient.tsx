'use client';
import { useEffect, useRef, useState } from 'react';
import { Plus, Trash, Check, X, Archive, RotateCcw, Calendar, CheckSquare, FileText, History, Edit2, ChevronDown, ChevronRight, Info, Clock } from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────── */
interface ReasonEntry {
  id: string;
  name: string;
  content: string;
  updatedAt: string;
}

interface ChecklistTask {
  id: string;
  title: string;
  description?: string;
}

interface WeeklyLogRecord {
  id: string;
  dateRange: string;
  scorePercent: number;
  totalCompleted: number;
  totalPossible: number;
  createdAt: string;
}

interface DailyLogRecord {
  id: string;
  dateStr: string;
  dayName: string;
  slots: { hour: string; planned: string; actual: string }[];
  createdAt: string;
}

interface ReasonState {
  reasons: ReasonEntry[];
  tasks: ChecklistTask[];
  weeklyChecks: Record<string, boolean>; // key: `${dayIdx}_${taskId}`
  archivedWeeks: WeeklyLogRecord[];
  archivedDays: DailyLogRecord[];
  hourlyPlan: Record<string, string>; // key: `${dayIdx}_${hourStr}`
  hourlyActual: Record<string, string>; // key: `${dayIdx}_${hourStr}`
}

/* ─── Config ─────────────────────────────────────────────── */
const STORAGE_KEY = 'reason-state';
const CORRECT_PASSWORD = 'BRAVE';
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function uid() { return Math.random().toString(36).slice(2, 10); }

const DEFAULT_TASKS: ChecklistTask[] = [
  { id: 't1', title: 'Morning Routine', description: '• Drink 32oz cold water\n• 10 min mobility stretch\n• Take daily vitamins' },
  { id: 't2', title: 'Deep Work Session (2+ Hours)', description: '• Phone on Do Not Disturb\n• Zero tabs/distractions' },
  { id: 't3', title: 'Workout / Training', description: '• Push your limits\n• Hydrate post-workout' },
  { id: 't4', title: 'Nightly Review', description: '• Clear desk & review tomorrow\'s goals' }
];

function sanitizeReasonState(raw: any): ReasonState {
  if (!raw || typeof raw !== 'object') {
    return {
      reasons: [
        { id: 'r1', name: 'My Core Purpose', content: 'Write down why you started and what drives you every day...', updatedAt: new Date().toISOString() },
        { id: 'r2', name: 'Legacy', content: 'What mark do you want to leave behind?', updatedAt: new Date().toISOString() }
      ],
      tasks: DEFAULT_TASKS,
      weeklyChecks: {},
      archivedWeeks: [],
      archivedDays: [],
      hourlyPlan: {},
      hourlyActual: {}
    };
  }

  return {
    reasons: Array.isArray(raw.reasons) ? raw.reasons : [],
    tasks: Array.isArray(raw.tasks) && raw.tasks.length ? raw.tasks : DEFAULT_TASKS,
    weeklyChecks: raw.weeklyChecks && typeof raw.weeklyChecks === 'object' ? raw.weeklyChecks : {},
    archivedWeeks: Array.isArray(raw.archivedWeeks) ? raw.archivedWeeks : [],
    archivedDays: Array.isArray(raw.archivedDays) ? raw.archivedDays : [],
    hourlyPlan: raw.hourlyPlan && typeof raw.hourlyPlan === 'object' ? raw.hourlyPlan : {},
    hourlyActual: raw.hourlyActual && typeof raw.hourlyActual === 'object' ? raw.hourlyActual : {}
  };
}

function loadState(): ReasonState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return sanitizeReasonState(JSON.parse(raw));
    }
  } catch { /* fresh start */ }
  return sanitizeReasonState(null);
}

function saveState(s: ReasonState) {
  try {
    const cleanState = sanitizeReasonState(s);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanState));
    
    // Background sync to Supabase
    import('@/lib/supabaseClient').then(({ supabase }) => {
      supabase.from('StateBackup').upsert({
        key: STORAGE_KEY,
        data: cleanState,
        updatedAt: new Date().toISOString()
      }).then(({ error }) => {
        if (error) console.warn('Supabase Reason sync error:', error.message);
      });
    });
  } catch { /* ignore */ }
}

function syncReasonFromSupabase(onSyncComplete?: (state: ReasonState) => void) {
  if (typeof window === 'undefined') return;
  import('@/lib/supabaseClient').then(({ supabase }) => {
    supabase.from('StateBackup').select('*').eq('key', STORAGE_KEY).single().then(({ data, error }) => {
      if (data && data.data) {
        const cleanState = sanitizeReasonState(data.data);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanState));
        if (onSyncComplete) onSyncComplete(cleanState);
      }
    });
  });
}

/* ═══════════════════════════════════════════════════════════
   PROGRESS RING COMPONENT
═══════════════════════════════════════════════════════════ */
function ProgressRing({ percent, label }: { percent: number; label: string }) {
  const radius = 18;
  const stroke = 3.5;
  const normalizedRadius = radius - stroke * 0.5;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="pb-progress-wrap">
      <svg height={radius * 2} width={radius * 2} className="pb-ring-svg">
        <circle
          stroke="rgba(237,230,214,0.1)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="#e8a33d"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.35s ease-in-out' }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div className="pb-ring-text">{percent}%</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PASSWORD GATE
═══════════════════════════════════════════════════════════ */
function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [value, setValue] = useState('');
  const [shake, setShake] = useState(false);
  const [error, setError] = useState('');

  function attempt() {
    if (value === CORRECT_PASSWORD) {
      onUnlock();
    } else {
      setError('Incorrect password.');
      setShake(true);
      setTimeout(() => setShake(false), 600);
      setValue('');
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Special+Elite&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
        body {
          background: #1b2229 !important;
          background-image: none !important;
          animation: none !important;
        }
        main {
          padding-top: 0 !important;
          padding-bottom: 0 !important;
        }
        .pb-gate-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #1b2229;
          font-family: 'IBM Plex Sans', sans-serif;
        }
        .pb-gate-card {
          background: #222b34;
          border: 1px solid rgba(237,230,214,0.12);
          border-radius: 12px;
          padding: 44px 52px;
          text-align: center;
          max-width: 380px;
          width: 100%;
          margin: 24px;
        }
        .pb-gate-title {
          font-family: 'Special Elite', monospace;
          font-size: 28px;
          letter-spacing: 3px;
          color: #e8a33d;
          margin-bottom: 6px;
        }
        .pb-gate-sub {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          color: #93a0a8;
          letter-spacing: 2px;
          margin-bottom: 32px;
        }
        .pb-gate-input {
          width: 100%;
          background: #262f39;
          border: 1px solid rgba(237,230,214,0.18);
          color: #ede6d6;
          padding: 12px 14px;
          border-radius: 7px;
          font-size: 16px;
          font-family: 'IBM Plex Mono', monospace;
          letter-spacing: 3px;
          text-align: center;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .pb-gate-input:focus { border-color: #e8a33d; }
        .pb-gate-btn {
          margin-top: 14px;
          width: 100%;
          background: #e8a33d;
          color: #1b2229;
          border: none;
          border-radius: 7px;
          padding: 12px;
          font-size: 14px;
          font-weight: 700;
          font-family: 'IBM Plex Mono', monospace;
          letter-spacing: 2px;
          cursor: pointer;
          transition: filter 0.15s;
        }
        .pb-gate-btn:hover { filter: brightness(1.1); }
        .pb-gate-error {
          margin-top: 10px;
          font-size: 12px;
          color: #c1614a;
          font-family: 'IBM Plex Mono', monospace;
          min-height: 18px;
        }
        @keyframes pb-shake {
          0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)}
        }
        .pb-shake { animation: pb-shake 0.5s ease; }
        .pb-jack-row { display:flex; justify-content:center; gap:10px; margin-bottom:24px; }
        .pb-jack-dot { width:10px;height:10px;border-radius:50%;border:1.5px solid #93a0a8; }
        .pb-jack-dot.lit { background:#e8a33d;border-color:#e8a33d;box-shadow:0 0 8px #e8a33d; }
      `}</style>
      <div className="pb-gate-root">
        <div className={`pb-gate-card${shake ? ' pb-shake' : ''}`}>
          <div className="pb-jack-row">
            {[0,1,2,3,4].map(i => <div key={i} className={`pb-jack-dot${i === 2 ? ' lit' : ''}`}/>)}
          </div>
          <div className="pb-gate-title">REASON</div>
          <div className="pb-gate-sub">WHY I DO WHAT I DO</div>
          <input
            className="pb-gate-input"
            type="password"
            placeholder="••••••"
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && attempt()}
            autoFocus
          />
          <button className="pb-gate-btn" onClick={attempt}>UNLOCK</button>
          <div className="pb-gate-error">{error}</div>
        </div>
      </div>
    </>
  );
}

function getCurrentDayIdx(): number {
  const jsDay = new Date().getDay(); // 0 is Sun, 1 is Mon...
  return jsDay === 0 ? 6 : jsDay - 1;
}

const HOURS_3AM_TO_12AM = [
  '3:00 AM', '4:00 AM', '5:00 AM', '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM',
  '9:00 PM', '10:00 PM', '11:00 PM', '12:00 AM'
];

/* ═══════════════════════════════════════════════════════════
   MAIN REASON APP
═══════════════════════════════════════════════════════════ */
function ReasonApp() {
  const [appState, setAppState] = useState<ReasonState>({ reasons: [], tasks: [], weeklyChecks: {}, archivedWeeks: [], archivedDays: [], hourlyPlan: {}, hourlyActual: {} });
  const [selectedId, setSelectedId] = useState<string>('daily-checklist');
  const [addingEntry, setAddingEntry] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskText, setEditingTaskText] = useState('');
  const [editingTaskDesc, setEditingTaskDesc] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [expandedTaskIds, setExpandedTaskIds] = useState<Record<string, boolean>>({});
  const [planDayIdx, setPlanDayIdx] = useState<number>(getCurrentDayIdx);
  const newNameRef = useRef<HTMLInputElement>(null);
  const newTaskRef = useRef<HTMLInputElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const s = loadState();
    setAppState(s);
    
    // Sync from Supabase
    syncReasonFromSupabase((cloudState) => {
      setAppState(cloudState);
    });
  }, []);

  useEffect(() => {
    if (addingEntry) setTimeout(() => newNameRef.current?.focus(), 0);
  }, [addingEntry]);

  useEffect(() => {
    if (addingTask) setTimeout(() => newTaskRef.current?.focus(), 0);
  }, [addingTask]);

  function scheduleSave(s: ReasonState) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveState(s), 300);
  }

  function mutate(fn: (draft: ReasonState) => void) {
    setAppState(prev => {
      const next = JSON.parse(JSON.stringify(prev)) as ReasonState;
      fn(next);
      scheduleSave(next);
      return next;
    });
  }

  /* --- Reason Management --- */
  function addReason() {
    const name = newName.trim();
    if (!name) return;
    const id = uid();
    mutate(s => {
      s.reasons.push({ id, name, content: '', updatedAt: new Date().toISOString() });
    });
    setSelectedId(id);
    setNewName('');
    setAddingEntry(false);
  }

  function deleteReason(id: string) {
    mutate(s => { s.reasons = s.reasons.filter(r => r.id !== id); });
    if (selectedId === id) {
      setSelectedId('daily-checklist');
    }
    setConfirmDeleteId(null);
  }

  function updateContent(val: string) {
    mutate(s => {
      const r = s.reasons.find(r => r.id === selectedId);
      if (r) {
        r.content = val;
        r.updatedAt = new Date().toISOString();
      }
    });
  }

  /* --- Checklist Task Management --- */
  function addTask() {
    const title = newTaskTitle.trim();
    if (!title) return;
    mutate(s => {
      s.tasks.push({ id: uid(), title, description: newTaskDesc.trim() || undefined });
    });
    setNewTaskTitle('');
    setNewTaskDesc('');
    setAddingTask(false);
  }

  function saveEditedTask(taskId: string) {
    const text = editingTaskText.trim();
    if (!text) return;
    mutate(s => {
      const t = s.tasks.find(item => item.id === taskId);
      if (t) {
        t.title = text;
        t.description = editingTaskDesc.trim() || undefined;
      }
    });
    setEditingTaskId(null);
    setEditingTaskText('');
    setEditingTaskDesc('');
  }

  function deleteTask(taskId: string) {
    mutate(s => {
      s.tasks = s.tasks.filter(t => t.id !== taskId);
      // Clean up checks for this task
      Object.keys(s.weeklyChecks).forEach(key => {
        if (key.endsWith(`_${taskId}`)) {
          delete s.weeklyChecks[key];
        }
      });
    });
  }

  function toggleCheck(dayIdx: number, taskId: string) {
    const key = `${dayIdx}_${taskId}`;
    mutate(s => {
      if (s.weeklyChecks[key]) {
        delete s.weeklyChecks[key];
      } else {
        s.weeklyChecks[key] = true;
      }
    });
  }

  function updateHourlySlot(dayIdx: number, hourStr: string, text: string) {
    const key = `${dayIdx}_${hourStr}`;
    mutate(s => {
      if (!text.trim()) {
        delete s.hourlyPlan[key];
      } else {
        s.hourlyPlan[key] = text;
      }
    });
  }

  function updateHourlyActualSlot(dayIdx: number, hourStr: string, text: string) {
    const key = `${dayIdx}_${hourStr}`;
    mutate(s => {
      if (!text.trim()) {
        delete s.hourlyActual[key];
      } else {
        s.hourlyActual[key] = text;
      }
    });
  }

  function logCurrentDayPlanAndDebrief() {
    const hours = HOURS_3AM_TO_12AM;

    const dayName = DAYS[planDayIdx];
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    const slots = hours.map(h => {
      const k = `${planDayIdx}_${h}`;
      return {
        hour: h,
        planned: appState.hourlyPlan[k] || '',
        actual: appState.hourlyActual[k] || ''
      };
    }).filter(s => s.planned || s.actual);

    if (slots.length === 0) return;

    mutate(s => {
      s.archivedDays.unshift({
        id: uid(),
        dateStr,
        dayName,
        slots,
        createdAt: new Date().toISOString()
      });
    });

    setSelectedId('weekly-logs');
  }

  function deleteDailyLogRecord(logId: string) {
    mutate(s => {
      s.archivedDays = s.archivedDays.filter(d => d.id !== logId);
    });
  }

  /* --- Reset & Save Week History --- */
  function resetAndSaveWeek() {
    const totalTasks = appState.tasks.length;
    if (totalTasks === 0) return;

    const totalPossible = totalTasks * 7;
    let totalCompleted = 0;

    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      for (const t of appState.tasks) {
        if (appState.weeklyChecks[`${dayIdx}_${t.id}`]) {
          totalCompleted++;
        }
      }
    }

    const scorePercent = Math.round((totalCompleted / totalPossible) * 100);
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    mutate(s => {
      s.archivedWeeks.unshift({
        id: uid(),
        dateRange: `Week of ${dateStr}`,
        scorePercent,
        totalCompleted,
        totalPossible,
        createdAt: new Date().toISOString()
      });
      // Clear current week checks
      s.weeklyChecks = {};
    });

    setSelectedId('weekly-logs');
  }

  function deleteLogRecord(logId: string) {
    mutate(s => {
      s.archivedWeeks = s.archivedWeeks.filter(l => l.id !== logId);
    });
  }

  const selectedReason = appState.reasons.find(r => r.id === selectedId) || null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Special+Elite&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
        body {
          background: #1b2229 !important;
          background-image: none !important;
          animation: none !important;
        }
        main {
          padding-top: 0 !important;
          padding-bottom: 0 !important;
        }
        :root {
          --pb-bg: #1b2229;
          --pb-panel: #222b34;
          --pb-panel-2: #262f39;
          --pb-amber: #e8a33d;
          --pb-teal: #5c8b93;
          --pb-cream: #ede6d6;
          --pb-muted: #93a0a8;
          --pb-red: #c1614a;
          --pb-border: rgba(237,230,214,0.12);
        }
        .pb-wrap {
          font-family: 'IBM Plex Sans', sans-serif;
          background: var(--pb-bg);
          color: var(--pb-cream);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .pb-header {
          padding: 20px 28px 16px;
          border-bottom: 1px solid var(--pb-border);
        }
        .pb-title {
          font-family: 'Special Elite', monospace;
          font-size: 24px;
          letter-spacing: 2px;
          color: var(--pb-amber);
        }
        .pb-sub {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: var(--pb-muted);
          letter-spacing: 1px;
          margin-top: 2px;
        }
        .pb-body {
          display: flex;
          flex: 1;
          min-height: 600px;
        }
        .pb-sidebar {
          width: 250px;
          border-right: 1px solid var(--pb-border);
          padding: 18px 0;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }
        .pb-sidebar-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 2px;
          color: var(--pb-muted);
          padding: 14px 20px 8px;
        }
        .pb-sidebar-label:first-child { padding-top: 0; }
        .pb-line {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 20px;
          cursor: pointer;
          border-left: 2px solid transparent;
          transition: background 0.12s;
        }
        .pb-line:hover { background: var(--pb-panel); }
        .pb-line.active { background: var(--pb-panel); border-left: 2px solid var(--pb-amber); }
        .pb-jack {
          width: 10px; height: 10px;
          border-radius: 50%;
          border: 1.5px solid var(--pb-muted);
          flex-shrink: 0;
          transition: all 0.2s;
        }
        .pb-line.active .pb-jack {
          background: var(--pb-amber);
          border-color: var(--pb-amber);
          box-shadow: 0 0 6px var(--pb-amber);
        }
        .pb-line-name { font-size: 13.5px; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: flex; align-items: center; gap: 8px; }
        .pb-line-del {
          opacity: 0;
          color: var(--pb-muted);
          background: none;
          border: none;
          cursor: pointer;
          padding: 2px;
          display: flex;
          transition: opacity 0.15s;
        }
        .pb-line:hover .pb-line-del { opacity: 1; }
        .pb-add {
          margin: 8px 20px 0;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          color: var(--pb-teal);
          background: none;
          border: 1px dashed var(--pb-border);
          border-radius: 6px;
          padding: 8px 10px;
          cursor: pointer;
          width: calc(100% - 40px);
          transition: border-color 0.15s;
          font-family: 'IBM Plex Sans', sans-serif;
        }
        .pb-add:hover { border-color: var(--pb-teal); }
        .pb-add-form { margin: 8px 20px 0; display: flex; gap: 6px; }
        .pb-input {
          background: var(--pb-panel-2);
          border: 1px solid var(--pb-border);
          color: var(--pb-cream);
          padding: 8px 10px;
          border-radius: 5px;
          font-size: 13px;
          font-family: 'IBM Plex Sans', sans-serif;
          width: 100%;
          outline: none;
        }
        .pb-main { flex: 1; padding: 24px 28px; display: flex; flex-direction: column; overflow-y: auto; }
        .pb-empty { color: var(--pb-muted); font-size: 14px; margin-top: 40px; text-align: center; }
        .pb-main-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .pb-main-name { font-family: 'Special Elite', monospace; font-size: 22px; color: var(--pb-amber); letter-spacing: 1px; display: flex; align-items: center; gap: 10px; }
        .pb-textbox {
          flex: 1;
          width: 100%;
          min-height: 480px;
          background: var(--pb-panel);
          border: 1px solid var(--pb-border);
          color: var(--pb-cream);
          padding: 20px 24px;
          border-radius: 8px;
          font-size: 15px;
          line-height: 1.7;
          font-family: 'IBM Plex Sans', sans-serif;
          resize: none;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }
        .pb-textbox:focus { border-color: var(--pb-amber); }
        .pb-confirm-bar { display: flex; align-items: center; gap: 4px; }
        .pb-icon-btn {
          background: none;
          border: 1px solid var(--pb-border);
          color: var(--pb-muted);
          border-radius: 5px;
          padding: 7px 10px;
          cursor: pointer;
          flex-shrink: 0;
          display: flex;
          align-items: center;
        }
        .pb-btn-action {
          background: var(--pb-amber);
          color: #1b2229;
          border: none;
          font-weight: 600;
          font-size: 12.5px;
          padding: 8px 14px;
          border-radius: 6px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: 'IBM Plex Mono', monospace;
          letter-spacing: 0.5px;
          transition: filter 0.15s;
        }
        .pb-btn-action:hover { filter: brightness(1.1); }

        /* ─── 7-Day Grid ─── */
        .pb-grid-cols {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 12px;
          flex: 1;
          min-width: 780px;
        }
        .pb-day-col {
          background: var(--pb-panel);
          border: 1px solid var(--pb-border);
          border-radius: 8px;
          padding: 14px 10px;
          display: flex;
          flex-direction: column;
        }
        .pb-day-header {
          text-align: center;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--pb-border);
          margin-bottom: 12px;
        }
        .pb-day-name {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 13px;
          font-weight: 600;
          color: var(--pb-cream);
          margin-bottom: 8px;
          letter-spacing: 1px;
        }
        .pb-progress-wrap {
          position: relative;
          width: 36px;
          height: 36px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pb-ring-svg { transform: rotate(-90deg); }
        .pb-ring-text {
          position: absolute;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          color: var(--pb-amber);
          font-weight: 600;
        }
        .pb-task-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
        }
        .pb-task-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 8px;
          background: var(--pb-panel-2);
          border: 1px solid var(--pb-border);
          border-radius: 6px;
          cursor: pointer;
          transition: border-color 0.15s;
          user-select: none;
        }
        .pb-task-item:hover { border-color: var(--pb-amber); }
        .pb-task-item.checked {
          background: rgba(232,163,61,0.08);
          border-color: rgba(232,163,61,0.4);
        }
        .pb-task-check {
          width: 14px; height: 14px;
          border-radius: 3px;
          border: 1.5px solid var(--pb-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 2px;
          flex-shrink: 0;
        }
        .pb-task-item.checked .pb-task-check {
          background: var(--pb-amber);
          border-color: var(--pb-amber);
          color: #1b2229;
        }
        .pb-task-title {
          font-size: 12px;
          color: var(--pb-cream);
          line-height: 1.35;
          word-break: break-word;
        }
        .pb-task-item.checked .pb-task-title {
          color: var(--pb-muted);
          text-decoration: line-through;
        }
        .pb-task-mgr {
          background: var(--pb-panel);
          border: 1px solid var(--pb-border);
          border-radius: 8px;
          padding: 16px;
          margin-top: 16px;
        }
        .pb-task-mgr-title {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: var(--pb-teal);
          letter-spacing: 1px;
          margin-bottom: 12px;
          text-transform: uppercase;
        }
        .pb-task-mgr-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: var(--pb-panel-2);
          border: 1px solid var(--pb-border);
          border-radius: 6px;
          margin-bottom: 8px;
          font-size: 13px;
        }

        /* ─── Logs / History View ─── */
        .pb-log-card {
          background: var(--pb-panel);
          border: 1px solid var(--pb-border);
          border-radius: 8px;
          padding: 18px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .pb-log-title { font-family: 'IBM Plex Mono', monospace; font-size: 15px; color: var(--pb-cream); margin-bottom: 4px; }
        .pb-log-sub { font-size: 12px; color: var(--pb-muted); }
        .pb-log-score { font-family: 'Special Elite', monospace; font-size: 24px; color: var(--pb-amber); text-align: right; }

        @media (max-width: 900px) {
          .pb-body { flex-direction: column; }
          .pb-sidebar { width: 100%; border-right: none; border-bottom: 1px solid var(--pb-border); }
          .pb-grid-cols { overflow-x: auto; }
        }
      `}</style>

      <div className="pb-wrap">
        <div className="pb-header">
          <div className="pb-title">REASON</div>
          <div className="pb-sub">WHY I DO WHAT I DO</div>
        </div>

        <div className="pb-body">
          {/* Sidebar */}
          <div className="pb-sidebar">
            <div className="pb-sidebar-label">CHECKLIST &amp; LOGS</div>
            
            <div
              className={'pb-line' + (selectedId === 'daily-checklist' ? ' active' : '')}
              onClick={() => setSelectedId('daily-checklist')}
            >
              <div className="pb-jack" />
              <div className="pb-line-name">
                <CheckSquare size={14} color="var(--pb-amber)" /> Daily Checklist
              </div>
            </div>

            <div
              className={'pb-line' + (selectedId === 'daily-plan' ? ' active' : '')}
              onClick={() => setSelectedId('daily-plan')}
            >
              <div className="pb-jack" />
              <div className="pb-line-name">
                <Clock size={14} color="var(--pb-amber)" /> Daily Plan
              </div>
            </div>

            <div
              className={'pb-line' + (selectedId === 'weekly-logs' ? ' active' : '')}
              onClick={() => setSelectedId('weekly-logs')}
            >
              <div className="pb-jack" />
              <div className="pb-line-name">
                <History size={14} color="var(--pb-teal)" /> History Logs ({appState.archivedWeeks.length})
              </div>
            </div>

            <div className="pb-sidebar-label">MY REASONS</div>

            {appState.reasons.map(r => (
              <div
                key={r.id}
                className={'pb-line' + (r.id === selectedId ? ' active' : '')}
                onClick={() => { setSelectedId(r.id); setConfirmDeleteId(null); }}
              >
                <div className="pb-jack" />
                <div className="pb-line-name">
                  <FileText size={14} color="var(--pb-cream)" /> {r.name}
                </div>
                {confirmDeleteId === r.id ? (
                  <div className="pb-confirm-bar" onClick={e => e.stopPropagation()}>
                    <button className="pb-line-del" style={{ opacity: 1 }} onClick={() => deleteReason(r.id)}>
                      <Check size={14} color="var(--pb-red)" />
                    </button>
                    <button className="pb-line-del" style={{ opacity: 1 }} onClick={() => setConfirmDeleteId(null)}>
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    className="pb-line-del"
                    title="Remove"
                    onClick={e => { e.stopPropagation(); setConfirmDeleteId(r.id); }}
                  >
                    <Trash size={13} />
                  </button>
                )}
              </div>
            ))}

            {addingEntry ? (
              <div className="pb-add-form">
                <input
                  ref={newNameRef}
                  className="pb-input"
                  placeholder="Reason Title"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') addReason();
                    if (e.key === 'Escape') { setAddingEntry(false); setNewName(''); }
                  }}
                />
                <button className="pb-icon-btn" onClick={addReason}><Check size={14} /></button>
              </div>
            ) : (
              <button className="pb-add" onClick={() => setAddingEntry(true)}>
                <Plus size={14} /> New reason
              </button>
            )}
          </div>

          {/* Main Area */}
          <div className="pb-main">
            {selectedId === 'daily-checklist' && (
              <>
                <div className="pb-main-header">
                  <div className="pb-main-name">
                    <CheckSquare size={22} color="var(--pb-amber)" /> Daily Checklist
                  </div>
                  <button className="pb-btn-action" onClick={resetAndSaveWeek}>
                    <Archive size={14} /> Reset &amp; Archive Week
                  </button>
                </div>

                {/* 7-Day Grid */}
                <div style={{ overflowX: 'auto', paddingBottom: 12 }}>
                  <div className="pb-grid-cols">
                    {DAYS.map((dayName, dayIdx) => {
                      const totalTasks = appState.tasks.length;
                      let dayCompleted = 0;
                      if (totalTasks > 0) {
                        appState.tasks.forEach(t => {
                          if (appState.weeklyChecks[`${dayIdx}_${t.id}`]) dayCompleted++;
                        });
                      }
                      const percent = totalTasks > 0 ? Math.round((dayCompleted / totalTasks) * 100) : 0;

                      return (
                        <div key={dayName} className="pb-day-col">
                          <div className="pb-day-header">
                            <div className="pb-day-name">{dayName.toUpperCase()}</div>
                            <ProgressRing percent={percent} label={dayName} />
                          </div>

                          <div className="pb-task-list">
                            {appState.tasks.map(t => {
                              const checked = !!appState.weeklyChecks[`${dayIdx}_${t.id}`];
                              const isExpanded = !!expandedTaskIds[t.id];
                              const hasDesc = !!t.description;

                              return (
                                <div
                                  key={t.id}
                                  className={'pb-task-item' + (checked ? ' checked' : '')}
                                >
                                  <div
                                    className="pb-task-check"
                                    onClick={(e) => { e.stopPropagation(); toggleCheck(dayIdx, t.id); }}
                                    title={checked ? 'Mark uncompleted' : 'Mark completed'}
                                  >
                                    {checked && <Check size={10} />}
                                  </div>
                                  <div
                                    style={{ flex: 1, cursor: 'pointer' }}
                                    onClick={() => {
                                      setExpandedTaskIds(prev => ({ ...prev, [t.id]: !prev[t.id] }));
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                      <div className="pb-task-title">{t.title}</div>
                                      {hasDesc && (
                                        <div style={{ color: 'var(--pb-muted)', paddingLeft: 4 }}>
                                          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                        </div>
                                      )}
                                    </div>
                                    {isExpanded && hasDesc && (
                                      <div style={{
                                        marginTop: 6,
                                        paddingTop: 6,
                                        borderTop: '1px dashed var(--pb-border)',
                                        fontSize: 11,
                                        color: 'var(--pb-muted)',
                                        whiteSpace: 'pre-line',
                                        lineHeight: 1.4
                                      }}>
                                        {t.description}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                            {appState.tasks.length === 0 && (
                              <div style={{ fontSize: 11, color: 'var(--pb-muted)', textAlign: 'center', marginTop: 10 }}>
                                No tasks added yet.
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Task Manager (Add/Remove/Edit shared tasks & sub-details) */}
                <div className="pb-task-mgr">
                  <div className="pb-task-mgr-title">Manage Shared Tasks (Applies to all 7 Days)</div>
                  {appState.tasks.map(t => (
                    <div key={t.id} className="pb-task-mgr-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                      {editingTaskId === t.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                          <input
                            className="pb-input"
                            style={{ padding: '6px 10px', fontSize: 13 }}
                            placeholder="Task Name (e.g. Morning Routine)"
                            value={editingTaskText}
                            onChange={e => setEditingTaskText(e.target.value)}
                            autoFocus
                          />
                          <textarea
                            className="pb-input"
                            style={{ padding: '6px 10px', fontSize: 12, minHeight: 50, fontFamily: 'IBM Plex Sans, sans-serif' }}
                            placeholder="Sub-details (e.g. • 32oz water&#10;• 10 min stretch&#10;• Vitamins)"
                            value={editingTaskDesc}
                            onChange={e => setEditingTaskDesc(e.target.value)}
                          />
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button className="pb-icon-btn" onClick={() => saveEditedTask(t.id)} title="Save Task">
                              <Check size={14} color="var(--pb-amber)" /> Save
                            </button>
                            <button className="pb-icon-btn" onClick={() => setEditingTaskId(null)} title="Cancel">
                              <X size={14} /> Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                          <div>
                            <div style={{ fontWeight: 500 }}>{t.title}</div>
                            {t.description && (
                              <div style={{ fontSize: 11, color: 'var(--pb-muted)', marginTop: 2, whiteSpace: 'pre-line' }}>
                                {t.description}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <button
                              className="pb-line-del"
                              style={{ opacity: 1 }}
                              onClick={() => {
                                setEditingTaskId(t.id);
                                setEditingTaskText(t.title);
                                setEditingTaskDesc(t.description || '');
                              }}
                              title="Edit Task & Details"
                            >
                              <Edit2 size={13} color="var(--pb-teal)" />
                            </button>
                            <button className="pb-line-del" style={{ opacity: 1 }} onClick={() => deleteTask(t.id)} title="Delete Task">
                              <Trash size={13} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {addingTask ? (
                    <div className="pb-add-form" style={{ margin: '10px 0 0', flexDirection: 'column' }}>
                      <input
                        ref={newTaskRef}
                        className="pb-input"
                        placeholder="Task Name (e.g. Morning Routine)"
                        value={newTaskTitle}
                        onChange={e => setNewTaskTitle(e.target.value)}
                      />
                      <textarea
                        className="pb-input"
                        style={{ minHeight: 50, fontSize: 12, fontFamily: 'IBM Plex Sans, sans-serif' }}
                        placeholder="Sub-details (optional, e.g. • 32oz water&#10;• 10 min stretch)"
                        value={newTaskDesc}
                        onChange={e => setNewTaskDesc(e.target.value)}
                      />
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="pb-icon-btn" onClick={addTask}><Check size={14} color="var(--pb-amber)" /> Save Task</button>
                        <button className="pb-icon-btn" onClick={() => setAddingTask(false)}><X size={14} /> Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button className="pb-add" style={{ margin: '8px 0 0', width: '100%' }} onClick={() => setAddingTask(true)}>
                      <Plus size={14} /> Add new shared task
                    </button>
                  )}
                </div>
              </>
            )}

            {selectedId === 'daily-plan' && (
              <>
                <div className="pb-main-header">
                  <div className="pb-main-name">
                    <Clock size={22} color="var(--pb-amber)" /> Daily Plan
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Day Picker Pills */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {DAYS.map((dayName, idx) => (
                        <button
                          key={dayName}
                          style={{
                            background: planDayIdx === idx ? 'var(--pb-amber)' : 'var(--pb-panel)',
                            color: planDayIdx === idx ? '#1b2229' : 'var(--pb-cream)',
                            border: '1px solid var(--pb-border)',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontFamily: 'IBM Plex Mono, monospace',
                            fontSize: '12px',
                            fontWeight: planDayIdx === idx ? 700 : 400,
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}
                          onClick={() => setPlanDayIdx(idx)}
                        >
                          {dayName.toUpperCase()}
                        </button>
                      ))}
                    </div>

                    <button className="pb-btn-action" onClick={logCurrentDayPlanAndDebrief}>
                      <Archive size={14} /> Log Today's Plan &amp; Debrief
                    </button>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  background: 'var(--pb-panel)',
                  border: '1px solid var(--pb-border)',
                  borderRadius: 8,
                  padding: 20
                }}>
                  <div style={{
                    fontFamily: 'IBM Plex Mono, monospace',
                    fontSize: 12,
                    color: 'var(--pb-teal)',
                    letterSpacing: 1,
                    marginBottom: 6
                  }}>
                    HOURLY PLAN &amp; ACTUAL DEBRIEF — {DAYS[planDayIdx].toUpperCase()}
                  </div>

                  {HOURS_3AM_TO_12AM.map((hourLabel) => {
                    const key = `${planDayIdx}_${hourLabel}`;
                    const plannedVal = appState.hourlyPlan[key] || '';
                    const actualVal = appState.hourlyActual[key] || '';
                    return (
                      <div key={hourLabel} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 14,
                        padding: '10px 12px',
                        background: 'var(--pb-panel-2)',
                        border: '1px solid var(--pb-border)',
                        borderRadius: 6
                      }}>
                        <div style={{
                          width: 80,
                          fontFamily: 'IBM Plex Mono, monospace',
                          fontSize: 12,
                          color: 'var(--pb-amber)',
                          fontWeight: 600,
                          paddingTop: 8,
                          flexShrink: 0
                        }}>
                          {hourLabel}
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <input
                            className="pb-input"
                            style={{
                              padding: '7px 10px',
                              fontSize: 13,
                              background: plannedVal ? 'rgba(232,163,61,0.06)' : 'var(--pb-bg)',
                              borderColor: plannedVal ? 'rgba(232,163,61,0.3)' : 'var(--pb-border)'
                            }}
                            placeholder="WHAT I NEED TO DO (Planned)"
                            value={plannedVal}
                            onChange={e => updateHourlySlot(planDayIdx, hourLabel, e.target.value)}
                          />
                          <input
                            className="pb-input"
                            style={{
                              padding: '7px 10px',
                              fontSize: 12,
                              color: 'var(--pb-teal)',
                              background: actualVal ? 'rgba(92,139,147,0.08)' : 'var(--pb-bg)',
                              borderColor: actualVal ? 'rgba(92,139,147,0.4)' : 'var(--pb-border)'
                            }}
                            placeholder="WHAT I ACTUALLY DID (End of Day Debrief)"
                            value={actualVal}
                            onChange={e => updateHourlyActualSlot(planDayIdx, hourLabel, e.target.value)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {selectedId === 'weekly-logs' && (
              <>
                <div className="pb-main-header">
                  <div className="pb-main-name">
                    <History size={22} color="var(--pb-teal)" /> History Logs
                  </div>
                </div>

                {/* Daily Debrief Logs */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: 'var(--pb-amber)', letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' }}>
                    Daily Plan &amp; Debrief Logs ({appState.archivedDays.length})
                  </div>

                  {appState.archivedDays.length === 0 ? (
                    <div className="pb-empty" style={{ marginTop: 10, textAlign: 'left' }}>No daily plan logs saved yet. Go to Daily Plan and click "Log Today's Plan &amp; Debrief".</div>
                  ) : (
                    appState.archivedDays.map(log => (
                      <div key={log.id} className="pb-log-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div className="pb-log-title">{log.dayName.toUpperCase()} — {log.dateStr}</div>
                            <div className="pb-log-sub">{log.slots.length} logged hour slots</div>
                          </div>
                          <button className="pb-line-del" style={{ opacity: 1 }} onClick={() => deleteDailyLogRecord(log.id)}>
                            <Trash size={14} />
                          </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 8, borderTop: '1px dashed var(--pb-border)' }}>
                          {log.slots.map((s, idx) => (
                            <div key={idx} style={{ fontSize: 12, display: 'flex', gap: 10, alignItems: 'baseline' }}>
                              <span style={{ fontFamily: 'IBM Plex Mono, monospace', color: 'var(--pb-amber)', width: 70, flexShrink: 0 }}>{s.hour}:</span>
                              <div style={{ flex: 1 }}>
                                {s.planned && <div><b style={{ color: 'var(--pb-cream)' }}>Planned:</b> {s.planned}</div>}
                                {s.actual && <div style={{ color: 'var(--pb-teal)' }}><b>Actual:</b> {s.actual}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Weekly Checklist History Logs */}
                <div>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: 'var(--pb-teal)', letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' }}>
                    Weekly Checklist History ({appState.archivedWeeks.length})
                  </div>

                  {appState.archivedWeeks.length === 0 ? (
                    <div className="pb-empty" style={{ marginTop: 10, textAlign: 'left' }}>No archived weeks yet. Complete a week on your Daily Checklist and click "Reset &amp; Archive Week".</div>
                  ) : (
                    appState.archivedWeeks.map(log => (
                      <div key={log.id} className="pb-log-card">
                        <div>
                          <div className="pb-log-title">{log.dateRange}</div>
                          <div className="pb-log-sub">Completed {log.totalCompleted} of {log.totalPossible} total task instances</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          <div className="pb-log-score">{log.scorePercent}%</div>
                          <button className="pb-line-del" style={{ opacity: 1 }} onClick={() => deleteLogRecord(log.id)}>
                            <Trash size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {selectedId !== 'daily-checklist' && selectedId !== 'weekly-logs' && selectedReason && (
              <>
                <div className="pb-main-header">
                  <div className="pb-main-name">{selectedReason.name}</div>
                </div>
                <textarea
                  className="pb-textbox"
                  placeholder="Write your why here..."
                  value={selectedReason.content}
                  onChange={e => updateContent(e.target.value)}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function ReasonClient() {
  const [unlocked, setUnlocked] = useState<boolean>(false);

  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;
  return <ReasonApp />;
}
