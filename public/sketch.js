const gridSize = 55;
const dotSpacing = 8;

let influenceRadius = 50;
let maxDistortion = 15;

let dots = [];
let canvas;

let controlsContainer, slidersGrid;

let tempSlider, humiditySlider, proximitySlider, peopleSlider;
let autoSimCheckbox;

// ---------- OUTER HALO VISUAL (AROUND GRID) ----------
let haloOrbs = [];
const HALO_ORB_COUNT = 80;


// auto-sim progress bar DOM
let autoSimProgressContainer, autoSimProgressBar;

let autoSimEnabled = false;
let simStates = {};

// --- stat change animation ---
const STAT_FLASH_DURATION = 220;
const STAT_FLASH_EXTRA_SIZE = 10;
let statAnim = [];

// --- sauna cycle (visual + auto-sim) ---
let saunaCycleStart = 0;
let saunaCycleDuration = 2000; // ms, randomized per cycle
let saunaShapeType = 0;        // 0 = circle, 1 = rect, 2 = rotating rect

// ---------- NORTHERN LIGHTS (AURORA) BACKGROUND ----------
let auroraTime = 0;

// ---------- MUSIC SELECTION UI ----------

const MUSIC_TYPES = [
  "lofi",
  "nature_ambience",
  "rain_sounds",
  "binaural_beats",
  "tibetan_bowls",
  "arctic_wind",
  "forest_stream",
  "minimal_ambient",
  "deep_drone",
  "ocean_waves"
];

let musicListContainer, musicListInner, musicMessageEl;
let musicItemEls = {};
let currentMusic = "lofi"; // default

// track the LIVE badge element
let liveBadgeEl = null;

// ---------- LO-FI MUSIC + MP3 SETUP ----------

// chord palette (F minor-ish, simple lo-fi set)
const LOFI_CHORDS = [
  [0, 3, 7],     // i
  [5, 8, 12],    // iv
  [7, 10, 14],   // v
  [10, 14, 17]   // vi-ish / color
];
const LOFI_ROOT_MIDI = 53; // F3

let audioStarted = false;

// routing
let masterGain;
let reverb;

// pad + bass
let padOsc1, padOsc2, padOsc3;
let bassOsc;

// pluck (small melodic accent)
let pluckOsc;
let pluckEnv;

// drums
let kickOsc, kickEnv;
let snareNoise, snareFilter, snareEnv;
let hatNoise, hatFilter, hatEnv;

// vinyl
let vinylNoise, vinylFilter;

// shared MP3 player for all non-lofi tracks
let naturePlayer = null;
let naturePlayerLoaded = false;

// clock (fixed groove, only gently influenced by params)
let baseBpm = 78;
let bpm = 78;
let stepInterval;   // ms between 16th notes
let lastStepTime = 0;
let stepIndex = 0;  // 0–15
let barIndex = 0;

// smoothed sensor values (to avoid jittery mapping)
let tempSmooth = 60;
let humSmooth = 50;
let peopleSmooth = 25;
let proxSmooth = 100;

// ---------- sauna background visual smoothing ----------
let saunaBGTemp = 60;
let saunaBGHum = 50;

// ---------- p5.js setup ----------

function setup() {
  colorMode(HSB, 360, 100, 100);
  canvas = createCanvas(windowWidth, windowHeight);
  background(0);

  initDots();
  initHaloOrbs();
  initSliders();

  // initialize smoothed background state from sliders
  saunaBGTemp = tempSlider.value();
  saunaBGHum = humiditySlider.value();

  initMusicSelector();
  initAutoSimulationState();
  initStatAnim();
  initSaunaCycle();

  bpm = baseBpm;
  stepInterval = 60000 / (bpm * 4); // 16th notes (4 * 4 per bar)
}

// ---------- dots / visuals ----------

function initDots() {
  dots = [];
  const totalGridSize = gridSize * dotSpacing;
  const offsetX = (width - totalGridSize) / 2;
  const offsetY = (height - totalGridSize) / 2;

  for (let i = 0; i < gridSize; i++) {
    dots[i] = [];
    for (let j = 0; j < gridSize; j++) {
      dots[i][j] = new Dot(i * dotSpacing + offsetX, j * dotSpacing + offsetY);
    }
  }
}

