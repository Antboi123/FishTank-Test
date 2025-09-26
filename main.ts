import React, { useEffect, useState, useRef } from 'react';

// Fishtank Tycoon - single-file React prototype
// - Tailwind-friendly classes used (no Tailwind required to run, but looks best with it)
// - Persists to localStorage
// - Simulates "sessions" that add minutes to fish progress
// - Unlocks fish when accumulatedMinutes >= sessionLengthGoal
// - Simple coins / shop mechanic: each unlocked fish produces coins per minute
// - Achievements unlock when required fish are unlocked

/*******************
 * CONFIG / CONSTANTS
 *******************/
const MINUTE_MS = 60 * 1000;
const TICK_MS = 1000; // 1s tick for UX; we count seconds and convert to minutes

const GOALS = {
  ZERO: 0,
  ONE: 1,
  EASY: 5,
  MEDIUM: 10,
  DIFFICULT: 30,
  MARATHON: 60
};

export const SITES = {
  google: { name: 'Floogle the Search Fish', domains: ['google.com/search'], sessionLengthGoal: GOALS.ZERO, coinsPerMin: 0.1 },
  wikipedia: { name: 'Omni the Wikipedia Fish', domains: ['wikipedia.org/wiki'], sessionLengthGoal: GOALS.ONE, coinsPerMin: 0.2 },
  facebook: { name: 'Zuck the Facebook Fish', domains: ['facebook.com'], sessionLengthGoal: GOALS.DIFFICULT, coinsPerMin: 0.4 },
  reddit: { name: 'Ditto the r/Fish', domains: ['reddit.com'], sessionLengthGoal: GOALS.DIFFICULT, coinsPerMin: 0.4 },
  youtube: { name: 'Stream the YouTube Fish', domains: ['youtube.com'], sessionLengthGoal: GOALS.MARATHON, coinsPerMin: 1.2 },
  'stack-overflow': { name: 'Stacky the Overflow Fish', domains: ['stackoverflow.com'], sessionLengthGoal: GOALS.EASY, coinsPerMin: 0.3 },
  amazon: { name: 'Prim the Amazonian Fish', domains: ['amazon.com'], sessionLengthGoal: GOALS.MEDIUM, coinsPerMin: 0.35 },
  email: { name: 'Sincere the Email Fish', domains: ['mail.google', 'mail.yahoo'], sessionLengthGoal: GOALS.MEDIUM, coinsPerMin: 0.25 },
  twitter: { name: 'Birdie the Twitter Fish', domains: ['twitter.com'], sessionLengthGoal: GOALS.DIFFICULT, coinsPerMin: 0.35 },
  messenger: { name: 'Hermes the Messenger Fish', domains: ['messenger.com'], sessionLengthGoal: GOALS.DIFFICULT, coinsPerMin: 0.3 },
  yahoo: { name: 'Hooya! the Yahoo Fish', domains: ['yahoo.com'], sessionLengthGoal: GOALS.MEDIUM, coinsPerMin: 0.2 },
  pinterest: { name: 'Pinteresa the Pinned Fish', domains: ['pinterest.com'], sessionLengthGoal: GOALS.DIFFICULT, coinsPerMin: 0.3 },
  netflix: { name: 'Flix the Netflix Fish', domains: ['netflix.com'], sessionLengthGoal: GOALS.MARATHON, coinsPerMin: 1.1 },
  edu: { name: 'Edu the Academic Fish', domains: ['.edu'], sessionLengthGoal: GOALS.MEDIUM, coinsPerMin: 0.25 },
  docs: { name: 'Type the Docs Fish', domains: ['docs.google.com/document'], sessionLengthGoal: GOALS.DIFFICULT, coinsPerMin: 0.45 },
  sheets: { name: 'Cell the Sheets Fish', domains: ['docs.google.com/spreadsheets'], sessionLengthGoal: GOALS.DIFFICULT, coinsPerMin: 0.45 },
  slides: { name: 'Prez the Slides Fish', domains: ['docs.google.com/presentation'], sessionLengthGoal: GOALS.DIFFICULT, coinsPerMin: 0.45 },
  drive: { name: 'Cher the Drive Fish', domains: ['drive.google.com'], sessionLengthGoal: GOALS.EASY, coinsPerMin: 0.2 },
  gov: { name: 'Boama the Government Fish', domains: ['.gov'], sessionLengthGoal: GOALS.EASY, coinsPerMin: 0.2 },
  tumblr: { name: 'Blog the Tumblr Fish', domains: ['tumblr.com'], sessionLengthGoal: GOALS.DIFFICULT, coinsPerMin: 0.28 },
  news: { name: 'Reed the News Fish', domains: ['cnn.com', 'huffpost.com', 'foxnews.com', 'nytimes.com'], sessionLengthGoal: GOALS.DIFFICULT, coinsPerMin: 0.3 },
  calendar: { name: 'Cal the Schedule Fish', domains: ['calendar.google.com/calendar'], sessionLengthGoal: GOALS.MEDIUM, coinsPerMin: 0.25 },
  zoom: { name: 'Mooz the Video Conference Fish', domains: ['zoom.us'], sessionLengthGoal: GOALS.DIFFICULT, coinsPerMin: 0.4 },
  localhost: { name: 'Hestia the Localhost Fish', domains: ['localhost:'], sessionLengthGoal: GOALS.DIFFICULT, coinsPerMin: 0.45 },
  github: { name: 'Repo the Github Fish', domains: ['github.com'], sessionLengthGoal: GOALS.MEDIUM, coinsPerMin: 0.35 },
  spotify: { name: 'Spot the Music Fish', domains: ['spotify.com'], sessionLengthGoal: GOALS.DIFFICULT, coinsPerMin: 0.6 },
  piazza: { name: 'Pia the Piazza Fish', domains: ['piazza.com'], sessionLengthGoal: GOALS.MEDIUM, coinsPerMin: 0.2 },
  instagram: { name: 'Gram the Influencer Fish', domains: ['instagram.com'], sessionLengthGoal: GOALS.MEDIUM, coinsPerMin: 0.25 },
  shopping: { name: 'Goldie the Online Shopping Fish', domains: ['zara.com', 'hm.com', 'gap.com', 'uniqlo.com'], sessionLengthGoal: GOALS.MEDIUM, coinsPerMin: 0.3 },
  hulu: { name: 'Lou the Hulu Fish', domains: ['hulu.com'], sessionLengthGoal: GOALS.MARATHON, coinsPerMin: 1.0 },
  alien: { name: 'Nish the... Fish?', domains: ['nishirshelat.com'], sessionLengthGoal: GOALS.ONE, coinsPerMin: 0.1 },
  disney: { name: 'Walt the Disney+ Fish', domains: ['disneyplus.com'], sessionLengthGoal: GOALS.MARATHON, coinsPerMin: 1.0 }
};

