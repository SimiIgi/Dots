const elapsedTime = document.querySelector("[data-elapsed-time]");
const topDot = document.querySelector("[data-top-dot]");
const backButton = document.querySelector("[data-back-button]");
const welcomeCopy = document.querySelector("[data-welcome-copy]");
const returnCopy = document.querySelector("[data-return-copy]");
const returnCta = document.querySelector("[data-return-cta]");
const welcomeNote = document.querySelector("[data-welcome-note]");
const dotHint = document.querySelector("[data-dot-hint]");
const scrollIndicator = document.querySelector("[data-scroll-indicator]");
const dotStat = document.querySelector("[data-dot-stat]");
const dotStatValue = document.querySelector("[data-dot-stat-value]");
const dotStatLabel = document.querySelector("[data-dot-stat-label]");
const interactiveDotsLayer = document.querySelector("[data-interactive-dots]");
const customCursor = document.querySelector("[data-custom-cursor]");
const backgroundDotsCanvas = document.querySelector("[data-background-dots]");
const backgroundDotsContext = backgroundDotsCanvas.getContext("2d");
const startedAt = Date.now();

const DOTS_START_THRESHOLD = 0.84;
const DOTS_RESET_THRESHOLD = 0.02;
const ACTIVE_DOT_MESSAGE = "hold circle for more";
const DOTS_FLOAT_START_BUFFER = 0;
const DEFAULT_TOPBAR_BUTTON_LABEL = "Next";
const RETURN_MODE_TOPBAR_BUTTON_LABEL = "To Start";

const mutedColor =
  getComputedStyle(document.documentElement).getPropertyValue("--muted").trim() ||
  "#b8b8b8";

const dotPresets = [
  {
    x: 0.18,
    y: 0.38,
    r: 18,
    delay: 250,
    pressScale: 3.9,
    statValue: "70%",
    statLabel: "ludi sa vrati k tejto casti este raz",
  },
  {
    x: 0.72,
    y: 0.18,
    r: 17,
    delay: 600,
    pressScale: 4.8,
    statValue: "12m",
    statLabel: "je priemerny cas, ktory tu ludia stravia",
  },
  {
    x: 0.59,
    y: 0.5,
    r: 17,
    delay: 950,
    pressScale: 6.1,
    statValue: "83%",
    statLabel: "interakcii sa udeje po podrzani bodu",
  },
  {
    x: 0.25,
    y: 0.2,
    r: 18,
    delay: 1200,
    pressScale: 4.5,
    statValue: "4.2x",
    statLabel: "vyssi zaujem vytvori vacsi bod",
  },
  {
    x: 0.78,
    y: 0.82,
    r: 17,
    delay: 1500,
    pressScale: 3.6,
    statValue: "29%",
    statLabel: "ludi preferuje jemnejsie tempo animacie",
  },
  {
    x: 0.14,
    y: 0.78,
    r: 18,
    delay: 1850,
    pressScale: 4.9,
    statValue: "91%",
    statLabel: "odpoveda lepsie na vizualny hint pri bode",
  },
  {
    x: 0.5,
    y: 0.24,
    r: 17,
    delay: 2200,
    pressScale: 5.5,
    statValue: "3.1s",
    statLabel: "trva priemerne, kym si niekto zvoli jednu bodku",
  },
];

const state = {
  isSettled: false,
  scrollProgress: 0,
  targetScrollProgress: 0,
  dots: [],
  dotButtons: [],
  width: window.innerWidth,
  height: window.innerHeight,
  dotsStarted: false,
  dotsStartTime: 0,
  hintDelayStartTime: 0,
  dotsPaused: false,
  isDotActivated: false,
  isReturnMode: false,
  returnModeStartTime: 0,
  selectedDotIndex: null,
  pressedDotIndex: null,
  cursorX: window.innerWidth / 2,
  cursorY: window.innerHeight / 2,
  introSettleTimeoutId: null,
  canActivateTopDot: false,
};