function initSliders() {
  const parentEl = canvas.parent();

  // --- inject modern CSS once ---
  if (!window._saunaControlsCSSInjected) {
    const css = `
      .controls-container {
        position: fixed;
        right: 24px;
        bottom: 24px;
        transform: none;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
        width: 240px;
        padding: 14px 14px 12px;
        background: rgba(0, 0, 0, 0.78);
        border-radius: 24px;
        border: 1px solid rgba(255, 255, 255, 0.14);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
        box-shadow: 0 18px 48px rgba(0, 0, 0, 0.75);
        z-index: 22;
      }

      .sliders-grid {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .control-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
        width: 100%;
      }

      .control-label {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
        font-size: 11px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: rgba(255, 255, 255, 0.76);
        opacity: 0.9;
      }

      .control-slider {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 6px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.16);
        outline: none;
        margin: 0;
      }

      .control-slider:focus-visible {
        outline: none;
      }

      .control-slider::-webkit-slider-runnable-track {
        height: 6px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.16);
      }

      .control-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #ffffff;
        border: none;
        margin-top: -5px; /* center thumb on track */
        box-shadow:
          0 0 0 2px rgba(0, 0, 0, 0.45),
          0 4px 10px rgba(0, 0, 0, 0.65);
      }

      .control-slider::-moz-range-track {
        height: 6px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.16);
      }

      .control-slider::-moz-range-thumb {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #ffffff;
        border: none;
        box-shadow:
          0 0 0 2px rgba(0, 0, 0, 0.45),
          0 4px 10px rgba(0, 0, 0, 0.65);
      }

      .control-slider::-ms-track {
        height: 6px;
        border-radius: 999px;
        background: transparent;
        border-color: transparent;
        color: transparent;
      }

      .control-slider::-ms-fill-lower,
      .control-slider::-ms-fill-upper {
        height: 6px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.16);
      }

      .control-slider::-ms-thumb {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #ffffff;
        border: none;
        box-shadow:
          0 0 0 2px rgba(0, 0, 0, 0.45),
          0 4px 10px rgba(0, 0, 0, 0.65);
      }

      .control-checkbox-wrap {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
        font-size: 11px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: rgba(255, 255, 255, 0.76);
        white-space: nowrap;
        margin-top: 4px;
      }

      .control-checkbox-wrap input[type="checkbox"] {
        width: 14px;
        height: 14px;
        border-radius: 4px;
        border: 1px solid rgba(255, 255, 255, 0.45);
        background: rgba(0, 0, 0, 0.4);
        accent-color: #ffffff;
        cursor: pointer;
      }

      .auto-progress-wrap {
        position: relative;
        width: 140px;
        height: 4px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.12);
        overflow: hidden;
        opacity: 0;
        transition: opacity 160ms ease-out;
      }

      .auto-progress-bar {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 0%;
        border-radius: inherit;
        background: rgba(255, 255, 255, 0.9);
        transform-origin: left center;
        transition: width 80ms linear;
      }

      /* --- MUSIC SELECTOR PANEL --- */

      .music-selector-container {
        position: fixed;
        left: 24px;
        bottom: 24px;
        transform: none;
        width: 240px;
        max-height: 340px;
        padding: 14px 14px 10px;
        background: rgba(0, 0, 0, 0.78);
        border-radius: 24px;
        border: 1px solid rgba(255, 255, 255, 0.14);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
        box-shadow: 0 18px 48px rgba(0, 0, 0, 0.75);
        display: flex;
        flex-direction: column;
        gap: 6px;
        z-index: 22;
      }

      .music-selector-header {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
        font-size: 13px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: rgba(255, 255, 255, 0.92);
      }

      .music-selector-subtitle {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
        font-size: 11px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: rgba(255, 255, 255, 0.55);
      }

      .music-selector-list {
        margin-top: 4px;
        padding: 4px 0;
        overflow-y: auto;
        max-height: 220px;
      }

      .music-item {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
        font-size: 11px;
        letter-spacing: 0.09em;
        text-transform: uppercase;
        color: rgba(255, 255, 255, 0.78);
        padding: 7px 10px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
        border-radius: 999px;
      }

      .music-item:not(:last-child) {
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }

      .music-item:hover {
        background: rgba(255, 255, 255, 0.06);
      }

      .music-item.is-active {
        background: rgba(255, 255, 255, 0.12);
        box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.25);
        color: rgba(255, 255, 255, 1);
      }

      .music-badge {
        font-size: 9px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        padding: 2px 6px;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.25);
        color: rgba(255, 255, 255, 0.8);
      }

      /* LIVE badge color states */
      .music-badge.live-green {
        border-color: #22c55e;
        color: #22c55e;
      }

      .music-badge.live-orange {
        border-color: #fb923c;
        color: #fb923c;
      }

      .music-selector-message {
        margin-top: 6px;
        min-height: 14px;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
        font-size: 11px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: rgba(255, 180, 180, 0.9); /* default reddish, overridden in JS when needed */
      }

      /* INFO PANEL: moved to bottom-center */
      .sauna-info-panel {
        position: fixed;
        left: 50%;
        bottom: 24px;
        width: 40%;
        transform: translateX(-50%);
        padding: 14px 14px;
        background: rgba(0, 0, 0, 0.72);
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.14);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.7);
        z-index: 21;
        display: flex;
        align-items: flex-start;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
      }

      .sauna-info-text {
        font-size: 11px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        line-height: 1.4;
        color: rgba(255, 255, 255, 0.82);
      }
    `;
    const styleEl = createElement('style', css);
    const head = select('head');
    if (head) styleEl.parent(head);
    else styleEl.parent(parentEl);
    window._saunaControlsCSSInjected = true;
  }

  // --- container ---
  controlsContainer = createDiv();
  controlsContainer.parent(parentEl);
  controlsContainer.addClass('controls-container');

  // header + subtitle for sliders, same style as music panel
  const controlsHeader = createDiv('Sauna state');
  controlsHeader.parent(controlsContainer);
  controlsHeader.addClass('music-selector-header');

  const controlsSubtitle = createDiv('Adjust conditions');
  controlsSubtitle.parent(controlsContainer);
  controlsSubtitle.addClass('music-selector-subtitle');

  // --- column for sliders ---
  slidersGrid = createDiv();
  slidersGrid.parent(controlsContainer);
  slidersGrid.addClass('sliders-grid');

  // helper to create a slider group
  function makeControlGroup(labelText, min, max, start) {
    const group = createDiv();
    group.parent(slidersGrid);
    group.addClass('control-group');

    const label = createDiv(labelText);
    label.parent(group);
    label.addClass('control-label');

    const slider = createSlider(min, max, start);
    slider.parent(group);
    slider.addClass('control-slider');

    return { label, slider };
  }

  // temperature
  const tempGroup = makeControlGroup('Temperature 🔥 (15–110°)', 15, 110, 60);
  tempLabel = tempGroup.label;
  tempSlider = tempGroup.slider;

  // humidity
  const humGroup = makeControlGroup('Humidity 💧 (0–100%)', 0, 100, 50);
  humidityLabel = humGroup.label;
  humiditySlider = humGroup.slider;

  // proximity
  const proxGroup = makeControlGroup('Proximity 📡 (0–200)', 0, 200, 100);
  proximityLabel = proxGroup.label;
  proximitySlider = proxGroup.slider;

  // people
  const peopleGroup = makeControlGroup('People 👥 (0–50)', 0, 50, 25);
  peopleLabel = peopleGroup.label;
  peopleSlider = peopleGroup.slider;

  // auto simulation checkbox + progress
  const autoGroup = createDiv();
  autoGroup.parent(controlsContainer);
  autoGroup.addClass('control-checkbox-wrap');

  autoSimCheckbox = createCheckbox('', false);
  autoSimCheckbox.parent(autoGroup);

  const autoLabel = createSpan('Auto sauna simulation');
  autoLabel.parent(autoGroup);

  // progress bar under the checkbox
  autoSimProgressContainer = createDiv();
  autoSimProgressContainer.parent(autoGroup);
  autoSimProgressContainer.addClass('auto-progress-wrap');

  autoSimProgressBar = createDiv();
  autoSimProgressBar.parent(autoSimProgressContainer);
  autoSimProgressBar.addClass('auto-progress-bar');

  autoSimCheckbox.changed(() => {
    autoSimEnabled = autoSimCheckbox.checked();
    if (autoSimEnabled) {
      resetAutoSimulationState();
      autoSimProgressContainer.style('opacity', '1');
    } else {
      autoSimProgressContainer.style('opacity', '0');
      if (autoSimProgressBar) autoSimProgressBar.style('width', '0%');
    }
  });

  positionSliders();
}

