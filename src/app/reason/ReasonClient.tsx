'use client';
import { useEffect, useRef, useState } from 'react';
import { Plus, Trash, Check, X } from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────── */
interface ReasonEntry {
  id: string;
  name: string;
  content: string;
  updatedAt: string;
}
interface ReasonState {
  reasons: ReasonEntry[];
}

/* ─── Config ─────────────────────────────────────────────── */
const STORAGE_KEY = 'reason-state';
const CORRECT_PASSWORD = 'BRAVE';

function uid() { return Math.random().toString(36).slice(2, 10); }

function loadState(): ReasonState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ReasonState;
      return { reasons: parsed.reasons || [] };
    }
  } catch { /* fresh start */ }
  return {
    reasons: [
      { id: 'r1', name: 'My Core Purpose', content: 'Write down why you started and what drives you every day...', updatedAt: new Date().toISOString() },
      { id: 'r2', name: 'Legacy', content: 'What mark do you want to leave behind?', updatedAt: new Date().toISOString() }
    ]
  };
}

function saveState(s: ReasonState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    
    // Background sync to Supabase
    import('@/lib/supabaseClient').then(({ supabase }) => {
      supabase.from('StateBackup').upsert({
        key: STORAGE_KEY,
        data: s,
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
        const fetchedState = data.data as ReasonState;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fetchedState));
        if (onSyncComplete) onSyncComplete(fetchedState);
      }
    });
  });
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

/* ═══════════════════════════════════════════════════════════
   MAIN REASON APP
═══════════════════════════════════════════════════════════ */
function ReasonApp() {
  const [appState, setAppState] = useState<ReasonState>({ reasons: [] });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addingEntry, setAddingEntry] = useState(false);
  const [newName, setNewName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const newNameRef = useRef<HTMLInputElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const s = loadState();
    setAppState(s);
    if (s.reasons.length) setSelectedId(s.reasons[0].id);

    // Sync from Supabase
    syncReasonFromSupabase((cloudState) => {
      setAppState(cloudState);
      if (cloudState.reasons.length) {
        setSelectedId(prev => prev || cloudState.reasons[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (addingEntry) setTimeout(() => newNameRef.current?.focus(), 0);
  }, [addingEntry]);

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
      setAppState(prev => {
        const remaining = prev.reasons.filter(r => r.id !== id);
        setSelectedId(remaining.length ? remaining[0].id : null);
        return prev;
      });
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

  const selected = appState.reasons.find(r => r.id === selectedId) || null;

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
          width: 240px;
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
          padding: 12px 20px;
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
          padding: 10px 12px;
          cursor: pointer;
          width: calc(100% - 40px);
          transition: border-color 0.15s;
          font-family: 'IBM Plex Sans', sans-serif;
        }
        .pb-add:hover { border-color: var(--pb-teal); }
        .pb-add-form { margin: 10px 20px 0; display: flex; gap: 6px; }
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
        .pb-main { flex: 1; padding: 28px 36px; display: flex; flex-direction: column; }
        .pb-empty { color: var(--pb-muted); font-size: 14px; margin-top: 40px; text-align: center; }
        .pb-main-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }
        .pb-main-name { font-family: 'Special Elite', monospace; font-size: 22px; color: var(--pb-amber); letter-spacing: 1px; }
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

        @media (max-width: 640px) {
          .pb-body { flex-direction: column; }
          .pb-sidebar { width: 100%; border-right: none; border-bottom: 1px solid var(--pb-border); }
          .pb-main { padding: 20px; }
        }
      `}</style>

      <div className="pb-wrap">
        <div className="pb-header">
          <div className="pb-title">REASON</div>
          <div className="pb-sub">WHY I DO WHAT I DO</div>
        </div>

        <div className="pb-body">
          <div className="pb-sidebar">
            <div className="pb-sidebar-label">ENTRIES</div>
            {appState.reasons.map(r => (
              <div
                key={r.id}
                className={'pb-line' + (r.id === selectedId ? ' active' : '')}
                onClick={() => { setSelectedId(r.id); setConfirmDeleteId(null); }}
              >
                <div className="pb-jack" />
                <div className="pb-line-name">{r.name}</div>
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
                <Plus size={14} /> New entry
              </button>
            )}
          </div>

          <div className="pb-main">
            {!selected ? (
              <div className="pb-empty">No entries yet. Add one to write down your why.</div>
            ) : (
              <>
                <div className="pb-main-header">
                  <div className="pb-main-name">{selected.name}</div>
                </div>
                <textarea
                  className="pb-textbox"
                  placeholder="Write your why here..."
                  value={selected.content}
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
