import { CORE_TOUCH_CHROME_DETECT } from "@/lib/core/touch-chrome";

export { CORE_TOUCH_CHROME_DETECT };

/**
 * Must run from root layout. Hard-nav only on phone/iPad (desktop stays React).
 */
export const CORE_HARD_NAV_SCRIPT = `(function(){if(window.__coreHardNav)return;${CORE_TOUCH_CHROME_DETECT}var touch=__coreIsTouchChrome();if(touch)document.documentElement.dataset.touch="true";else document.documentElement.removeAttribute("data-touch");if(!touch)return;window.__coreHardNav=1;document.addEventListener("click",function(e){var t=e.target;if(!t||!t.closest)return;var a=t.closest("a[data-core-hard-nav]");if(!a||!a.href)return;e.preventDefault();e.stopImmediatePropagation();window.location.assign(a.href);},true);})();`;

/**
 * Sheet interiors — touchend only; install only on phone/iPad chrome.
 * Desktop mouse must stay plain React (no overlay, no hard-nav refresh).
 *
 * Critical: do NOT stamp __coreOverlayLastFire before btn.click().
 * useTapHandler.fire() used to bail when that stamp was set, so overlay
 * "activated" a click that then no-op'd — Writing/Insert interiors looked dead.
 * We stopPropagation so the button's touchend path does not also fire; the
 * synthesized click is the single activation.
 */
export const CORE_OVERLAY_TAP_ROOT =
  "[data-core-side-panel],[data-core-toolbar-panel],[data-core-toolbar-backdrop],[data-notebook-setup],[data-core-notes-drawer],[data-core-notes-rail],[data-notebook-page-rail],[data-notebook-cover],[data-text-format-toolbar],[data-core-import-loading],[data-core-toolbar],[data-core-header],[data-core-hub-bar],[data-pdf-toolbar],[data-pdf-ink-toolbar],[data-pdf-loop-bar],[data-canvas-inspector],[data-core-selection-loop]";

export const CORE_OVERLAY_TAP_SCRIPT = `(function(){if(window.__coreOverlayTap)return;${CORE_TOUCH_CHROME_DETECT}if(!__coreIsTouchChrome())return;window.__coreOverlayTap=1;var ROOT=${JSON.stringify(CORE_OVERLAY_TAP_ROOT)};var start=null;var last=0;document.addEventListener("touchstart",function(e){var t=e.changedTouches&&e.changedTouches[0];if(!t)return;start={x:t.clientX,y:t.clientY};},true);document.addEventListener("touchcancel",function(){start=null;},true);document.addEventListener("touchend",function(e){var t=e.changedTouches&&e.changedTouches[0];if(!t||!start)return;var dx=Math.abs(t.clientX-start.x),dy=Math.abs(t.clientY-start.y);start=null;if(dx>36||dy>36)return;var hit=document.elementFromPoint(t.clientX,t.clientY)||e.target;if(!hit||!hit.closest)return;if(!hit.closest(ROOT))return;if(hit.closest("a[href],a[data-core-hard-nav]"))return;var btn=hit.closest("button,[role=button],[role=switch],summary,label,[data-core-chrome-action]");if(!btn||!btn.closest(ROOT))return;if(btn.tagName==="BUTTON"&&btn.type==="submit")return;if(btn.disabled)return;var now=Date.now();if(now-last<450)return;last=now;e.preventDefault();e.stopPropagation();try{btn.click();}catch(err){}},true);})();`;

export const CORE_TOUCH_BOOT_SCRIPT = `${CORE_HARD_NAV_SCRIPT}${CORE_OVERLAY_TAP_SCRIPT}`;