// ---------- MUSIC SELECTOR INIT + HANDLERS ----------

function initMusicSelector() {
  const parentEl = canvas.parent();

  musicListContainer = createDiv();
  musicListContainer.parent(parentEl);
  musicListContainer.addClass('music-selector-container');

  const header = createDiv('Soundscape');
  header.parent(musicListContainer);
  header.addClass('music-selector-header');

  const subtitle = createDiv('Select ambience');
  subtitle.parent(musicListContainer);
  subtitle.addClass('music-selector-subtitle');

  musicListInner = createDiv();
  musicListInner.parent(musicListContainer);
  musicListInner.addClass('music-selector-list');

  musicItemEls = {};

  MUSIC_TYPES.forEach((key) => {
    const item = createDiv(formatMusicLabel(key));
    item.parent(musicListInner);
    item.addClass('music-item');

    // badge for lo-fi to indicate active/available
    if (key === 'lofi') {
      const badge = createSpan('LIVE');
      badge.parent(item);
      badge.addClass('music-badge');
      badge.addClass('live-green'); // default: lo-fi selected, LIVE is green
      liveBadgeEl = badge;
    }

    item.mousePressed(() => handleMusicChange(key));
    musicItemEls[key] = item;
  });

  musicMessageEl = createDiv('');
  musicMessageEl.parent(musicListContainer);
  musicMessageEl.addClass('music-selector-message');

  setActiveMusicItem('lofi');

  // info panel, now bottom-center
  const saunaInfoPanel = createDiv();
  saunaInfoPanel.parent(parentEl);
  saunaInfoPanel.addClass('sauna-info-panel');

  const saunaInfoText = createDiv(
    'Music and art are generated in real-time by the current state of the sauna. If you run into any problem, please refresh 🤗.'
  );
  saunaInfoText.parent(saunaInfoPanel);
  saunaInfoText.addClass('sauna-info-text');
}

function formatMusicLabel(key) {
  const mapLabels = {
    lofi: 'Lo-fi',
    nature_ambience: 'Nature ambience',
    rain_sounds: 'Rain sounds',
    binaural_beats: 'Binaural beats',
    tibetan_bowls: 'Tibetan bowls',
    arctic_wind: 'Arctic wind',
    forest_stream: 'Forest stream',
    minimal_ambient: 'Minimal ambient',
    deep_drone: 'Deep drone',
    ocean_waves: 'Ocean waves'
  };
  return mapLabels[key] || key.replace(/_/g, ' ');
}

function updateLiveBadgeColor(mode) {
  if (!liveBadgeEl) return;
  if (mode === 'green') {
    liveBadgeEl.removeClass('live-orange');
    liveBadgeEl.addClass('live-green');
  } else if (mode === 'orange') {
    liveBadgeEl.removeClass('live-green');
    liveBadgeEl.addClass('live-orange');
  }
}

function startNatureTrack() {
  // ensure audio context + synth init exists (even if we mute synth)
  if (!audioStarted) {
    userStartAudio();
    initSound();
    audioStarted = true;
  }

  if (!naturePlayer) {
    // shared MP3 file for all non-lofi tracks
    naturePlayer = loadSound(
      '/nature.mp3',
      () => {
        naturePlayerLoaded = true;
        naturePlayer.setLoop(true);
        naturePlayer.amp(0.75, 0.25);
        naturePlayer.play();
      },
      (err) => {
        console.error('Error loading /public/nature.mp3', err);
      }
    );
  } else {
    if (!naturePlayer.isPlaying()) {
      naturePlayer.loop();
      naturePlayer.amp(0.75, 0.25);
    }
  }
}

function stopNatureTrack() {
  if (naturePlayer && naturePlayer.isPlaying()) {
    naturePlayer.stop();
  }
}

function handleMusicChange(key) {
  // move LIVE badge next to the newly selected item
  if (liveBadgeEl && musicItemEls[key]) {
    liveBadgeEl.parent(musicItemEls[key]);
  }

  if (key === 'lofi') {
    // switch to real-time lo-fi engine: LIVE is green
    currentMusic = 'lofi';
    setActiveMusicItem('lofi');

    if (musicMessageEl) {
      musicMessageEl.html('');
      musicMessageEl.style('color', 'rgba(255, 255, 255, 0.7)');
    }

    updateLiveBadgeColor('green');

    stopNatureTrack();
    if (masterGain) {
      masterGain.amp(0.7, 0.4);
    }
  } else {
    // non-lofi selection: MP3 playback, LIVE turns orange
    currentMusic = key;
    setActiveMusicItem(key);

    if (musicMessageEl) {
      musicMessageEl.html('Real-time coming soon!');
      musicMessageEl.style('color', 'rgba(253, 186, 116, 0.95)');
    }

    updateLiveBadgeColor('orange');

    if (masterGain) {
      masterGain.amp(0.0, 0.6);
    }
    startNatureTrack();
  }
}


