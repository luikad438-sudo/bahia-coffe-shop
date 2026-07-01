'use strict';

/* ============================================================
 * BrewLab – geführter Brüh-Assistent
 * Rezepte, Timer-Engine, Logbuch (localStorage)
 * ============================================================ */

const METHODS = {
  v60: {
    name: 'V60 / Pour Over',
    icon: 'M4 5h16l-6 12h-4L4 5z M9 20h6',
    defaultRatio: 16,
    grind: 'Mittelfein – wie feiner Sand',
    steps(coffee, water) {
      const bloom = Math.round(coffee * 2);
      const first = Math.round(water * 0.6);
      return [
        { name: 'Blooming', duration: 45, target: bloom,
          instruction: `Gieße ${bloom} g Wasser kreisförmig auf und lass das Kaffeebett aufquellen.` },
        { name: 'Erster Guss', duration: 30, target: first,
          instruction: `Gieße in langsamen Kreisen von innen nach außen bis ${first} g auf.` },
        { name: 'Zweiter Guss', duration: 30, target: water,
          instruction: `Fülle ruhig bis ${water} g auf und halte den Wasserstand gleichmäßig.` },
        { name: 'Durchlaufen lassen', duration: 75, target: water,
          instruction: 'Nicht mehr gießen – warte, bis das Wasser vollständig durchgelaufen ist.' },
      ];
    },
  },
  chemex: {
    name: 'Chemex',
    icon: 'M8 3h8 M9 3l2 7-4 8a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3l-4-8 2-7',
    defaultRatio: 16,
    grind: 'Mittel bis mittelgrob',
    steps(coffee, water) {
      const bloom = Math.round(coffee * 2);
      const first = Math.round(water * 0.5);
      const second = Math.round(water * 0.8);
      return [
        { name: 'Blooming', duration: 45, target: bloom,
          instruction: `Gieße ${bloom} g Wasser auf und lass den Kaffee ${45} Sekunden quellen.` },
        { name: 'Erster Guss', duration: 40, target: first,
          instruction: `Gieße spiralförmig bis ${first} g auf.` },
        { name: 'Zweiter Guss', duration: 40, target: second,
          instruction: `Weiter bis ${second} g – Filterrand dabei aussparen.` },
        { name: 'Letzter Guss', duration: 35, target: water,
          instruction: `Fülle bis ${water} g auf.` },
        { name: 'Durchlaufen lassen', duration: 90, target: water,
          instruction: 'Warte, bis das Kaffeebett flach und trocken aussieht.' },
      ];
    },
  },
  frenchpress: {
    name: 'French Press',
    icon: 'M6 4h12v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4z M12 4v6 M8 10h8 M18 8h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-2',
    defaultRatio: 15,
    grind: 'Grob – wie Meersalz',
    steps(coffee, water) {
      return [
        { name: 'Aufgießen', duration: 30, target: water,
          instruction: `Gieße zügig alle ${water} g Wasser auf und rühre einmal kurz um.` },
        { name: 'Ziehen lassen', duration: 240, target: water,
          instruction: 'Deckel auflegen, Stempel oben lassen. Geduld – hier entsteht der Geschmack.' },
        { name: 'Pressen & servieren', duration: 25, target: water,
          instruction: 'Drücke den Stempel langsam und gleichmäßig nach unten, dann sofort ausschenken.' },
      ];
    },
  },
  aeropress: {
    name: 'AeroPress',
    icon: 'M8 3h8v4H8z M7 7h10v10H7z M7 17h10l-1 4H8l-1-4z',
    defaultRatio: 13,
    grind: 'Fein bis mittelfein',
    steps(coffee, water) {
      return [
        { name: 'Aufgießen', duration: 25, target: water,
          instruction: `Gieße ${water} g Wasser in einem Zug auf das Kaffeemehl.` },
        { name: 'Umrühren', duration: 15, target: water,
          instruction: 'Rühre dreimal ruhig um und setze den Kolben leicht auf.' },
        { name: 'Ziehen lassen', duration: 60, target: water,
          instruction: 'Kolben aufgesetzt lassen – das Vakuum verhindert das Durchtropfen.' },
        { name: 'Pressen', duration: 30, target: water,
          instruction: 'Drücke langsam und konstant, bis es zischt.' },
      ];
    },
  },
};

