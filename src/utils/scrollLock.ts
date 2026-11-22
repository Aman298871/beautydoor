/**
 * BeautyDoor Centralized Mobile & Desktop Scroll Lock Manager
 *
 * Implements a rock-solid, production-grade scroll lock technique:
 * 1. Captures and preserves exact scrollY position before locking.
 * 2. Uses `position: fixed` with negative top on `document.body` to completely
 *    prevent background touch-dragging on mobile (Android Chrome & iOS Safari).
 * 3. Applies `overscroll-behavior: contain` to prevent momentum scroll leakage.
 * 4. Toggles `document.body.dataset.scrollLocked = 'true'` to pause CSS animations,
 *    marquees, and moving banners while any drawer/modal is open.
 * 5. Restores original scroll position cleanly upon release.
 * 6. Reference-counted to safely handle stacked modals and route transitions.
 */

let lockCount = 0;
let savedScrollY = 0;
let previousBodyPosition = '';
let previousBodyTop = '';
let previousBodyWidth = '';
let previousBodyOverflow = '';
let previousHtmlOverflow = '';
let previousHtmlOverscroll = '';
let previousBodyOverscroll = '';

export function lockScroll(): void {
  lockCount++;
  if (typeof document === 'undefined') return;

  if (lockCount === 1) {
    savedScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    previousBodyPosition = document.body.style.position;
    previousBodyTop = document.body.style.top;
    previousBodyWidth = document.body.style.width;
    previousBodyOverflow = document.body.style.overflow;
    previousHtmlOverflow = document.documentElement.style.overflow;
    previousHtmlOverscroll = document.documentElement.style.overscrollBehavior;
    previousBodyOverscroll = document.body.style.overscrollBehavior;

    // Fixed position technique to prevent background scroll drag on iOS/Android
    document.body.style.position = 'fixed';
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'contain';
    document.documentElement.style.overscrollBehavior = 'contain';
    if (!document.body.dataset) {
      document.body.dataset = {} as DOMStringMap;
    }
    document.body.dataset.scrollLocked = 'true';
    document.body.setAttribute('data-scroll-locked', 'true');
  }
}

export function unlockScroll(): void {
  lockCount = Math.max(0, lockCount - 1);
  if (typeof document === 'undefined') return;

  if (lockCount === 0) {
    const scrollY = savedScrollY || Math.abs(parseInt(document.body.style.top || '0', 10)) || 0;
    
    document.body.style.position = previousBodyPosition || '';
    document.body.style.top = previousBodyTop || '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = previousBodyWidth || '';
    document.body.style.overflow = previousBodyOverflow || '';
    document.documentElement.style.overflow = previousHtmlOverflow || '';
    document.documentElement.style.overscrollBehavior = previousHtmlOverscroll || '';
    document.body.style.overscrollBehavior = previousBodyOverscroll || '';
    document.body.style.touchAction = '';
    if (document.body.dataset) {
      delete document.body.dataset.scrollLocked;
    }
    document.body.removeAttribute('data-scroll-locked');

    window.scrollTo(0, scrollY);
  }
}

export function forceResetScroll(): void {
  lockCount = 0;
  if (typeof document === 'undefined') return;

  const scrollY = savedScrollY || Math.abs(parseInt(document.body.style.top || '0', 10)) || 0;
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.width = '';
  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';
  document.documentElement.style.overscrollBehavior = '';
  document.body.style.overscrollBehavior = '';
  document.body.style.touchAction = '';
  delete document.body.dataset.scrollLocked;

  if (scrollY > 0) {
    window.scrollTo(0, scrollY);
  }
}

export function getScrollLockCount(): number {
  return lockCount;
}