function setActiveMusicItem(key) {
  for (const type in musicItemEls) {
    const el = musicItemEls[type];
    if (!el) continue;
    if (type === key) {
      el.addClass('is-active');
    } else {
      el.removeClass('is-active');
    }
  }
}

function positionSliders() {
  if (!controlsContainer) return;

  controlsContainer.style('right', '24px');
  controlsContainer.style('bottom', '24px');
  controlsContainer.style('left', '');
  controlsContainer.style('transform', '');
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initDots();
  initHaloOrbs();
  positionSliders();
}


// ---------- sauna cycle helpers ----------

function initSaunaCycle() {
  saunaCycleDuration = random(1500, 3000); // N between 1500ms and 3000ms
  saunaCycleStart = millis();
  saunaShapeType = floor(random(3));       // randomly choose shape each cycle
}

// ---------- auto-simulation logic ----------

function initAutoSimulationState() {
  simStates = {
    temp:      makeSimState(tempSlider,      15, 110),
    humidity:  makeSimState(humiditySlider,   0, 100),
    proximity: makeSimState(proximitySlider,  0, 200),
    people:    makeSimState(peopleSlider,     0,  50)
  };
  initSaunaCycle(); // first cycle defines both visual + random data timing
}

function resetAutoSimulationState() {
  initAutoSimulationState();
  if (autoSimProgressBar) {
    autoSimProgressBar.style('width', '0%');
  }
}

function makeSimState(slider, min, max) {
  return {
    slider,
    min,
    max
  };
}

// every saunaCycleDuration ms, update all "random sauna data" once
function updateAutoSimulation() {
  const now = millis();
  const elapsed = now - saunaCycleStart;

  if (elapsed >= saunaCycleDuration) {
    // one "sauna tick": move all sliders a bit
    for (const key in simStates) {
      const state = simStates[key];
      if (!state) continue;

      const current = state.slider.value();
      const maxDelta = (state.max - state.min) * 0.15;
      let next = current + random(-maxDelta, maxDelta);
      next = constrain(Math.round(next), state.min, state.max);
      state.slider.value(next);
    }

    // start a new cycle with a new random N in [1500, 3000] ms
    initSaunaCycle();

    // reset bar visually at new cycle start
    if (autoSimProgressBar) {
      autoSimProgressBar.style('width', '0%');
    }
  }
}

// update the DOM progress bar for current cycle
function updateAutoSimProgressUI() {
  if (!autoSimEnabled) return;
  if (!autoSimProgressContainer || !autoSimProgressBar) return;

  const now = millis();
  const elapsed = now - saunaCycleStart;
  const duration = saunaCycleDuration || 1;

  let t = elapsed / duration; // 0 → start, 1 → just before new tick
  t = constrain(t, 0, 1);

  autoSimProgressBar.style('width', (t * 100).toFixed(1) + '%');
}

function initHaloOrbs() {
  haloOrbs = [];

  const totalGridSize = gridSize * dotSpacing;
  const innerRadius = totalGridSize * 0.55;               // just outside grid
  const outerRadius = min(width, height) * 0.7;           // near screen edge

  for (let i = 0; i < HALO_ORB_COUNT; i++) {
    const angle = random(TWO_PI);
    const radius = random(innerRadius, outerRadius);

    haloOrbs.push(new HaloOrb(angle, radius));
  }
}


// ---------- stat animation state ----------

function initStatAnim() {
  statAnim = [
    { lastValue: tempSlider.value(),      lastChangeTime: -9999 },
    { lastValue: humiditySlider.value(),  lastChangeTime: -9999 },
    { lastValue: proximitySlider.value(), lastChangeTime: -9999 },
    { lastValue: peopleSlider.value(),    lastChangeTime: -9999 }
  ];
}

// ---------- SOUND INITIALIZATION (LO-FI, COHERENT GROOVE) ----------

function initSound() {
  masterGain = new p5.Gain();
  masterGain.amp(0.7);
  masterGain.connect(); // to master output

  reverb = new p5.Reverb();
  reverb.process(masterGain, 4, 3);
  reverb.amp(0.6);

  // pad: 3 detuned waves
  padOsc1 = new p5.Oscillator('sine');
  padOsc2 = new p5.Oscillator('triangle');
  padOsc3 = new p5.Oscillator('sine');

  padOsc1.disconnect();
  padOsc2.disconnect();
  padOsc3.disconnect();

  padOsc1.connect(masterGain);
  padOsc2.connect(masterGain);
  padOsc3.connect(masterGain);

  padOsc1.amp(0);
  padOsc2.amp(0);
  padOsc3.amp(0);

  padOsc1.start();
  padOsc2.start();
  padOsc3.start();

  // bass
  bassOsc = new p5.Oscillator('sine');
  bassOsc.disconnect();
  bassOsc.connect(masterGain);
  bassOsc.amp(0);
  bassOsc.start();

  // pluck (small melodic accent)
  pluckOsc = new p5.Oscillator('triangle');
  pluckOsc.disconnect();
  pluckOsc.connect(masterGain);
  pluckOsc.amp(0);
  pluckOsc.start();

  pluckEnv = new p5.Envelope();
  pluckEnv.setADSR(0.01, 0.25, 0.0, 0.2);
  pluckEnv.setRange(0.18, 0);

  // kick
  kickOsc = new p5.Oscillator('sine');
  kickOsc.disconnect();
  kickOsc.connect(masterGain);
  kickOsc.freq(60);
  kickOsc.amp(0);
  kickOsc.start();

  kickEnv = new p5.Envelope();
  kickEnv.setADSR(0.001, 0.15, 0.0, 0.1);
  kickEnv.setRange(0.7, 0);

  // snare
  snareNoise = new p5.Noise('white');
  snareFilter = new p5.BandPass();
  snareNoise.disconnect();
  snareNoise.connect(snareFilter);
  snareFilter.connect(masterGain);
  snareFilter.freq(1800);
  snareFilter.res(4);
  snareNoise.amp(0);
  snareNoise.start();

  snareEnv = new p5.Envelope();
  snareEnv.setADSR(0.001, 0.12, 0.0, 0.05);
  snareEnv.setRange(0.35, 0);

  // hats
  hatNoise = new p5.Noise('white');
  hatFilter = new p5.HighPass();
  hatNoise.disconnect();
  hatNoise.connect(hatFilter);
  hatFilter.connect(masterGain);
  hatFilter.freq(6000);
  hatFilter.res(1);
  hatNoise.amp(0);
  hatNoise.start();

  hatEnv = new p5.Envelope();
  hatEnv.setADSR(0.001, 0.05, 0.0, 0.03);
  hatEnv.setRange(0.18, 0);

  // vinyl hiss
  vinylNoise = new p5.Noise('white');
  vinylFilter = new p5.BandPass();
  vinylNoise.disconnect();
  vinylNoise.connect(vinylFilter);
  vinylFilter.connect(masterGain);
  vinylFilter.freq(3200);
  vinylFilter.res(8);
  vinylNoise.amp(0);
  vinylNoise.start();
}

