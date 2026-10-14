/**
 * Phone / iPad chrome only — never Windows mouse desktops.
 *
 * Do NOT use maxTouchPoints alone or innerWidth alone (laptops / resized
 * windows would steal desktop React chrome and cause mini-refreshes).
 *
 * iPadOS 13+ often spoofs Mac + pointer:fine with a keyboard — detect via
 * MacIntel/MacPPC + multitouch, or classic iOS/Android UA.
 */
export function isTouchChrome(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.matchMedia("(hover: none)").matches) return true;
    if (window.matchMedia("(pointer: coarse)").matches) return true;
    const ua = navigator.userAgent || "";
    const android = /Android/i.test(ua);
    const classicIos = /iPad|iPhone|iPod/.test(ua);
    const ipadOsDesktopUa =
      (navigator.platform === "MacIntel" || navigator.platform === "MacPPC") &&
      (navigator.maxTouchPoints ?? 0) > 1;
    if ((android || classicIos || ipadOsDesktopUa) && (navigator.maxTouchPoints ?? 0) > 0) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/** Inline twin of isTouchChrome — keep in sync. */
export const CORE_TOUCH_CHROME_DETECT = `function __coreIsTouchChrome(){try{if(window.matchMedia("(hover: none)").matches)return true;if(window.matchMedia("(pointer: coarse)").matches)return true;var ua=navigator.userAgent||"";var android=/Android/i.test(ua);var ios=/iPad|iPhone|iPod/.test(ua);var ipad=((navigator.platform==="MacIntel"||navigator.platform==="MacPPC")&&(navigator.maxTouchPoints||0)>1);return (android||ios||ipad)&&(navigator.maxTouchPoints||0)>0;}catch(e){return false;}}`;