function formatElapsedTime(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function updateElapsedTime() {
  const totalSeconds = Math.floor((Date.now() - startedAt) / 1000);
  elapsedTime.textContent = formatElapsedTime(totalSeconds);
}

function resizeBackgroundDotsCanvas() {
  const dpr = window.devicePixelRatio || 1;
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  backgroundDotsCanvas.width = state.width * dpr;
  backgroundDotsCanvas.height = state.height * dpr;
  backgroundDotsCanvas.style.width = `${state.width}px`;
  backgroundDotsCanvas.style.height = `${state.height}px`;
  backgroundDotsContext.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function createBackgroundDots() {
  state.dots = dotPresets.map((preset, index) => ({
    targetX: preset.x * state.width,
    targetY: preset.y * state.height,
    x: preset.x * state.width,
    y: state.isDotActivated ? preset.y * state.height : -80,
    radius: preset.r,
    delay: preset.delay,
    enterDuration: 1800 + index * 70,
    driftX: 8 + index * 1.2,
    driftY: 6 + index * 1.1,
    driftSpeedX: 0.82 + index * 0.07,
    driftSpeedY: 0.62 + index * 0.06,
    phaseX: index * 0.9,
    phaseY: index * 1.1,
    pressScale: preset.pressScale,
    statValue: preset.statValue,
    statLabel: preset.statLabel,
    lockedX: null,
    lockedY: null,
  }));

  if (state.isDotActivated) {
    state.dots.forEach((dot) => {
      dot.x = dot.targetX;
      dot.y = dot.targetY;
    });
  }
}

function createInteractiveDots() {
  interactiveDotsLayer.innerHTML = "";
  state.dotButtons = state.dots.map((dot, index) => {
    const button = document.createElement("button");
    button.className = "interactive-dot";
    button.type = "button";
    button.setAttribute("aria-label", `Statistika ${index + 1}`);
    button.dataset.dotIndex = String(index);
    interactiveDotsLayer.appendChild(button);
    return button;
  });
}

function getDotsFloatingProgress(now) {
  if (!state.dotsStarted || state.dotsStartTime === 0) return 0;

  const latestDotArrival = state.dots.reduce(
    (maxArrival, dot) => Math.max(maxArrival, dot.delay + dot.enterDuration),
    0,
  );
  const floatingElapsed = now - state.dotsStartTime - latestDotArrival - DOTS_FLOAT_START_BUFFER;

  return Math.max(0, floatingElapsed);
}

function easeOutCubic(value) {
  return 1 - (1 - value) ** 3;
}

function updateStatDisplay() {
  const dot =
    state.pressedDotIndex === null || state.selectedDotIndex === null
      ? null
      : state.dots[state.selectedDotIndex];
  if (!dot) {
    dotStat.classList.remove("is-visible");
    return;
  }

  dotStatValue.textContent = dot.statValue;
  dotStatLabel.textContent = dot.statLabel;
  dotStat.classList.add("is-visible");
}

function updateInteractiveDotsVisibility() {
  interactiveDotsLayer.classList.toggle("is-active", state.isDotActivated);
  backgroundDotsCanvas.classList.toggle("is-hidden", state.isDotActivated);
}

function syncInteractiveDots() {
  state.dotButtons.forEach((button, index) => {
    const dot = state.dots[index];
    if (!dot) return;

    const isSelected = state.selectedDotIndex === index;
    const isPressing = state.pressedDotIndex === index;
    const scale = isPressing ? dot.pressScale : 1;
    const size = dot.radius * 2;

    button.style.left = `${dot.x}px`;
    button.style.top = `${dot.y}px`;
    button.style.width = `${size}px`;
    button.style.height = `${size}px`;
    button.style.opacity = state.isDotActivated ? "1" : "0";
    button.style.setProperty("--interactive-dot-scale", scale.toFixed(3));
    button.classList.toggle("is-selected", isSelected);
    button.classList.toggle("is-pressing", isPressing);
  });
}

function drawBackgroundDots(now) {
  backgroundDotsContext.clearRect(0, 0, state.width, state.height);

  if (!state.dotsStarted) {
    syncInteractiveDots();
    window.requestAnimationFrame(drawBackgroundDots);
    return;
  }

  state.dots.forEach((dot) => {
    if (!state.dotsPaused) {
      const elapsed = now - state.dotsStartTime - dot.delay;

      if (elapsed < 0) return;

      const enterProgress = Math.min(1, elapsed / dot.enterDuration);
      const fallProgress = easeOutCubic(enterProgress);
      const driftTime = elapsed * 0.001;
      const driftWeight = 0.18 + enterProgress * 0.82;
      const driftOffsetX =
        Math.sin(driftTime * dot.driftSpeedX + dot.phaseX) * dot.driftX * driftWeight;
      const driftOffsetY =
        Math.cos(driftTime * dot.driftSpeedY + dot.phaseY) * dot.driftY * driftWeight;

      const nextX = dot.targetX + driftOffsetX;
      const nextY =
        -dot.radius * 3 +
        (dot.targetY + dot.radius * 3) * fallProgress +
        driftOffsetY;

      if (state.pressedDotIndex !== null && state.dots[state.pressedDotIndex] === dot) {
        dot.x = dot.lockedX ?? nextX;
        dot.y = dot.lockedY ?? nextY;
      } else {
        dot.x = nextX;
        dot.y = nextY;
      }
    }

    const dotsOpacity = state.isReturnMode
      ? 0.68
      : Math.min(1, Math.max(0, (state.scrollProgress - 0.7) / 0.18));

    backgroundDotsContext.beginPath();
    backgroundDotsContext.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
    backgroundDotsContext.fillStyle = `${mutedColor}${Math.round(dotsOpacity * 255)
      .toString(16)
      .padStart(2, "0")}`;
    backgroundDotsContext.fill();
  });

  syncInteractiveDots();
  window.requestAnimationFrame(drawBackgroundDots);
}

function syncCursor() {
  customCursor.style.transform = `translate(${state.cursorX}px, ${state.cursorY}px)`;
  customCursor.classList.toggle("is-visible", state.isDotActivated);
  document.body.classList.toggle("cursor-active", state.isDotActivated);
}

function scheduleIntroSettle() {
  topDot.classList.add("is-settled");
  state.isSettled = true;
  state.introSettleTimeoutId = null;
  syncDotScrollState();
}

function syncDotScrollState() {
  const now = performance.now();
  const returnRevealProgress = state.isReturnMode
    ? Math.min(1, Math.max(0, (now - state.returnModeStartTime - 620) / 320))
    : 0;
  const top = 50 + state.scrollProgress * 36;
  const scale = 1 - state.scrollProgress * 0.55;
  const revealProgress = Math.max(0, (state.scrollProgress - 0.78) / 0.16);
  const noteRevealProgress = Math.max(0, (state.scrollProgress - 0.95) / 0.04);
  const isShowingStat = state.isDotActivated && state.pressedDotIndex !== null;
  const copyOpacity = state.isReturnMode
    ? returnRevealProgress
    : isShowingStat
      ? 0
      : Math.min(1, revealProgress);
  const copyShift = state.isReturnMode ? -114 : 42 - revealProgress * 26;
  const noteOpacity = state.isReturnMode ? 0 : isShowingStat ? 0 : Math.min(1, noteRevealProgress);
  const noteShift = 92 - noteRevealProgress * 18;
  const isNearBottom = state.scrollProgress >= 0.992;
  const dotsAreFloating = getDotsFloatingProgress(now) > 0;
  const showScrollIndicator =
    !state.isDotActivated && !state.isReturnMode && state.scrollProgress < 0.04;

  if (isNearBottom && dotsAreFloating && state.hintDelayStartTime === 0) {
    state.hintDelayStartTime = now;
  }

  if (!isNearBottom || !dotsAreFloating) {
    state.hintDelayStartTime = 0;
  }

  const hintDelayProgress =
    state.hintDelayStartTime > 0 ? Math.max(0, (now - state.hintDelayStartTime - 860) / 240) : 0;
  const hintRevealProgress = state.isDotActivated ? 1 : Math.min(1, hintDelayProgress);
  const hintOpacity = Math.min(1, hintRevealProgress);
  const hintShift = 76 - hintRevealProgress * 8;
  state.canActivateTopDot = !state.isReturnMode && !state.isDotActivated && hintOpacity > 0.72;

  topDot.style.top = `${top}%`;
  topDot.style.setProperty("--dot-scale", state.isReturnMode ? "1" : scale.toFixed(3));
  topDot.style.setProperty("--dot-active-scale", state.isDotActivated ? "0.78" : "1");
  welcomeCopy.style.setProperty("--copy-opacity", copyOpacity.toFixed(3));
  welcomeCopy.style.setProperty("--copy-shift", `${copyShift.toFixed(1)}px`);
  welcomeNote.style.setProperty("--note-opacity", noteOpacity.toFixed(3));
  welcomeNote.style.setProperty("--note-shift", `${noteShift.toFixed(1)}px`);
  dotHint.style.setProperty("--hint-top", `${top}%`);
  dotHint.style.setProperty("--hint-opacity", hintOpacity.toFixed(3));
  dotHint.style.setProperty("--hint-shift", `${hintShift.toFixed(1)}px`);
  dotHint.textContent = state.isDotActivated ? ACTIVE_DOT_MESSAGE : "Click the dot in time";
  scrollIndicator.classList.toggle("is-hidden", !showScrollIndicator);

  if (!state.isReturnMode && !state.dotsStarted && state.scrollProgress >= DOTS_START_THRESHOLD) {
    state.dotsStarted = true;
    state.dotsStartTime = performance.now();
  }

  if (!state.isReturnMode && state.dotsStarted && state.scrollProgress <= DOTS_RESET_THRESHOLD) {
    state.dotsStarted = false;
    state.dotsStartTime = 0;
    state.hintDelayStartTime = 0;
    state.dotsPaused = false;
    state.isDotActivated = false;
    state.selectedDotIndex = null;
    state.pressedDotIndex = null;
    createBackgroundDots();
    createInteractiveDots();
  }

  topDot.classList.toggle(
    "is-pulsing",
    state.isReturnMode ||
      (!state.isDotActivated && state.scrollProgress < 0.04) ||
      (state.dotsStarted && dotsAreFloating && hintOpacity > 0.12 && !state.isDotActivated),
  );
  topDot.classList.toggle("is-disabled", !state.canActivateTopDot && !state.isReturnMode);
  topDot.classList.toggle("is-activated", state.isDotActivated);
  topDot.classList.toggle("is-return-mode", state.isReturnMode);
  welcomeCopy.classList.toggle("is-muted", state.isDotActivated);
  welcomeCopy.classList.toggle("is-return-copy", state.isReturnMode);
  returnCopy.classList.toggle("is-visible", state.isReturnMode);
  returnCta.classList.toggle("is-visible", state.isReturnMode);
  welcomeNote.classList.toggle("is-hidden", state.isDotActivated);
  dotHint.classList.toggle("is-active-message", state.isDotActivated);
  backButton.classList.toggle("is-visible", state.isDotActivated || state.isReturnMode);
  backButton.textContent = state.isReturnMode
    ? RETURN_MODE_TOPBAR_BUTTON_LABEL
    : DEFAULT_TOPBAR_BUTTON_LABEL;
  updateInteractiveDotsVisibility();
  updateStatDisplay();
  syncCursor();
}

function animateScrollState() {
  const difference = state.targetScrollProgress - state.scrollProgress;

  if (Math.abs(difference) > 0.0005) {
    state.scrollProgress += difference * 0.12;
  } else {
    state.scrollProgress = state.targetScrollProgress;
  }

  syncDotScrollState();
  window.requestAnimationFrame(animateScrollState);
}

function handleWheel(event) {
  if (!state.isSettled) return;

  event.preventDefault();
  if (state.isReturnMode) return;

  const delta = event.deltaY * 0.00135;
  const limitedDelta = state.isDotActivated ? Math.max(0, delta) : delta;
  state.targetScrollProgress = Math.max(0, Math.min(1, state.targetScrollProgress + limitedDelta));
}

function activateDot() {
  if (!state.dotsStarted || state.isDotActivated || state.isReturnMode || !state.canActivateTopDot) {
    return;
  }

  state.dotsPaused = false;
  state.isDotActivated = true;
  state.hintDelayStartTime = performance.now();
  state.selectedDotIndex = null;
  syncDotScrollState();
  syncInteractiveDots();
}

function restartIntro() {
  state.isSettled = false;
  state.dotsStarted = false;
  state.dotsStartTime = 0;
  state.hintDelayStartTime = 0;
  state.dotsPaused = false;
  state.isDotActivated = false;
  state.isReturnMode = false;
  state.returnModeStartTime = 0;
  state.selectedDotIndex = null;
  state.pressedDotIndex = null;
  state.targetScrollProgress = 0;
  state.scrollProgress = 0;
  createBackgroundDots();
  createInteractiveDots();
  syncDotScrollState();
  syncInteractiveDots();
  scheduleIntroSettle();
}

function returnToStart() {
  if (!state.dotsStarted) {
    state.dotsStarted = true;
    state.dotsStartTime = performance.now();
  }
  state.hintDelayStartTime = 0;
  state.dotsPaused = false;
  state.isDotActivated = false;
  state.isReturnMode = true;
  state.returnModeStartTime = performance.now();
  state.selectedDotIndex = null;
  state.pressedDotIndex = null;
  state.targetScrollProgress = 0;
  state.scrollProgress = 0;
  createBackgroundDots();
  createInteractiveDots();
  syncDotScrollState();
  syncInteractiveDots();
}

function handleTopbarButtonClick() {
  if (state.isReturnMode) {
    restartIntro();
    return;
  }

  returnToStart();
}

function handleReturnCtaClick() {
  document.body.classList.add("is-page-transitioning");
  window.setTimeout(() => {
    window.location.href = "./questionnaire.html";
  }, 220);
}

function handleInteractiveDotPointerDown(event) {
  if (!state.isDotActivated) return;

  const button = event.target.closest(".interactive-dot");
  if (!button) return;

  const index = Number(button.dataset.dotIndex);
  state.pressedDotIndex = index;
  state.selectedDotIndex = index;
  state.dots[index].lockedX = state.dots[index].x;
  state.dots[index].lockedY = state.dots[index].y;
  button.setPointerCapture(event.pointerId);
  updateStatDisplay();
  syncInteractiveDots();
}

function clearPressedDot() {
  if (state.pressedDotIndex === null) return;
  state.dots[state.pressedDotIndex].lockedX = null;
  state.dots[state.pressedDotIndex].lockedY = null;
  state.pressedDotIndex = null;
  state.selectedDotIndex = null;
  syncDotScrollState();
  syncInteractiveDots();
}

function handlePointerMove(event) {
  state.cursorX = event.clientX;
  state.cursorY = event.clientY;
  syncCursor();
}

updateElapsedTime();
window.setInterval(updateElapsedTime, 1000);
resizeBackgroundDotsCanvas();
createBackgroundDots();
createInteractiveDots();
syncInteractiveDots();
syncCursor();

scheduleIntroSettle();

window.addEventListener("wheel", handleWheel, { passive: false });
window.addEventListener("pointermove", handlePointerMove);
window.addEventListener("pointerup", clearPressedDot);
window.addEventListener("pointercancel", clearPressedDot);
topDot.addEventListener("click", activateDot);
backButton.addEventListener("click", handleTopbarButtonClick);
returnCta.addEventListener("click", handleReturnCtaClick);
interactiveDotsLayer.addEventListener("pointerdown", handleInteractiveDotPointerDown);
window.addEventListener("resize", () => {
  resizeBackgroundDotsCanvas();
  createBackgroundDots();
  createInteractiveDots();
  syncDotScrollState();
  syncInteractiveDots();
});

window.requestAnimationFrame(animateScrollState);
window.requestAnimationFrame(drawBackgroundDots);
