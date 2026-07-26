// Accessibility preferences (module-level mirrors of save fields, like audio's
// muted flag — cheap to read in hot render paths). Initialized at boot from the
// save; updated by the Options scene.
// reducedMotion: camera flashes, shakes, and strobe-flicker are SKIPPED, never
// merely softened — gameplay info they carried is always duplicated elsewhere
// (popups, auras, text, sound), so nothing is lost. Photosensitivity is a
// safety issue: when in doubt, cut the effect entirely.

let reducedMotion = false;
let bigText = false;

export function setPrefs(rm: boolean, bt: boolean) { reducedMotion = rm; bigText = bt; }
export function isReducedMotion() { return reducedMotion; }
export function isBigText() { return bigText; }

// Guarded camera juice — call these instead of cameras.main.flash/shake directly.
export function fxFlash(cam: { flash: (...a: any[]) => any }, duration: number, r: number, g: number, b: number, force = false) {
  if (!reducedMotion) cam.flash(duration, r, g, b, force);
}
export function fxShake(cam: { shake: (...a: any[]) => any }, duration: number, intensity: number) {
  if (!reducedMotion) cam.shake(duration, intensity);
}
