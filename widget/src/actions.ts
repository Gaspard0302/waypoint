import { Action, ActionStep } from "./api";

export type ConfirmFn = (
  step: ActionStep,
  allSteps: ActionStep[],
  currentIndex: number
) => Promise<boolean>;

function resolveElement(step: {
  selector?: string;
  selectors?: string[];
  text_match?: string;
}): HTMLElement | null {
  // Try selectors[] fallback chain first
  for (const sel of step.selectors ?? []) {
    const el = document.querySelector(sel);
    if (el instanceof HTMLElement) return el;
  }
  // Try primary selector
  if (step.selector) {
    const el = document.querySelector(step.selector);
    if (el instanceof HTMLElement) return el;
  }
  // Last resort: find by visible text
  if (step.text_match) {
    const needle = step.text_match.toLowerCase();
    const candidates = Array.from(
      document.querySelectorAll('button, a, [role="button"]')
    );
    for (const el of candidates) {
      if (
        el instanceof HTMLElement &&
        el.textContent?.toLowerCase().includes(needle)
      ) {
        return el;
      }
    }
  }
  return null;
}

function waitFor(fn: () => Element | null, timeout: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    function check() {
      if (fn()) {
        resolve();
      } else if (Date.now() - start >= timeout) {
        reject(new Error("waitFor timed out"));
      } else {
        requestAnimationFrame(check);
      }
    }
    check();
  });
}

function safeNavigate(url: string): void {
  if (/^(javascript|data|vbscript):/i.test(url)) {
    console.warn('[Waypoint] Blocked dangerous URL:', url);
    return;
  }
  if (url.startsWith("/") || url.startsWith("#")) {
    window.location.href = url;
  } else {
    try {
      const target = new URL(url, window.location.origin);
      if (target.hostname === window.location.hostname) {
        window.location.href = url;
      } else {
        console.warn(`[Waypoint] Blocked off-site navigation to: ${url}`);
      }
    } catch {
      console.warn(`[Waypoint] Invalid navigate URL: ${url}`);
    }
  }
}

// Execute a single step. Returns false if plan should abort.
async function executeStep(
  step: ActionStep,
  confirm: ConfirmFn,
  allSteps: ActionStep[],
  index: number
): Promise<boolean> {
  if (step.confirm_before) {
    const ok = await confirm(step, allSteps, index);
    if (!ok) return false;
  }

  switch (step.type) {
    case "navigate":
      if (step.url) safeNavigate(step.url);
      // Page reload ends the plan naturally
      return false;

    case "click": {
      const el = resolveElement(step);
      if (!el) {
        console.warn(`[Waypoint] Could not resolve element for step: "${step.description}"`);
        return false;
      }
      el.click();
      // Small pause to let SPA state settle
      await new Promise(r => setTimeout(r, 300));
      return true;
    }

    case "wait_for_selector": {
      const sel = step.selector ?? (step.selectors?.[0]);
      if (sel) {
        try {
          await waitFor(() => document.querySelector(sel), step.timeout ?? 3000);
        } catch {
          console.warn(`[Waypoint] Selector "${sel}" not found within timeout`);
          return false;
        }
      }
      return true;
    }

    case "observe":
      // Halt plan and surface observe description to user via message
      return false;

    default:
      return true;
  }
}

export async function executePlan(steps: ActionStep[], confirm: ConfirmFn): Promise<void> {
  for (let i = 0; i < steps.length; i++) {
    const shouldContinue = await executeStep(steps[i], confirm, steps, i);
    if (!shouldContinue) break;
  }
}

export async function executeAction(action: Action, confirm: ConfirmFn): Promise<void> {
  if (action.type === "plan" && action.steps?.length) {
    await executePlan(action.steps, confirm);
    return;
  }

  if (action.type === "navigate" && action.url) {
    safeNavigate(action.url);
    return;
  }

  if (action.type === "click") {
    const el = resolveElement({
      selector: action.selector,
      selectors: action.selectors,
      text_match: action.text_match,
    });
    if (el) el.click();
    return;
  }

  // "answer" type — no DOM action
}
