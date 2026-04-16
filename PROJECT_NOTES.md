# Project Notes

## Current Flow

### 1. Intro
- Large black dot falls into the center.
- Scroll reveals the floating background dots.
- `Click the dot in time` appears near the end of the intro.
- The main dot becomes clickable only after that hint is visible.

### 2. Interactive Dot Mode
- Clicking the main dot turns it into a ring.
- Background canvas dots switch into interactive DOM dots.
- Top button label changes to `Next`.
- `Welcome to Time.` stays on screen in a very soft muted state.
- Holding a gray dot enlarges it and shows a center statistic.
- Releasing the dot hides the statistic and brings back the soft welcome state.

### 3. Return Screen
- Clicking `Next` opens the return screen.
- Scroll is locked.
- The main dot is centered and pulsing again.
- `Become a dot in Time.` fades in above the dot.
- Top button label changes to `To Start`.

### 4. Restart Intro
- Clicking `To Start` replays the original intro.
- The dot falls from the top again.
- All interactive/return state is cleared.

## Main UI Areas
- `index.html`: structure for intro text, return text, stat block, top button, cursor shell.
- `style.css`: visual states, transitions, dot/button styling, custom cursor.
- `script.js`: state machine, scroll flow, mode switching, interactive dots, return screen behavior.

## Current Labels
- Intro hint: `Click the dot in time`
- Interactive hint: `hold circle for more`
- Top button in interactive mode: `Next`
- Top button in return mode: `To Start`
- Return headline: `Become a dot in Time.`

## Good Next Steps
- Replace placeholder stat copy with final English copy.
- Fine-tune hold timing and scale of each interactive dot.
- Decide whether the return screen should also have a subtle subtitle.
- Consider splitting `script.js` into smaller modules if the flow grows more.