// p5 requires a user gesture to start audio context
function mousePressed() {
  if (!audioStarted) {
    userStartAudio();
    initSound();
    audioStarted = true;
  }
}

// ---------- SOUND UPDATES: STRONGER PARAM MAPPING ----------

function updateSound(temperature, humidityValue, proximity, people) {
  if (!audioStarted || currentMusic !== 'lofi') return;

  const now = millis();

  // slightly faster smoothing – still smooth but responsive to sliders
  tempSmooth   = lerp(tempSmooth,   temperature,     0.08);
  humSmooth    = lerp(humSmooth,    humidityValue,   0.08);
  peopleSmooth = lerp(peopleSmooth, people,          0.12);
  proxSmooth   = lerp(proxSmooth,   proximity,       0.12);

  const temp01   = constrain(map(tempSmooth,   15, 110, 0, 1), 0, 1);
  const hum01    = constrain(map(humSmooth,     0, 100, 0, 1), 0, 1);
  const people01 = constrain(map(peopleSmooth,  0,  50, 0, 1), 0, 1);
  const prox01   = constrain(map(proxSmooth,    0, 200, 0, 1), 0, 1);

  // "energy" = how intense the beat is (temp + people + a bit of proximity)
  const energy = constrain(
    temp01   * 0.5 +
    people01 * 0.35 +
    prox01   * 0.15,
    0, 1
  );

  // "space" = how wet / roomy the sound is (humidity)
  const space = hum01; // 0 = dry, 1 = very wet

  // 1) TEMPO – clearly slower vs faster
  const lfo = sin(now * 0.0005) * 2;   // tiny natural drift
  bpm = 65 + energy * 30 + lfo;        // 65 → 95 BPM
  bpm = constrain(bpm, 60, 98);
  stepInterval = 60000 / (bpm * 4);    // 16th notes

  // 2) HARMONY – temperature chooses chord family (same chords, different region)
  let tNorm = temp01;
  let targetChordIdx = floor(map(tNorm, 0, 1, 0, LOFI_CHORDS.length - 0.001));
  targetChordIdx = constrain(targetChordIdx, 0, LOFI_CHORDS.length - 1);

  // 3) TEXTURE – humidity gives more or less reverb + vinyl
  const vinylLevel = map(space, 0, 1, 0.0, 0.13);
  vinylNoise.amp(vinylLevel, 0.8);

  const reverbWet = map(space, 0, 1, 0.15, 0.98);
  reverb.amp(reverbWet);

  // 4) DENSITY – people/energy control how full the mix feels
  const padAmp = map(energy, 0, 1, 0.0, 0.24);
  padOsc1.amp(padAmp * 0.85, 0.8);
  padOsc2.amp(padAmp * 0.6,  0.8);
  padOsc3.amp(padAmp * 0.5,  0.8);

  const bassAmp = map(energy, 0, 1, 0.03, 0.18);
  bassOsc.amp(bassAmp, 0.6);

  // 5) BRIGHTNESS / DETAIL – use energy for top-end hats brightness
  const hatCutoff = map(energy, 0, 1, 3500, 10000);
  hatFilter.freq(hatCutoff);

  // ---------- STEP CLOCK ----------

  if (now - lastStepTime >= stepInterval) {
    lastStepTime = now;
    stepIndex = (stepIndex + 1) % 16;

    // bar start = update chords once per bar
    if (stepIndex === 0) {
      barIndex = (barIndex + 1) % 64;

      const chord = LOFI_CHORDS[targetChordIdx];

      // slightly higher roots when very energetic
      const baseRoot = LOFI_ROOT_MIDI + (energy > 0.7 ? 2 : 0);

      const note1 = midiToFreq(baseRoot + chord[0]);
      const note2 = midiToFreq(baseRoot + chord[1]);
      const note3 = midiToFreq(baseRoot + chord[2]);
      const bassNote = midiToFreq(baseRoot - 12 + chord[0]);

      // small detune wobble
      const wobble1 = 1 + sin(now * 0.0005) * 0.015;
      const wobble2 = 1 + sin(now * 0.0004 + 1.3) * 0.02;
      const wobble3 = 1 + sin(now * 0.00045 + 2.1) * 0.012;

      padOsc1.freq(note1 * wobble1);
      padOsc2.freq(note2 * wobble2);
      padOsc3.freq(note3 * wobble3);
      bassOsc.freq(bassNote);
    }

    // ---------- DRUM + MELODY PATTERN (ENERGY-DEPENDENT) ----------

    // KICK:
    // low energy → very sparse
    // mid energy → your original pattern + ghost
    // high energy → 4-on-the-floor + several ghosts
    if (energy < 0.33) {
      if (stepIndex === 0 || stepIndex === 8) {
        triggerKick();
      }
    } else if (energy < 0.66) {
      if (stepIndex === 0 || stepIndex === 8) {
        triggerKick();
      }
      if (stepIndex === 12 && random() < 0.5) {
        triggerKick(1);
      }
    } else {
      if (stepIndex === 0 || stepIndex === 4 || stepIndex === 8 || stepIndex === 12) {
        triggerKick();
      }
      if ((stepIndex === 2 || stepIndex === 10 || stepIndex === 14) && random() < 0.6) {
        triggerKick(1);
      }
    }

    // SNARE:
    // always backbeat on 2 & 4, with occasional ghosts when very energetic
    if (stepIndex === 4 || stepIndex === 12) {
      triggerSnare();
    }
    if (energy > 0.75 && (stepIndex === 6 || stepIndex === 14) && random() < 0.3) {
      triggerSnare();
    }

    // HATS:
    // clearly change from subtle to very busy
    const hatProb = map(energy, 0, 1, 0.1, 0.9);
    if (random() < hatProb) {
      triggerHat();
    }

    // PLUCKS:
    // mainly controlled by proximity (movement / sensor)
    const pluckProb = map(prox01, 0, 1, 0.02, 0.65);
    if ((stepIndex === 3 || stepIndex === 7 || stepIndex === 11 || stepIndex === 15) &&
        random() < pluckProb) {
      triggerPluck();
    }
  }
}