const STORAGE_BREWS = 'brewlab.brews';
const STORAGE_SETTINGS = 'brewlab.settings';
const CUP_SIZE = 200; // g Wasser pro Tasse

/* ---------- State ---------- */

const state = {
  method: 'v60',
  coffee: 20,
  ratio: 16,
  view: 'setup',
  brew: null, // { steps, stepIndex, stepStart, pausedAt, totalStart, timerId, params }
  rating: 0,
};

/* ---------- Helpers ---------- */

const $ = (id) => document.getElementById(id);

const fmtTime = (s) => {
  s = Math.max(0, Math.round(s));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' }) +
  ', ' + new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr';

function loadBrews() {
  try { return JSON.parse(localStorage.getItem(STORAGE_BREWS)) || []; }
  catch { return []; }
}
function saveBrews(brews) {
  localStorage.setItem(STORAGE_BREWS, JSON.stringify(brews));
}

function waterFor(coffee, ratio) {
  return Math.round(coffee * ratio / 5) * 5;
}

/* ---------- Audio Cues ---------- */

let audioCtx = null;
function beep(times = 1) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    for (let i = 0; i < times; i++) {
      const t = audioCtx.currentTime + i * 0.28;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    }
  } catch { /* Audio ist optional */ }
}

/* ---------- Views ---------- */

function showView(view) {
  state.view = view;
  for (const v of ['setup', 'brew', 'rate', 'log']) {
    $(`view-${v}`).hidden = v !== view;
  }
  const tabView = view === 'log' ? 'log' : 'setup';
  $('tab-brew').classList.toggle('is-active', tabView === 'setup');
  $('tab-brew').setAttribute('aria-selected', tabView === 'setup');
  $('tab-log').classList.toggle('is-active', tabView === 'log');
  $('tab-log').setAttribute('aria-selected', tabView === 'log');
}

/* ---------- Setup Screen ---------- */