export const ACHIEVEMENTS = [
  { name: 'I Know Everything', fishIds: ['wikipedia', 'google'] },
  { name: 'Working From Home', fishIds: ['zoom', 'email'] },
  { name: 'Down With Cable', fishIds: ['disney', 'netflix', 'hulu'] },
  { name: 'Sharing Is Caring', fishIds: ['docs', 'sheets', 'slides'] },
  { name: 'College Student', fishIds: ['edu', 'email', 'docs'] },
  { name: 'Social Network', fishIds: ['facebook', 'messenger'] },
  { name: 'Web Developer', fishIds: ['github', 'localhost', 'stack-overflow'] },
  { name: 'Moneybags', fishIds: ['amazon', 'shopping'] },
  { name: 'Watchdog', fishIds: ['google', 'news'] },
  { name: 'Feeling Blue', fishIds: ['facebook', 'messenger', 'twitter'] },
  { name: "Google's Biggest Fan", fishIds: ['google', 'youtube', 'drive'] },
  { name: 'I Feel Pretty', fishIds: ['pinterest', 'instagram'] },
  { name: 'On the Grind', fishIds: ['email', 'calendar'] },
  { name: 'Master Essayist', fishIds: ['docs', 'wikipedia'] },
  { name: 'Audiovisual Greens', fishIds: ['spotify', 'hulu'] }
];

/*******************
 * Helper utilities
 *******************/
const STORAGE_KEY = 'fishtank-tycoon-v1';

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatMinutes(mins) {
  if (mins < 60) return `${Math.floor(mins)}m`;
  const h = Math.floor(mins / 60);
  const rem = Math.floor(mins % 60);
  return `${h}h ${rem}m`;
}

/*******************
 * Main React App
 *******************/