// ---------- individual sound triggers ----------

function triggerKick(strength = 0) {
  if (!audioStarted) return;

  const baseFreq = 55;
  const tempFactor = map(tempSmooth, 15, 110, 0, 10);
  const kickFreq = baseFreq + tempFactor;
  kickOsc.freq(kickFreq);

  if (strength === 1) {
    kickEnv.setRange(0.4, 0);
  } else {
    kickEnv.setRange(0.7, 0);
  }
  kickEnv.play(kickOsc, 0);
}

function triggerSnare() {
  if (!audioStarted) return;
  snareEnv.play(snareNoise, 0);
}

function triggerHat() {
  if (!audioStarted) return;
  hatEnv.play(hatNoise, 0);
}

function triggerPluck() {
  if (!audioStarted) return;

  // small melodic moves around the current chord root
  const baseMidi = LOFI_ROOT_MIDI + 12; // one octave up
  const offsets = [0, 2, 3, 5, 7]; // minor-ish scale
  const offset = random(offsets);
  const noteFreq = midiToFreq(baseMidi + offset);

  pluckOsc.freq(noteFreq);
  pluckEnv.play(pluckOsc, 0);
}

// ---------- SAUNA STATE BACKGROUND (COLOR FROM TEMP + HUMIDITY) ----------

function drawSaunaBackground(temperature, humidityValue) {
  push();
  colorMode(HSB, 360, 100, 100, 100);
  noStroke();

  const tempNorm = constrain(map(temperature, 15, 110, 0, 1), 0, 1);
  const humNorm  = constrain(map(humidityValue, 0, 100, 0, 1), 0, 1);

  // hue: cool blue at low temp → hot orange/red at high temp
  const baseHue = lerp(210, 25, tempNorm);

  // saturation: warmer and wetter = more saturated
  let baseSat = lerp(22, 70, tempNorm);
  baseSat = lerp(baseSat, 95, humNorm);

  // brightness: dry → brighter, wet → more subdued, smoky
  let baseBright = lerp(18, 60, tempNorm);
  baseBright = lerp(baseBright, 95, 1 - humNorm * 0.8);

  // create a vertical gradient (top → bottom)
  const topCol = color(
    baseHue + 8,
    baseSat * 0.7,
    baseBright * 0.6
  );
  const midCol = color(
    baseHue,
    baseSat,
    baseBright
  );
  const bottomCol = color(
    baseHue - 10,
    baseSat * 1.1,
    baseBright * 0.85
  );

  // vertical blend: top → mid → bottom
  for (let y = 0; y < height; y++) {
    const t = y / max(height - 1, 1);
    let col;
    if (t < 0.45) {
      const tt = t / 0.45;
      col = lerpColor(topCol, midCol, tt);
    } else {
      const tt = (t - 0.45) / 0.55;
      col = lerpColor(midCol, bottomCol, tt);
    }
    stroke(col);
    line(0, y, width, y);
  }

  // radial "stove" glow near the bottom center
  const glowX = width * 0.5;
  const glowY = height * 0.92;
  const maxR  = max(width, height) * 0.8;

  noFill();
  for (let r = maxR; r > 0; r -= 40) {
    const t = 1 - r / maxR;
    const glowHue = baseHue - 12;
    const glowSat = baseSat * (0.9 + 0.3 * t);
    const glowBright = baseBright * (1.1 + 0.5 * t);

    const alpha = map(t, 0, 1, 0, 35 + 40 * humNorm);
    stroke(glowHue, glowSat, glowBright, alpha);
    ellipse(glowX, glowY, r * 1.3, r);
  }

  // soft vignette so edges stay dark and the grid pops
  const vignetteSteps = 12;
  for (let i = 0; i < vignetteSteps; i++) {
    const v = i / (vignetteSteps - 1);
    const alpha = map(v, 0, 1, 0, 18 + humNorm * 14);
    stroke(0, 0, 0, alpha);
    noFill();
    const margin = v * max(width, height) * 0.35;
    rect(
      -margin,
      -margin,
      width + margin * 2,
      height + margin * 2,
      32
    );
  }

  pop();
}

// ---------- northern lights aurora background (full-screen ribbons) ----------