function renderMethods() {
  const grid = $('method-grid');
  grid.innerHTML = '';
  for (const [key, m] of Object.entries(METHODS)) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'method-card' + (key === state.method ? ' is-selected' : '');
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', String(key === state.method));
    btn.dataset.method = key;
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
           stroke-linecap="round" stroke-linejoin="round"><path d="${m.icon}"/></svg>
      <span>${m.name}</span>`;
    btn.addEventListener('click', () => selectMethod(key));
    grid.appendChild(btn);
  }
}

function selectMethod(key) {
  state.method = key;
  state.ratio = METHODS[key].defaultRatio;
  $('ratio-slider').value = state.ratio;
  renderMethods();
  updateRecipe();
  persistSettings();
}

function updateRecipe() {
  const m = METHODS[state.method];
  const water = waterFor(state.coffee, state.ratio);
  const totalSec = m.steps(state.coffee, water).reduce((s, st) => s + st.duration, 0);
  $('coffee-value').textContent = state.coffee;
  $('ratio-label').textContent = `1:${state.ratio % 1 === 0 ? state.ratio : state.ratio.toFixed(1)}`;
  $('water-value').textContent = `${water} g`;
  $('cups-value').textContent = `≈ ${Math.max(1, Math.round(water / CUP_SIZE))} Tasse${water >= CUP_SIZE * 1.5 ? 'n' : ''}`;
  $('grind-value').textContent = m.grind;
  $('start-btn-time').textContent = `≈ ${fmtTime(totalSec)} min`;
}

function persistSettings() {
  localStorage.setItem(STORAGE_SETTINGS, JSON.stringify({
    method: state.method, coffee: state.coffee, ratio: state.ratio,
  }));
}

function restoreSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_SETTINGS));
    if (s && METHODS[s.method]) {
      state.method = s.method;
      state.coffee = Math.min(60, Math.max(10, Number(s.coffee) || 20));
      state.ratio = Math.min(18, Math.max(12, Number(s.ratio) || 16));
      $('ratio-slider').value = state.ratio;
    }
  } catch { /* Defaults behalten */ }
}

/* ---------- Timer-Engine ---------- */

function startBrew(params) {
  const p = params || {
    method: state.method,
    coffee: state.coffee,
    ratio: state.ratio,
    water: waterFor(state.coffee, state.ratio),
  };
  const steps = METHODS[p.method].steps(p.coffee, p.water);
  state.brew = {
    params: p,
    steps,
    stepIndex: 0,
    stepStart: Date.now(),
    totalStart: Date.now(),
    pausedAt: null,
    timerId: setInterval(tick, 100),
  };
  $('brew-method-label').textContent = METHODS[p.method].name;
  $('pause-btn').textContent = 'Pause';
  renderStep();
  showView('brew');
  beep(1);
}

function currentStepElapsed(b) {
  const ref = b.pausedAt || Date.now();
  return (ref - b.stepStart) / 1000;
}

function tick() {
  const b = state.brew;
  if (!b || b.pausedAt) return;
  const step = b.steps[b.stepIndex];
  const elapsed = currentStepElapsed(b);

  if (elapsed >= step.duration) {
    if (b.stepIndex + 1 < b.steps.length) {
      // Überschusszeit mitnehmen, damit gedrosselte Ticks (Hintergrund-Tab)
      // die Gesamtdauer nicht verlängern
      b.stepIndex++;
      b.stepStart = Date.now() - (elapsed - step.duration) * 1000;
      beep(2);
      renderStep();
    } else {
      finishBrew();
      return;
    }
  }
  renderTick();
}

const RING_CIRC = 2 * Math.PI * 98;

function renderStep() {
  const b = state.brew;
  const step = b.steps[b.stepIndex];
  const next = b.steps[b.stepIndex + 1];
  $('step-count').textContent = `Schritt ${b.stepIndex + 1}/${b.steps.length}`;
  $('step-name').textContent = step.name;
  $('step-instruction').textContent = step.instruction;
  $('step-target').textContent = `bis ${step.target} g`;
  $('step-next').textContent = next ? `Danach: ${next.name}` : 'Letzter Schritt – gleich geschafft!';
  renderTick();
}

function renderTick() {
  const b = state.brew;
  if (!b) return;
  const step = b.steps[b.stepIndex];
  const elapsed = Math.min(currentStepElapsed(b), step.duration);
  $('step-timer').textContent = fmtTime(step.duration - elapsed);
  const ref = b.pausedAt || Date.now();
  $('brew-total-time').textContent = fmtTime((ref - b.totalStart) / 1000);
  const frac = elapsed / step.duration;
  $('ring-progress').style.strokeDashoffset = String(RING_CIRC * (1 - frac));
}

function togglePause() {
  const b = state.brew;
  if (!b) return;
  if (b.pausedAt) {
    const pauseDur = Date.now() - b.pausedAt;
    b.stepStart += pauseDur;
    b.totalStart += pauseDur;
    b.pausedAt = null;
    $('pause-btn').textContent = 'Pause';
  } else {
    b.pausedAt = Date.now();
    $('pause-btn').textContent = 'Weiter';
  }
}

function stopTimer() {
  if (state.brew?.timerId) clearInterval(state.brew.timerId);
}

function abortBrew() {
  stopTimer();
  state.brew = null;
  showView('setup');
}

function finishBrew() {
  stopTimer();
  beep(3);
  const p = state.brew.params;
  state.rating = 0;
  renderStars();
  $('rate-notes').value = '';
  $('rate-summary').textContent =
    `${METHODS[p.method].name} · ${p.coffee} g Kaffee · 1:${p.ratio} · ${p.water} g Wasser`;
  showView('rate');
}

/* ---------- Rating ---------- */

function renderStars() {
  document.querySelectorAll('.star').forEach((el) => {
    el.classList.toggle('is-on', Number(el.dataset.value) <= state.rating);
  });
}

function saveBrewEntry() {
  const p = state.brew.params;
  const brews = loadBrews();
  brews.unshift({
    id: Date.now().toString(36),
    date: new Date().toISOString(),
    method: p.method,
    coffee: p.coffee,
    ratio: p.ratio,
    water: p.water,
    rating: state.rating,
    notes: $('rate-notes').value.trim(),
  });
  saveBrews(brews);
  state.brew = null;
  renderLog();
  showView('log');
}

/* ---------- Logbuch ---------- */

function renderLog() {
  const brews = loadBrews();
  const list = $('log-list');
  $('log-empty').hidden = brews.length > 0;
  $('log-count').hidden = brews.length === 0;
  $('log-count').textContent = brews.length;
  list.innerHTML = '';

  for (const b of brews) {
    const m = METHODS[b.method] || { name: b.method };
    const li = document.createElement('li');
    li.className = 'log-entry';
    li.innerHTML = `
      <div class="log-head">
        <span class="log-method">${m.name}</span>
        <span class="log-stars" aria-label="${b.rating} von 5 Sternen">${'★'.repeat(b.rating)}${'☆'.repeat(5 - b.rating)}</span>
      </div>
      <p class="log-meta">${fmtDate(b.date)} · ${b.coffee} g · 1:${b.ratio} · ${b.water} g Wasser</p>
      ${b.notes ? `<p class="log-notes">„${escapeHtml(b.notes)}“</p>` : ''}
      <div class="log-actions">
        <button type="button" class="btn-mini" data-action="rebrew" data-id="${b.id}">↺ Nochmal brühen</button>
        <button type="button" class="btn-mini btn-mini-danger" data-action="delete" data-id="${b.id}">Löschen</button>
      </div>`;
    list.appendChild(li);
  }
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function onLogClick(e) {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const brews = loadBrews();
  const entry = brews.find((b) => b.id === btn.dataset.id);
  if (!entry) return;

  if (btn.dataset.action === 'delete') {
    saveBrews(brews.filter((b) => b.id !== entry.id));
    renderLog();
  } else if (btn.dataset.action === 'rebrew') {
    if (METHODS[entry.method]) {
      state.method = entry.method;
      state.coffee = entry.coffee;
      state.ratio = entry.ratio;
      $('ratio-slider').value = entry.ratio;
      renderMethods();
      updateRecipe();
      persistSettings();
      startBrew({ method: entry.method, coffee: entry.coffee, ratio: entry.ratio, water: entry.water });
    }
  }
}

/* ---------- Wiring ---------- */

function init() {
  restoreSettings();
  renderMethods();
  updateRecipe();
  renderLog();

  $('coffee-minus').addEventListener('click', () => {
    state.coffee = Math.max(10, state.coffee - 2);
    updateRecipe(); persistSettings();
  });
  $('coffee-plus').addEventListener('click', () => {
    state.coffee = Math.min(60, state.coffee + 2);
    updateRecipe(); persistSettings();
  });
  $('ratio-slider').addEventListener('input', (e) => {
    state.ratio = Number(e.target.value);
    updateRecipe(); persistSettings();
  });

  $('start-btn').addEventListener('click', () => startBrew());
  $('pause-btn').addEventListener('click', togglePause);
  $('abort-btn').addEventListener('click', abortBrew);

  document.querySelectorAll('.star').forEach((el) => {
    el.addEventListener('click', () => {
      state.rating = Number(el.dataset.value);
      renderStars();
    });
  });
  $('save-btn').addEventListener('click', saveBrewEntry);
  $('discard-btn').addEventListener('click', () => { state.brew = null; showView('setup'); });

  $('log-list').addEventListener('click', onLogClick);

  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      if (state.view === 'brew' || state.view === 'rate') {
        if (!confirm('Laufende Brühung wirklich abbrechen?')) return;
        stopTimer();
        state.brew = null;
      }
      showView(tab.dataset.view);
    });
  });

  $('ring-progress').style.strokeDasharray = String(RING_CIRC);
  $('ring-progress').style.strokeDashoffset = String(RING_CIRC);
}

init();
