const elapsedTime = document.querySelector("[data-elapsed-time]");
const topDot = document.querySelector("[data-top-dot]");
const welcomeCopy = document.querySelector("[data-welcome-copy]");
const welcomeNote = document.querySelector("[data-welcome-note]");
const startedAt = Date.now();
const state = {
  isSettled: false,
  scrollProgress: 0,
  targetScrollProgress: 0,
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

function syncDotScrollState() {
  const top = 50 + state.scrollProgress * 36;
  const scale = 1 - state.scrollProgress * 0.55;
  const revealProgress = Math.max(0, (state.scrollProgress - 0.74) / 0.18);
  const noteRevealProgress = Math.max(0, (state.scrollProgress - 0.95) / 0.04);
  const copyOpacity = Math.min(1, revealProgress);
  const copyShift = 42 - revealProgress * 26;
  const noteOpacity = Math.min(1, noteRevealProgress);
  const noteShift = 92 - noteRevealProgress * 18;

  topDot.style.top = `${top}%`;
  topDot.style.setProperty("--dot-scale", scale.toFixed(3));
  welcomeCopy.style.setProperty("--copy-opacity", copyOpacity.toFixed(3));
  welcomeCopy.style.setProperty("--copy-shift", `${copyShift.toFixed(1)}px`);
  welcomeNote.style.setProperty("--note-opacity", noteOpacity.toFixed(3));
  welcomeNote.style.setProperty("--note-shift", `${noteShift.toFixed(1)}px`);
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

  const delta = event.deltaY * 0.00135;
  state.targetScrollProgress = Math.max(
    0,
    Math.min(1, state.targetScrollProgress + delta),
  );
}

updateElapsedTime();
window.setInterval(updateElapsedTime, 1000);

window.setTimeout(() => {
  topDot.classList.add("is-settled");
  state.isSettled = true;
  syncDotScrollState();
}, 500);

window.addEventListener("wheel", handleWheel, { passive: false });
window.requestAnimationFrame(animateScrollState);
