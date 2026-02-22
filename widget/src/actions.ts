import { Action } from "./api";

export function executeAction(action: Action): void {
  if (action.type === "navigate" && action.url) {
    // Try SPA history push first, fallback to location change
    try {
      window.history.pushState(null, "", action.url);
      // Dispatch a popstate event so SPA routers (React Router, Next.js, Vue Router) pick it up
      window.dispatchEvent(new PopStateEvent("popstate", { state: null }));
    } catch {
      window.location.href = action.url;
    }
  }

  if (action.type === "click" && action.selector) {
    const el = document.querySelector(action.selector);
    if (el instanceof HTMLElement) {
      el.click();
    }
  }
  // "answer" type has no DOM action
}