export default function FishtankTycoon() {
  // persistent state structure
  const defaultState = {
    fishProgress: Object.fromEntries(Object.keys(SITES).map(id => [id, { accumulatedSeconds: 0, unlocked: SITES[id].sessionLengthGoal <= 0, unlockedAt: null }])),
    coins: 0,
    unlockedAchievements: {},
    unlockedDecor: {},
    lastTick: Date.now()
  };

  const [state, setState] = useState(() => {
    const s = loadState();
    return s || defaultState;
  });

  // which fish is currently "session active"
  const [activeFish, setActiveFish] = useState(null);
  const tickRef = useRef(null);

  // Save on state change
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Tick loop: increments active fish seconds and awards coins
  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      if (!activeFish) return;
      setState(prev => {
        const now = Date.now();
        const deltaSec = Math.round((now - prev.lastTick) / 1000) || 1;
        const newProgress = { ...prev.fishProgress };
        newProgress[activeFish] = { ...newProgress[activeFish] };
        newProgress[activeFish].accumulatedSeconds += deltaSec;

        // convert seconds to minutes for unlocking check
        const minutes = newProgress[activeFish].accumulatedSeconds / 60;
        const goalMin = SITES[activeFish].sessionLengthGoal;
        let coinsGained = 0;
        // award coins for the delta time (coinsPerMin * minutesDelta)
        const coinsPerMin = SITES[activeFish].coinsPerMin || 0;
        coinsGained = (coinsPerMin * (deltaSec / 60));

        const newCoins = +(prev.coins + coinsGained).toFixed(2);

        // unlock if meets or exceeds goal
        if (!newProgress[activeFish].unlocked && minutes >= goalMin) {
          newProgress[activeFish].unlocked = true;
          newProgress[activeFish].unlockedAt = now;
        }

        const newState = { ...prev, fishProgress: newProgress, coins: newCoins, lastTick: now };

        // check achievements
        checkAchievements(newState);

        return newState;
      });
    }, TICK_MS);

    return () => clearInterval(tickRef.current);
  }, [activeFish]);

  // Achievements check
  function checkAchievements(s) {
    const unlocked = { ...s.unlockedAchievements };
    const unlockedSet = new Set(Object.entries(s.fishProgress).filter(([,v]) => v.unlocked).map(([k]) => k));
    let changed = false;
    for (const ach of ACHIEVEMENTS) {
      if (unlocked[ach.name]) continue;
      const req = ach.fishIds || [];
      if (req.every(fid => unlockedSet.has(fid))) {
        unlocked[ach.name] = Date.now();
        changed = true;
      }
    }
    if (changed) {
      setState(prev => ({ ...prev, unlockedAchievements: unlocked }));
    }
  }

  // UI actions
  function toggleSession(fishId) {
    setActiveFish(prev => (prev === fishId ? null : fishId));
    // reset lastTick to avoid giant delta on re-enable
    setState(prev => ({ ...prev, lastTick: Date.now() }));
  }

  function manualAddMinutes(fishId, minutes) {
    setState(prev => {
      const newProgress = { ...prev.fishProgress };
      newProgress[fishId] = { ...newProgress[fishId] };
      newProgress[fishId].accumulatedSeconds += minutes * 60;
      if (!newProgress[fishId].unlocked && (newProgress[fishId].accumulatedSeconds / 60) >= SITES[fishId].sessionLengthGoal) {
        newProgress[fishId].unlocked = true;
        newProgress[fishId].unlockedAt = Date.now();
      }
      const newState = { ...prev, fishProgress: newProgress };
      checkAchievements(newState);
      return newState;
    });
  }

  // Shop: buy a decor that increases coin production globally
  const DECOR_ITEMS = [
    { id: 'plant', name: 'Tiny Plant', cost: 10, multiplier: 1.05 },
    { id: 'castle', name: 'Sunken Castle', cost: 50, multiplier: 1.15 },
    { id: 'treasure', name: 'Treasure Chest', cost: 200, multiplier: 1.5 }
  ];

  function buyDecor(itemId) {
    const item = DECOR_ITEMS.find(i => i.id === itemId);
    if (!item) return;
    if (state.coins < item.cost) return alert('Not enough coins');
    setState(prev => {
      const dec = { ...prev.unlockedDecor };
      dec[itemId] = (dec[itemId] || 0) + 1;
      return { ...prev, unlockedDecor: dec, coins: +(prev.coins - item.cost).toFixed(2) };
    });
  }

  function resetData() {
    if (!confirm('Reset all progress?')) return;
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }

  // Derived values
  const totalUnlocked = Object.values(state.fishProgress).filter(f => f.unlocked).length;
  const totalFish = Object.keys(SITES).length;

  const decorMultiplier = Object.entries(state.unlockedDecor).reduce((acc, [id, qty]) => {
    const item = DECOR_ITEMS.find(i => i.id === id);
    if (!item) return acc;
    return acc * Math.pow(item.multiplier, qty);
  }, 1);

  const projectedCoinsPerMin = Object.entries(state.fishProgress).reduce((acc, [id, prog]) => {
    if (!prog.unlocked) return acc;
    return acc + (SITES[id].coinsPerMin || 0);
  }, 0) * decorMultiplier;

  return (
    <div className="p-6 font-sans">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold">Fishtank Tycoon (Prototype)</h1>
          <p className="text-sm text-gray-600">Unlock fish by "using" site sessions. Fish produce coins once unlocked.</p>
        </div>
        <div className="text-right">
          <div className="text-sm">Coins: <strong>{state.coins.toFixed(2)}</strong></div>
          <div className="text-xs text-gray-500">Projected / min: {projectedCoinsPerMin.toFixed(2)}</div>
          <div className="text-xs text-gray-500">Unlocked: {totalUnlocked}/{totalFish}</div>
        </div>
      </header>

      <main>
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {Object.entries(SITES).map(([id, site]) => {
            const prog = state.fishProgress[id] || { accumulatedSeconds: 0, unlocked: false };
            const minutes = prog.accumulatedSeconds / 60;
            const goal = site.sessionLengthGoal;
            const percent = goal <= 0 ? 100 : Math.min(100, Math.round((minutes / goal) * 100));
            const unlocked = prog.unlocked;
            const active = activeFish === id;
            return (
              <div key={id} className={`border rounded-md p-4 bg-white shadow-sm ${unlocked ? 'opacity-100' : 'opacity-95'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold">{site.name}</div>
                    <div className="text-xs text-gray-500">{id}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">{unlocked ? 'Unlocked' : `${percent}%`}</div>
                    <div className="text-xs text-gray-500">{formatMinutes(minutes)} / {formatMinutes(goal)}</div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="w-full h-3 bg-gray-200 rounded overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${percent}%` }} />
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <button className={`px-3 py-1 text-sm rounded ${active ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`} onClick={() => toggleSession(id)}>
                    {active ? 'Stop' : 'Start'} Session
                  </button>
                  <button className="px-3 py-1 text-sm bg-gray-100 border" onClick={() => manualAddMinutes(id, 5)}>+5m</button>
                  <button className="px-3 py-1 text-sm bg-gray-100 border" onClick={() => manualAddMinutes(id, 30)}>+30m</button>
                </div>

                <div className="mt-2 text-xs text-gray-600">Coins/min: {site.coinsPerMin}</div>
              </div>
            );
          })}
        </section>

        <section className="mb-6">
          <h2 className="font-semibold mb-2">Shop & Decor</h2>
          <div className="flex gap-4 flex-wrap">
            {DECOR_ITEMS.map(it => (
              <div key={it.id} className="border rounded p-3 bg-white">
                <div className="font-bold">{it.name}</div>
                <div className="text-xs text-gray-500">Cost: {it.cost} coins</div>
                <div className="text-xs text-gray-500">Multiplier: x{it.multiplier}</div>
                <div className="mt-2">
                  <button className="px-2 py-1 bg-blue-600 text-white rounded" onClick={() => buyDecor(it.id)}>Buy</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-6">
          <h2 className="font-semibold mb-2">Achievements</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ACHIEVEMENTS.map(a => {
              const unlocked = !!state.unlockedAchievements[a.name];
              return (
                <div key={a.name} className={`border rounded p-2 ${unlocked ? 'bg-green-50' : 'bg-white'}`}>
                  <div className="text-sm font-medium">{a.name}</div>
                  <div className="text-xs text-gray-500">Requires: {a.fishIds.join(', ')}</div>
                  <div className="text-xs mt-1">{unlocked ? 'Unlocked ✅' : ''}</div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mb-6">
          <h2 className="font-semibold mb-2">Management</h2>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={resetData}>Reset All</button>
            <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => alert('Export not implemented. Use localStorage to copy state.')}>Export (dev)</button>
          </div>
        </section>

      </main>

      <footer className="text-xs text-gray-500 mt-6">Prototype. Paste into a React app and run. Tailwind classes used for layout.</footer>
    </div>
  );
}