function drawAurora(temperature, humidityValue) {
  push();
  colorMode(HSB, 360, 100, 100, 255);
  noFill();

  const tempNorm = constrain(map(temperature, 15, 110, 0, 1), 0, 1);
  const humNorm  = constrain(map(humidityValue, 0, 100, 0, 1), 0, 1);

  // keep a cool/greenish base, but softer
  const baseHue = lerp(130, 160, tempNorm);

  // much softer alpha for subtle ribbons
  const alphaBase = lerp(25, 70, humNorm);

  const layers = 7;
  for (let layer = 0; layer < layers; layer++) {
    const layerFactor = layer / (layers - 1);       // 0..1
    const yBase = lerp(height * 0.15, height * 0.85, layerFactor);
    const amp   = lerp(height * 0.25, height * 0.08, layerFactor);

    // pastel: low saturation, high brightness
    const hue    = (baseHue + layer * 10) % 360;
    const sat    = lerp(18, 28, layerFactor);       // reduced saturation
    const bright = lerp(92, 98, layerFactor);       // very bright / milky
    let alpha    = alphaBase - layer * 5;
    alpha = max(alpha, 0);

    stroke(hue, sat, bright, alpha);
    strokeWeight(0.7 - layerFactor * 0.3);          // thinner, more delicate

    beginShape();
    for (let x = -40; x <= width + 40; x += 8) {
      const nx = x * 0.0018;
      const ny = auroraTime * 0.00035 + layer * 4.0;

      const n1 = noise(nx, ny);
      const n2 = noise(nx * 0.7 + 100.0, ny * 1.3 + 50.0);
      const wave = (n1 * 0.6 + n2 * 0.4 - 0.5) * 2.0;

      const y = yBase + wave * amp;
      curveVertex(x, y);
    }
    endShape();
  }

  pop();
  auroraTime += 16; // slow drift
}

function drawGridPlate() {
  const totalGridSize = gridSize * dotSpacing;
  const offsetX = (width - totalGridSize) / 2;
  const offsetY = (height - totalGridSize) / 2;

  push();
  // still in HSB mode with alpha 0–255
  noStroke();
  // slightly transparent dark plate behind the grid
  fill(0, 0, 0, 150); // black with alpha
  rect(
    offsetX - 24,
    offsetY - 24,
    totalGridSize + 48,
    totalGridSize + 48,
    32
  );
  pop();
}

function drawHaloOrbs(temperature, humidityValue, proximity, people) {
  if (!haloOrbs || haloOrbs.length === 0) return;

  const tempNorm   = constrain(map(temperature,   15, 110, 0, 1), 0, 1);
  const humNorm    = constrain(map(humidityValue,  0, 100, 0, 1), 0, 1);
  const proxNorm   = constrain(map(proximity,      0, 200, 0, 1), 0, 1);
  const peopleNorm = constrain(map(people,         0,  50, 0, 1), 0, 1);

  push();
  colorMode(HSB, 360, 100, 100, 255);
  noStroke();

  const centerX = width * 0.5;
  const centerY = height * 0.5;

  // subtle link to the existing sauna palette
  const baseHue = lerp(190, 30, tempNorm);           // cooler → warmer
  const baseSat = lerp(25, 80, tempNorm);
  const baseBright = lerp(40, 95, 1 - humNorm * 0.7); // wetter = dimmer, smokier

  // more people = more "active" halo alpha
  const alphaBase = lerp(30, 110, peopleNorm);

  for (let orb of haloOrbs) {
    orb.updateAndDraw({
      centerX,
      centerY,
      baseHue,
      baseSat,
      baseBright,
      alphaBase,
      tempNorm,
      humNorm,
      proxNorm,
      peopleNorm
    });
  }

  pop();
}



// ---------- main draw ----------

function draw() {
  if (autoSimEnabled) {
    updateAutoSimulation();
    updateAutoSimProgressUI();
  }

  const temperature   = tempSlider.value();
  const humidityValue = humiditySlider.value();
  const proximity     = proximitySlider.value();
  const people        = peopleSlider.value();

  // smooth the visual background response to avoid harsh jumps
  saunaBGTemp = lerp(saunaBGTemp, temperature, 0.05);
  saunaBGHum  = lerp(saunaBGHum,  humidityValue, 0.05);

  // sauna state background + aurora ribbons behind the grid
  drawSaunaBackground(saunaBGTemp, saunaBGHum);
  drawAurora(saunaBGTemp, saunaBGHum);

  // halo visualizer around the central grid
  drawHaloOrbs(temperature, humidityValue, proximity, people);

  const humidityForPhysics = 100 - humidityValue;

  updateSound(temperature, humidityValue, proximity, people);

  const interactionX = map(proximity, 0, 200, 0, width);
  const interactionY = map(people, 0, 50, 0, height);
  influenceRadius    = map(humidityForPhysics, 0, 100, 10, 200);
  maxDistortion      = map(temperature, 15, 110, 1, 50);

  const interactionPosition = createVector(interactionX, interactionY);

  // interaction circle
  noFill();
  stroke(150, 0.1);
  strokeWeight(1);
  circle(interactionX, interactionY, influenceRadius * 2);

  // dot grid
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      dots[i][j].update(interactionPosition, temperature);
    }
  }

  drawStatsOverlay(temperature, humidityValue, proximity, people);
}

// --- stats row with change animation ---

