/**
 * BeautyDoor Centralized Scroll Lock Manager
 *
 * Prevents race conditions and scroll-freezing when multiple modals,
 * drawers, or route transitions occur.
 *
 * Rules:
 * 1. Reference-counted: body overflow is only locked when active lockCount > 0.
 * 2. Never sets `touchAction = 'none'` on root document.body, as this permanently
 *    breaks touch panning and momentum scrolling on iOS and Android Chrome.
 * 3. On route transitions or unexpected unmounts, `forceResetScroll()` cleanly
 *    restores normal document scrolling.
 */

let lockCount = 0;
let previousBodyOverflow = '';
let previousHtmlOverflow = '';

export function lockScroll(): void {
  if (typeof document === 'undefined') return;

  if (lockCount === 0) {
    previousBodyOverflow = document.body.style.overflow;
    previousHtmlOverflow = document.documentElement.style.overflow;

    // Apply clean lock to body only
    document.body.style.overflow = 'hidden';
  }
  lockCount++;
}

export function unlockScroll(): void {
  if (typeof document === 'undefined') return;

  lockCount = Math.max(0, lockCount - 1);

  if (lockCount === 0) {
    document.body.style.overflow = previousBodyOverflow || '';
    document.documentElement.style.overflow = previousHtmlOverflow || '';
    document.body.style.touchAction = '';
  }
}

export function forceResetScroll(): void {
  if (typeof document === 'undefined') return;

  lockCount = 0;
  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';
  document.body.style.touchAction = '';
}

export function getScrollLockCount(): number {
  return lockCount;
}
