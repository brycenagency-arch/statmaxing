'use client';
import { useEffect, useRef, useState } from 'react';
import { Plus, Trash, X, Check } from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────── */
interface LogEntry {
  id: string;
  date: string;
  bestTopics: string;
  stalls: string;
  learned: string;
  balance: string;
  nextTime: string;
}
interface Profile {
  id: string;
  name: string;
  plan: { openers: string; keyQuestion: string; topicPicks: string[] };
  calls: LogEntry[];
}
interface CustomTopic {
  id: string;
  category: string;
  text: string;
}
interface AppState {
  profiles: Profile[];
  customTopics: CustomTopic[];
}

/* ─── Topic Bank ─────────────────────────────────────────── */
const TOPIC_BANK = [
  { key: 'recent', label: 'Recent Life', blurb: "What's actually going on right now.",
    examples: ["How's work/school been this week?", "Any weekend plans?", "How'd that thing they mentioned go?"] },
  { key: 'opinions', label: 'Opinions & Preferences', blurb: 'Light takes that reveal personality.',
    examples: ["Favorite show they've rewatched", 'Window or aisle seat', "Best meal they've had this year"] },
  { key: 'stories', label: 'Stories', blurb: 'Invite them to narrate — people open up when telling stories.',
    examples: ["Tell me about a trip that didn't go as planned", 'Funniest thing that happened as a kid', 'How you met your best friend'] },
  { key: 'future', label: 'Future-Facing', blurb: 'Plans, goals, things to look forward to.',
    examples: ['Anything exciting coming up?', 'A bucket-list place', 'Where they want to be in a year'] },
  { key: 'playful', label: 'Playful / Light', blurb: 'Keeps energy up — teasing, hypotheticals, this-or-that.',
    examples: ['This or that: mountains or beach', 'Would you rather...', 'Tease about something said earlier'] },
  { key: 'callback', label: 'Callbacks', blurb: 'Reference something from last time — shows you were listening.',
    examples: ['Follow up on something funny they said before', 'Ask how a thing they mentioned turned out'] },
];

/* ─── Utils ──────────────────────────────────────────────── */
const STORAGE_KEY = 'patchboard-state';
const AUTH_KEY = 'patchboard-auth';
const CORRECT_PASSWORD = 'RICHHH';

function uid() { return Math.random().toString(36).slice(2, 10); }

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      return { profiles: parsed.profiles || [], customTopics: parsed.customTopics || [] };
    }
  } catch { /* fresh start */ }
  return { profiles: [], customTopics: [] };
}

function saveState(s: AppState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
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
      localStorage.setItem(AUTH_KEY, '1');
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
          <div className="pb-gate-title">PATCHBOARD</div>
          <div className="pb-gate-sub">RESTRICTED ACCESS — OPERATOR ONLY</div>
          <input
            className="pb-gate-input"
            type="password"
            placeholder="••••••"
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && attempt()}
            autoFocus
          />
          <button className="pb-gate-btn" onClick={attempt}>CONNECT</button>
          <div className="pb-gate-error">{error}</div>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   PLAN TAB