function drawStatsOverlay(temperature, humidityValue, proximity, people) {
  const colWidth   = width / 4;
  const cardWidth  = colWidth - 24;
  const cardHeight = 130;
  const cardY      = 20;

  const stats = [
    { value: `${temperature}°C`, label: 'Temperature 🔥' },
    { value: `${humidityValue}%`, label: 'Humidity 💧' },
    { value: `${proximity}`,      label: 'Proximity 📡' },
    { value: `${people}`,         label: 'People 👥' }
  ];

  const numericValues = [temperature, humidityValue, proximity, people];

  const flashColors = [
    { r: 255, g: 140, b: 90 },
    { r: 90,  g: 190, b: 255 },
    { r: 120, g: 255, b: 160 },
    { r: 220, g: 150, b: 255 }
  ];

  const now = millis();

  push();
  colorMode(RGB, 255);
  textFont('system-ui');
  textAlign(CENTER, CENTER);
  noStroke();

  for (let i = 0; i < 4; i++) {
    const cx = colWidth * (i + 0.5);
    const x  = cx - cardWidth / 2;
    const y  = cardY;

    if (statAnim[i].lastValue !== numericValues[i]) {
      statAnim[i].lastValue = numericValues[i];
      statAnim[i].lastChangeTime = now;
    }

    const elapsed = now - statAnim[i].lastChangeTime;

    const baseSize = 56; // doubled from original 28
    let valueSize = baseSize;
    let valueColor = { r: 255, g: 255, b: 255 };

    if (elapsed >= 0 && elapsed < STAT_FLASH_DURATION) {
      const t = 1 - elapsed / STAT_FLASH_DURATION;
      valueSize = baseSize + STAT_FLASH_EXTRA_SIZE * t;

      const fc = flashColors[i];
      const mix = 1 - t;
      valueColor = {
        r: lerp(fc.r, 255, mix),
        g: lerp(fc.g, 255, mix),
        b: lerp(fc.b, 255, mix)
      };
    }

    // background container
    fill(0, 0, 0, 15);
    rect(x, y, cardWidth, cardHeight, 18);

    // value (large)
    fill(valueColor.r, valueColor.g, valueColor.b);
    textSize(valueSize);
    const valueY = y + cardHeight * 0.45;
    text(stats[i].value, cx, valueY);

    // label (bigger too)
    textSize(24); // doubled from original 12
    fill(200);
    const labelY = y + cardHeight - 24;
    text(stats[i].label, cx, labelY);
  }

  pop();
}



// --- Dot class ---

class Dot {
  constructor(x, y) {
    this.position = createVector(x, y);
    this.originalPosition = this.position.copy();
    this.velocity = createVector(0, 0);
    this.hueJitter = random(-8, 8);
  }

  update(interactionPos, temperature) {
    let vecToInteraction = this.originalPosition.copy();
    vecToInteraction.sub(interactionPos);

    const distanceToInteraction = vecToInteraction.mag();
    const phase = map(distanceToInteraction, 0, influenceRadius, 0, PI);

    vecToInteraction.normalize();
    vecToInteraction.mult(maxDistortion * sin(phase));

    let strokeWidth;
    if (distanceToInteraction < influenceRadius) {
      strokeWidth = 1 + 10 * abs(cos(phase / 2));
    } else {
      strokeWidth = map(
        min(distanceToInteraction, width),
        0,
        width,
        5,
        0.1
      );
    }

    const targetPosition = createVector(
      this.originalPosition.x + vecToInteraction.x,
      this.originalPosition.y + vecToInteraction.y
    );

    let attractionVector = this.position.copy();
    attractionVector.sub(targetPosition);

    const attractionStrength = map(
      interactionPos.dist(this.position),
      0,
      2 * width,
      0.1,
      0.01
    );
    attractionVector.mult(-attractionStrength);

    this.velocity.add(attractionVector);
    this.velocity.mult(0.87);
    this.position.add(this.velocity);

    let t = map(temperature, 15, 110, 0, 1);
    let baseHue = lerp(180, 10, t) + this.hueJitter;
    let sat = 20;
    let bright = 90;

    stroke(baseHue, sat, bright);
    strokeWeight(strokeWidth);
    point(this.position.x, this.position.y);
  }
}

class HaloOrb {
  constructor(angle, baseRadius) {
    this.angle = angle;
    this.baseRadius = baseRadius;
    this.speedJitter = random(0.65, 1.4);
    this.sizeBase = random(4, 10);
    this.noiseOffset = random(1000);
  }

  updateAndDraw(params) {
    const {
      centerX,
      centerY,
      baseHue,
      baseSat,
      baseBright,
      alphaBase,
      tempNorm,
      humNorm,
      proxNorm,
      peopleNorm
    } = params;

    // global time for synced pulsing
    const now = millis();

    // rotation speed: mostly from proximity (movement) + a bit from temperature
    const baseSpeed = 0.00006;
    const speed = (baseSpeed + proxNorm * 0.0005 + tempNorm * 0.00005) * this.speedJitter;

    // advance angle using deltaTime so it feels stable across machines
    this.angle += speed * (deltaTime || 16);

    // radial wobble: more proximity = more wobble
    const wobbleAmp = lerp(3, 45, proxNorm);
    const wobble =
      sin(now * 0.0012 + this.noiseOffset) * wobbleAmp;

    const radius = this.baseRadius + wobble;
    const x = centerX + cos(this.angle) * radius;
    const y = centerY + sin(this.angle) * radius;

    // size: base → larger with more people, pulsing with a slow beat
    const beatPhase = now * 0.004 + this.noiseOffset * 0.3;
    const pulse = 0.5 + 0.5 * sin(beatPhase);
    const size =
      this.sizeBase +
      lerp(0, 10, peopleNorm) * pulse;

    // color: slight per-orb hue shift + humidity-dependent softness
    const hue = baseHue + this.noiseOffset * 0.03;
    const sat = baseSat * lerp(0.7, 1.1, tempNorm);
    const bright = baseBright * (0.9 + 0.25 * pulse);

    // wetter air = more diffuse, less opaque halo
    const alpha = alphaBase * lerp(0.4, 1.0, 1 - humNorm * 0.6);

    fill(hue, sat, bright, alpha);

    // slight elongation in direction of motion for a "trail" feel
    const trailScale = 1.0 + proxNorm * 0.8;
    const trailW = size * trailScale;
    const trailH = size * lerp(1.1, 1.8, proxNorm);

    push();
    translate(x, y);
    rotate(this.angle);
    ellipse(0, 0, trailW, trailH);
    pop();
  }
}


// At the VERY END of sketch.js

window.startSaunaSketch = function () {
  if (!window._saunaP5 && window.p5) {
    // global-mode p5 instance; uses the global setup()/draw()
    window._saunaP5 = new window.p5();
  }
};

window.stopSaunaSketch = function () {
  if (window._saunaP5) {
    window._saunaP5.remove();
    window._saunaP5 = undefined;
  }
};