═══════════════════════════════════════════════════════════ */
function PlanTab({ profile, customTopics, onPlanChange, onToggleTopic }: {
  profile: Profile;
  customTopics: CustomTopic[];
  onPlanChange: (field: 'openers' | 'keyQuestion', val: string) => void;
  onToggleTopic: (text: string) => void;
}) {
  const picks = profile.plan.topicPicks || [];
  return (
    <div>
      <div className="pb-section">
        <div className="pb-label">Openers</div>
        <textarea
          className="pb-textarea"
          placeholder="e.g. Ask how their weekend trip went, or bring up the show they mentioned last time..."
          defaultValue={profile.plan.openers}
          onChange={e => onPlanChange('openers', e.target.value)}
        />
      </div>
      <div className="pb-section">
        <div className="pb-label">Key question for this call</div>
        <input
          className="pb-input"
          placeholder="One genuine question you want to ask"
          defaultValue={profile.plan.keyQuestion}
          onChange={e => onPlanChange('keyQuestion', e.target.value)}
        />
      </div>
      <div className="pb-section">
        <div className="pb-label">Topics in your back pocket</div>
        {TOPIC_BANK.map(cat => {
          const custom = customTopics.filter(t => t.category === cat.key).map(t => t.text);
          const all = [...cat.examples, ...custom];
          return (
            <div key={cat.key} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: 'var(--pb-teal)', marginBottom: 6, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 1 }}>
                {cat.label.toUpperCase()}
              </div>
              <div className="pb-chips">
                {all.map(text => (
                  <button
                    key={text}
                    className={'pb-chip' + (picks.includes(text) ? ' picked' : '')}
                    onClick={() => onToggleTopic(text)}
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {picks.length > 0 && (
        <div className="pb-section">
          <div className="pb-label">Selected for this call ({picks.length})</div>
          <div className="pb-chips">
            {picks.map(t => (
              <button key={t} className="pb-chip picked" onClick={() => onToggleTopic(t)}>
                {t}<span style={{ marginLeft: 6, opacity: 0.7 }}>×</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TOPICS TAB
═══════════════════════════════════════════════════════════ */
function TopicsTab({ customTopics, onAdd, onRemove }: {
  customTopics: CustomTopic[];
  onAdd: (cat: string, text: string) => void;
  onRemove: (id: string) => void;
}) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  return (
    <div>
      {TOPIC_BANK.map(cat => {
        const custom = customTopics.filter(t => t.category === cat.key);
        return (
          <div key={cat.key} className="pb-cat-card">
            <div className="pb-cat-title">{cat.label}</div>
            <div className="pb-cat-blurb">{cat.blurb}</div>
            <div className="pb-chips">
              {cat.examples.map(ex => (
                <div key={ex} className="pb-chip" style={{ cursor: 'default' }}>{ex}</div>
              ))}
              {custom.map(t => (
                <div key={t.id} className="pb-chip picked">
                  {t.text}
                  <span
                    style={{ marginLeft: 6, cursor: 'pointer', opacity: 0.7 }}
                    onClick={() => onRemove(t.id)}
                  >×</span>
                </div>
              ))}
            </div>
            <div className="pb-custom-add">
              <input
                className="pb-input"
                placeholder="Add your own topic to this category..."
                value={drafts[cat.key] || ''}
                onChange={e => setDrafts(d => ({ ...d, [cat.key]: e.target.value }))}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    onAdd(cat.key, drafts[cat.key] || '');
                    setDrafts(d => ({ ...d, [cat.key]: '' }));
                  }
                }}
              />
              <button
                className="pb-icon-btn"
                onClick={() => {
                  onAdd(cat.key, drafts[cat.key] || '');
                  setDrafts(d => ({ ...d, [cat.key]: '' }));
                }}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   LOG TAB
═══════════════════════════════════════════════════════════ */
function LogTab({ profile, onAdd, onDelete }: {
  profile: Profile;
  onAdd: (entry: Omit<LogEntry, 'id'>) => void;
  onDelete: (id: string) => void;
}) {
  const [showing, setShowing] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    bestTopics: '', stalls: '', learned: '',
    balance: 'Balanced', nextTime: '',
  });

  const calls = profile.calls || [];

  function handleSave() {
    onAdd(form);
    setShowing(false);
    setForm({ date: new Date().toISOString().slice(0, 10), bestTopics: '', stalls: '', learned: '', balance: 'Balanced', nextTime: '' });
  }

  return (
    <div>
      <div className="pb-stats">
        <div>
          <div className="pb-stat-num">{calls.length}</div>
          <div className="pb-stat-label">CALLS LOGGED</div>
        </div>
        <div>
          <div className="pb-stat-num">{calls[0]?.date || '—'}</div>
          <div className="pb-stat-label">LAST CALL</div>
        </div>
      </div>

      {!showing ? (
        <button className="pb-btn-primary" onClick={() => setShowing(true)}>
          <Plus size={14} /> Log a call
        </button>
      ) : (
        <div className="pb-form-grid">
          <div className="pb-form-row">
            <div className="pb-label">Date</div>
            <input className="pb-input" type="date" value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div className="pb-form-row">
            <div className="pb-label">Where did the energy pick up?</div>
            <textarea className="pb-textarea" style={{ minHeight: 50 }} value={form.bestTopics}
              onChange={e => setForm(f => ({ ...f, bestTopics: e.target.value }))} />
          </div>
          <div className="pb-form-row">
            <div className="pb-label">Where did it stall?</div>
            <textarea className="pb-textarea" style={{ minHeight: 50 }} value={form.stalls}
              onChange={e => setForm(f => ({ ...f, stalls: e.target.value }))} />
          </div>
          <div className="pb-form-row">
            <div className="pb-label">What did you learn about them?</div>
            <textarea className="pb-textarea" style={{ minHeight: 50 }} value={form.learned}
              onChange={e => setForm(f => ({ ...f, learned: e.target.value }))} />
          </div>
          <div className="pb-form-row">
            <div className="pb-label">Talk-time balance</div>
            <select className="pb-select" value={form.balance}
              onChange={e => setForm(f => ({ ...f, balance: e.target.value }))}>
              {['Mostly me', 'Balanced', 'Mostly them'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="pb-form-row">
            <div className="pb-label">One thing to try next time</div>
            <input className="pb-input" value={form.nextTime}
              onChange={e => setForm(f => ({ ...f, nextTime: e.target.value }))} />
          </div>
          <div className="pb-form-actions">
            <button className="pb-btn-ghost" onClick={() => setShowing(false)}>Cancel</button>
            <button className="pb-btn-primary" onClick={handleSave}>Save entry</button>
          </div>
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        {calls.map(c => (
          <div key={c.id} className="pb-ticket">
            <div className="pb-ticket-head">
              <div className="pb-ticket-date">{c.date}</div>
              <button className="pb-icon-btn" onClick={() => onDelete(c.id)}><Trash size={13} /></button>
            </div>
            {c.bestTopics && <div className="pb-ticket-field"><b>Best energy</b>{c.bestTopics}</div>}
            {c.stalls && <div className="pb-ticket-field"><b>Where it stalled</b>{c.stalls}</div>}
            {c.learned && <div className="pb-ticket-field"><b>Learned</b>{c.learned}</div>}
            <div className="pb-ticket-field"><b>Balance</b>{c.balance}</div>
            {c.nextTime && <div className="pb-ticket-field"><b>Next time</b>{c.nextTime}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PATCHBOARD APP
═══════════════════════════════════════════════════════════ */
function PatchboardApp() {
  const [appState, setAppState] = useState<AppState>({ profiles: [], customTopics: [] });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<'plan' | 'topics' | 'log'>('plan');
  const [addingProfile, setAddingProfile] = useState(false);
  const [newName, setNewName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const newNameRef = useRef<HTMLInputElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const s = loadState();
    setAppState(s);
    if (s.profiles.length) setSelectedId(s.profiles[0].id);
  }, []);

  useEffect(() => {
    if (addingProfile) setTimeout(() => newNameRef.current?.focus(), 0);
  }, [addingProfile]);

  function scheduleSave(s: AppState) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveState(s), 400);
  }

  function mutate(fn: (draft: AppState) => void) {
    setAppState(prev => {
      const next = JSON.parse(JSON.stringify(prev)) as AppState;
      fn(next);
      scheduleSave(next);
      return next;
    });
  }

  function addProfile() {
    const name = newName.trim();
    if (!name) return;
    const id = uid();
    mutate(s => {
      s.profiles.push({ id, name, plan: { openers: '', keyQuestion: '', topicPicks: [] }, calls: [] });
    });
    setSelectedId(id);
    setTab('plan');
    setNewName('');
    setAddingProfile(false);
  }

  function deleteProfile(id: string) {
    mutate(s => { s.profiles = s.profiles.filter(p => p.id !== id); });
    if (selectedId === id) {
      setAppState(prev => {
        const remaining = prev.profiles.filter(p => p.id !== id);
        setSelectedId(remaining.length ? remaining[0].id : null);
        return prev;
      });
    }
    setConfirmDeleteId(null);
  }

  function updatePlanField(field: 'openers' | 'keyQuestion', value: string) {
    mutate(s => {
      const p = s.profiles.find(p => p.id === selectedId);
      if (p) p.plan[field] = value;
    });
  }

  function toggleTopicPick(text: string) {
    mutate(s => {
      const p = s.profiles.find(p => p.id === selectedId);
      if (!p) return;
      const idx = p.plan.topicPicks.indexOf(text);
      if (idx === -1) p.plan.topicPicks.push(text);
      else p.plan.topicPicks.splice(idx, 1);
    });
  }

  function addCustomTopic(cat: string, text: string) {
    text = text.trim();
    if (!text) return;
    mutate(s => { s.customTopics.push({ id: uid(), category: cat, text }); });
  }

  function removeCustomTopic(id: string) {
    mutate(s => { s.customTopics = s.customTopics.filter(t => t.id !== id); });
  }

  function addLogEntry(entry: Omit<LogEntry, 'id'>) {
    mutate(s => {
      const p = s.profiles.find(p => p.id === selectedId);
      if (p) p.calls.unshift({ ...entry, id: uid() });
    });
  }

  function deleteLogEntry(callId: string) {
    mutate(s => {
      const p = s.profiles.find(p => p.id === selectedId);
      if (p) p.calls = p.calls.filter(c => c.id !== callId);
    });
  }

  const selected = appState.profiles.find(p => p.id === selectedId) || null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Special+Elite&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap');

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
          width: 220px;
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
          padding: 0 20px 10px;
        }
        .pb-line {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 20px;
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
        .pb-line-name { font-size: 14px; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
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
          margin: 10px 20px 0;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
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
        .pb-add-form { margin: 10px 20px 0; display: flex; gap: 6px; }
        .pb-input, .pb-select {
          background: var(--pb-panel-2);
          border: 1px solid var(--pb-border);
          color: var(--pb-cream);
          padding: 7px 9px;
          border-radius: 5px;
          font-size: 13px;
          font-family: 'IBM Plex Sans', sans-serif;
          width: 100%;
          outline: none;
          transition: outline 0.15s;
        }
        .pb-input:focus, .pb-select:focus { outline: 2px solid var(--pb-amber); outline-offset: 1px; }
        .pb-textarea {
          background: var(--pb-panel);
          border: 1px solid var(--pb-border);
          color: var(--pb-cream);
          padding: 10px 12px;
          border-radius: 5px;
          font-size: 14px;
          font-family: 'IBM Plex Sans', sans-serif;
          width: 100%;
          resize: vertical;
          min-height: 70px;
          outline: none;
          transition: outline 0.15s;
          box-sizing: border-box;
        }
        .pb-textarea:focus { outline: 2px solid var(--pb-amber); outline-offset: 1px; }
        .pb-main { flex: 1; padding: 24px 32px; overflow-y: auto; }
        .pb-empty { color: var(--pb-muted); font-size: 14px; margin-top: 40px; text-align: center; }
        .pb-main-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
          flex-wrap: wrap;
          gap: 10px;
        }
        .pb-main-name { font-family: 'Special Elite', monospace; font-size: 20px; color: var(--pb-cream); }
        .pb-tabs {
          display: flex;
          gap: 4px;
          border: 1px solid var(--pb-border);
          border-radius: 7px;
          padding: 3px;
          background: var(--pb-panel);
        }
        .pb-tab {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 1px;
          padding: 6px 14px;
          border-radius: 5px;
          cursor: pointer;
          color: var(--pb-muted);
          background: none;
          border: none;
          transition: all 0.15s;
        }
        .pb-tab.active { background: var(--pb-amber); color: #1b2229; font-weight: 600; }
        .pb-section { margin-bottom: 26px; }
        .pb-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 1.5px;
          color: var(--pb-teal);
          margin-bottom: 8px;
          text-transform: uppercase;
        }
        .pb-chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .pb-chip {
          font-size: 12.5px;
          padding: 6px 12px;
          border-radius: 999px;
          border: 1px solid var(--pb-border);
          background: var(--pb-panel);
          color: var(--pb-muted);
          cursor: pointer;
          transition: all 0.15s;
          font-family: 'IBM Plex Sans', sans-serif;
        }
        .pb-chip:hover { border-color: var(--pb-amber); color: var(--pb-cream); }
        .pb-chip.picked {
          background: rgba(232,163,61,0.16);
          border-color: var(--pb-amber);
          color: var(--pb-amber);
        }
        .pb-cat-card {
          background: var(--pb-panel);
          border: 1px solid var(--pb-border);
          border-radius: 8px;
          padding: 16px 18px;
          margin-bottom: 14px;
        }
        .pb-cat-title { font-size: 15px; font-weight: 600; color: var(--pb-cream); margin-bottom: 3px; }
        .pb-cat-blurb { font-size: 12.5px; color: var(--pb-muted); margin-bottom: 12px; }
        .pb-custom-add { display: flex; gap: 6px; margin-top: 10px; }
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
          transition: all 0.15s;
        }
        .pb-icon-btn:hover { color: var(--pb-amber); border-color: var(--pb-amber); }
        .pb-stats {
          display: flex;
          gap: 26px;
          margin-bottom: 20px;
          font-family: 'IBM Plex Mono', monospace;
        }
        .pb-stat-num { font-size: 22px; color: var(--pb-amber); }
        .pb-stat-label { font-size: 10px; color: var(--pb-muted); letter-spacing: 1px; }
        .pb-btn-primary {
          background: var(--pb-amber);
          color: #1b2229;
          border: none;
          font-weight: 600;
          font-size: 13px;
          padding: 9px 16px;
          border-radius: 6px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: 'IBM Plex Sans', sans-serif;
          transition: filter 0.15s;
        }
        .pb-btn-primary:hover { filter: brightness(1.08); }
        .pb-ticket {
          position: relative;
          background: var(--pb-panel);
          border: 1px dashed var(--pb-border);
          border-radius: 8px;
          padding: 16px 20px;
          margin-bottom: 16px;
        }
        .pb-ticket::before, .pb-ticket::after {
          content: '';
          position: absolute;
          width: 14px; height: 14px;
          background: var(--pb-bg);
          border-radius: 50%;
          top: 50%;
          transform: translateY(-50%);
        }
        .pb-ticket::before { left: -8px; }
        .pb-ticket::after { right: -8px; }
        .pb-ticket-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          border-bottom: 1px solid var(--pb-border);
          padding-bottom: 8px;
        }
        .pb-ticket-date { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--pb-teal); letter-spacing: 1px; }
        .pb-ticket-field { margin-bottom: 8px; font-size: 13px; }
        .pb-ticket-field b {
          color: var(--pb-muted);
          font-weight: 500;
          font-size: 11px;
          letter-spacing: 0.5px;
          display: block;
          margin-bottom: 2px;
          text-transform: uppercase;
          font-family: 'IBM Plex Mono', monospace;
        }
        .pb-form-grid {
          background: var(--pb-panel);
          border: 1px solid var(--pb-border);
          border-radius: 8px;
          padding: 18px;
          margin-bottom: 18px;
        }
        .pb-form-row { margin-bottom: 12px; }
        .pb-form-actions { display: flex; gap: 8px; justify-content: flex-end; }
        .pb-btn-ghost {
          background: none;
          border: 1px solid var(--pb-border);
          color: var(--pb-muted);
          padding: 8px 14px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-family: 'IBM Plex Sans', sans-serif;
          transition: all 0.15s;
        }
        .pb-btn-ghost:hover { border-color: var(--pb-muted); color: var(--pb-cream); }
        .pb-confirm-bar { display: flex; align-items: center; gap: 4px; }

        @media (max-width: 640px) {
          .pb-body { flex-direction: column; }
          .pb-sidebar { width: 100%; border-right: none; border-bottom: 1px solid var(--pb-border); }
          .pb-main { padding: 20px; }
        }
      `}</style>

      <div className="pb-wrap">
        {/* Header */}
        <div className="pb-header">
          <div className="pb-title">PATCHBOARD</div>
          <div className="pb-sub">CALL PREP &amp; DEBRIEF CONSOLE</div>
        </div>

        <div className="pb-body">
          {/* Sidebar */}
          <div className="pb-sidebar">
            <div className="pb-sidebar-label">LINES</div>
            {appState.profiles.map(p => (
              <div
                key={p.id}
                className={'pb-line' + (p.id === selectedId ? ' active' : '')}
                onClick={() => { setSelectedId(p.id); setTab('plan'); setConfirmDeleteId(null); }}
              >
                <div className="pb-jack" />
                <div className="pb-line-name">{p.name}</div>
                {confirmDeleteId === p.id ? (
                  <div className="pb-confirm-bar" onClick={e => e.stopPropagation()}>
                    <button className="pb-line-del" style={{ opacity: 1 }} onClick={() => deleteProfile(p.id)}>
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
                    onClick={e => { e.stopPropagation(); setConfirmDeleteId(p.id); }}
                  >
                    <Trash size={13} />
                  </button>
                )}
              </div>
            ))}
            {addingProfile ? (
              <div className="pb-add-form">
                <input
                  ref={newNameRef}
                  className="pb-input"
                  placeholder="Name"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') addProfile();
                    if (e.key === 'Escape') { setAddingProfile(false); setNewName(''); }
                  }}
                />
                <button className="pb-icon-btn" onClick={addProfile}><Check size={14} /></button>
              </div>
            ) : (
              <button className="pb-add" onClick={() => setAddingProfile(true)}>
                <Plus size={14} /> New line
              </button>
            )}
          </div>

          {/* Main */}
          <div className="pb-main">
            {!selected ? (
              <div className="pb-empty">No lines yet. Add someone to start planning a call.</div>
            ) : (
              <>
                <div className="pb-main-header">
                  <div className="pb-main-name">{selected.name}</div>
                  <div className="pb-tabs">
                    {(['plan', 'topics', 'log'] as const).map(t => (
                      <button key={t} className={'pb-tab' + (tab === t ? ' active' : '')} onClick={() => setTab(t)}>
                        {t.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {tab === 'plan' && (
                  <PlanTab
                    key={selected.id}
                    profile={selected}
                    customTopics={appState.customTopics}
                    onPlanChange={updatePlanField}
                    onToggleTopic={toggleTopicPick}
                  />
                )}
                {tab === 'topics' && (
                  <TopicsTab
                    customTopics={appState.customTopics}
                    onAdd={addCustomTopic}
                    onRemove={removeCustomTopic}
                  />
                )}
                {tab === 'log' && (
                  <LogTab
                    key={selected.id}
                    profile={selected}
                    onAdd={addLogEntry}
                    onDelete={deleteLogEntry}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function PatchboardClient() {
  const [unlocked, setUnlocked] = useState<boolean | null>(null);

  useEffect(() => {
    setUnlocked(localStorage.getItem(AUTH_KEY) === '1');
  }, []);

  if (unlocked === null) return null;
  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;
  return <PatchboardApp />;
}
