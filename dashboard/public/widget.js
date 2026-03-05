"use strict";
var Waypoint = (() => {
  // src/ui.ts
  var STYLES = `
  :host { all: initial; }
  *, *::before, *::after { box-sizing: border-box; }

  #wp-bubble {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: #18181b;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(0,0,0,0.18);
    z-index: 2147483647;
    transition: background 0.15s;
    font-size: 22px;
  }
  #wp-bubble:hover { background: #3f3f46; }

  #wp-panel {
    position: fixed;
    bottom: 92px;
    right: 24px;
    width: 340px;
    max-height: 520px;
    border-radius: 16px;
    background: #ffffff;
    box-shadow: 0 8px 32px rgba(0,0,0,0.16);
    z-index: 2147483646;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
  }
  #wp-panel[hidden] { display: none !important; }

  #wp-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    background: #18181b;
    color: #fff;
    font-weight: 600;
    font-size: 14px;
    flex-shrink: 0;
  }
  #wp-close {
    background: none;
    border: none;
    color: #a1a1aa;
    cursor: pointer;
    font-size: 18px;
    line-height: 1;
    padding: 0;
  }
  #wp-close:hover { color: #fff; }

  #wp-messages {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 100px;
  }

  .wp-msg {
    max-width: 85%;
    padding: 8px 12px;
    border-radius: 12px;
    line-height: 1.4;
    word-break: break-word;
  }
  .wp-msg.user {
    align-self: flex-end;
    background: #18181b;
    color: #fff;
    border-bottom-right-radius: 4px;
  }
  .wp-msg.assistant {
    align-self: flex-start;
    background: #f4f4f5;
    color: #18181b;
    border-bottom-left-radius: 4px;
  }
  .wp-msg.loading {
    align-self: flex-start;
    background: #f4f4f5;
    color: #71717a;
  }

  #wp-input-row {
    display: flex;
    gap: 8px;
    padding: 10px 12px;
    border-top: 1px solid #e4e4e7;
    flex-shrink: 0;
  }
  #wp-input {
    flex: 1;
    border: 1px solid #d4d4d8;
    border-radius: 8px;
    padding: 8px 10px;
    font-size: 13px;
    outline: none;
    font-family: inherit;
  }
  #wp-input:focus { border-color: #18181b; }
  #wp-send {
    background: #18181b;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 8px 12px;
    cursor: pointer;
    font-size: 16px;
    transition: background 0.15s;
  }
  #wp-send:hover { background: #3f3f46; }
  #wp-send:disabled { opacity: 0.4; cursor: default; }

  .wp-confirm-card {
    align-self: flex-start;
    width: 100%;
    border: 1px solid #e4e4e7;
    border-radius: 10px;
    padding: 10px 12px;
    background: #fafafa;
    font-size: 13px;
    color: #18181b;
  }
  .wp-confirm-card.cancelled { opacity: 0.5; }
  .wp-confirm-title {
    font-weight: 600;
    margin-bottom: 8px;
    color: #52525b;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .wp-confirm-steps {
    list-style: none;
    margin: 0 0 10px;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .wp-confirm-step {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    font-size: 13px;
    line-height: 1.4;
    color: #71717a;
  }
  .wp-confirm-step.current {
    color: #18181b;
    font-weight: 500;
  }
  .wp-confirm-step.current.risky {
    color: #b45309;
  }
  .wp-confirm-step-icon { flex-shrink: 0; width: 14px; }
  .wp-confirm-btns {
    display: flex;
    gap: 8px;
  }
  .wp-confirm-btn {
    flex: 1;
    padding: 6px 10px;
    border-radius: 6px;
    border: 1px solid #d4d4d8;
    font-size: 13px;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.1s;
  }
  .wp-confirm-btn.confirm {
    background: #18181b;
    color: #fff;
    border-color: #18181b;
  }
  .wp-confirm-btn.confirm:hover { background: #3f3f46; }
  .wp-confirm-btn.cancel {
    background: #fff;
    color: #71717a;
  }
  .wp-confirm-btn.cancel:hover { background: #f4f4f5; }
`;
  var HTML = `
  <button id="wp-bubble" aria-label="Open Waypoint">\u{1F4AC}</button>
  <div id="wp-panel" hidden>
    <div id="wp-header">
      <span>Waypoint</span>
      <button id="wp-close" aria-label="Close">\xD7</button>
    </div>
    <div id="wp-messages"></div>
    <div id="wp-input-row">
      <input id="wp-input" placeholder="Ask anything..." autocomplete="off" />
      <button id="wp-send" aria-label="Send">\u2192</button>
    </div>
  </div>
`;
  var shadow;
  var messagesEl;
  var inputEl;
  var sendBtn;
  var panelEl;
  function renderBubble(onSend) {
    const host = document.createElement("div");
    host.id = "waypoint-host";
    document.body.appendChild(host);
    shadow = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = STYLES;
    shadow.appendChild(style);
    const wrapper = document.createElement("div");
    wrapper.innerHTML = HTML;
    while (wrapper.firstChild) shadow.appendChild(wrapper.firstChild);
    const bubble = shadow.getElementById("wp-bubble");
    panelEl = shadow.getElementById("wp-panel");
    const closeBtn = shadow.getElementById("wp-close");
    messagesEl = shadow.getElementById("wp-messages");
    inputEl = shadow.getElementById("wp-input");
    sendBtn = shadow.getElementById("wp-send");
    bubble.addEventListener("click", () => {
      panelEl.hidden = false;
      inputEl.focus();
    });
    closeBtn.addEventListener("click", () => {
      panelEl.hidden = true;
    });
    function submit() {
      const msg = inputEl.value.trim();
      if (!msg) return;
      inputEl.value = "";
      onSend(msg);
    }
    sendBtn.addEventListener("click", submit);
    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        submit();
      }
    });
  }
  function appendMessage(role, text) {
    const div = document.createElement("div");
    div.className = `wp-msg ${role}`;
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
  function showConfirmation(step, allSteps, currentIndex) {
    return new Promise((resolve) => {
      const card = document.createElement("div");
      card.className = "wp-confirm-card";
      const title = document.createElement("div");
      title.className = "wp-confirm-title";
      title.textContent = "About to:";
      card.appendChild(title);
      const stepList = document.createElement("ul");
      stepList.className = "wp-confirm-steps";
      allSteps.forEach((s, i) => {
        const li = document.createElement("li");
        const isCurrent = i === currentIndex;
        const isDone = i < currentIndex;
        li.className = "wp-confirm-step" + (isCurrent ? " current" + (s.confirm_before ? " risky" : "") : "");
        const icon = document.createElement("span");
        icon.className = "wp-confirm-step-icon";
        if (isDone) {
          icon.textContent = "\u2713";
        } else if (isCurrent) {
          icon.textContent = s.confirm_before ? "\u26A0" : "\u203A";
        } else {
          icon.textContent = "\xB7";
        }
        const label = document.createElement("span");
        label.textContent = `${i + 1}. ${s.description}`;
        li.appendChild(icon);
        li.appendChild(label);
        stepList.appendChild(li);
      });
      card.appendChild(stepList);
      const btns = document.createElement("div");
      btns.className = "wp-confirm-btns";
      const confirmBtn = document.createElement("button");
      confirmBtn.className = "wp-confirm-btn confirm";
      confirmBtn.textContent = "Confirm";
      const cancelBtn = document.createElement("button");
      cancelBtn.className = "wp-confirm-btn cancel";
      cancelBtn.textContent = "Cancel";
      btns.appendChild(confirmBtn);
      btns.appendChild(cancelBtn);
      card.appendChild(btns);
      messagesEl.appendChild(card);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      confirmBtn.addEventListener("click", () => {
        btns.remove();
        resolve(true);
      });
      cancelBtn.addEventListener("click", () => {
        card.classList.add("cancelled");
        btns.remove();
        resolve(false);
      });
    });
  }
  var loadingEl = null;
  function setLoading(active) {
    if (active) {
      if (loadingEl) return;
      loadingEl = document.createElement("div");
      loadingEl.className = "wp-msg loading";
      loadingEl.textContent = "\u2026";
      messagesEl.appendChild(loadingEl);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      if (sendBtn) sendBtn.disabled = true;
      if (inputEl) inputEl.disabled = true;
    } else {
      if (loadingEl) {
        loadingEl.remove();
        loadingEl = null;
      }
      if (sendBtn) sendBtn.disabled = false;
      if (inputEl) {
        inputEl.disabled = false;
        inputEl.focus();
      }
    }
  }

  // src/api.ts
  function capturePageContext() {
    const elements = Array.from(
      document.querySelectorAll('button, a[href], input, [role="button"]')
    ).slice(0, 40).map((el) => {
      const text = (el.textContent || el.getAttribute("aria-label") || el.placeholder || "").trim().slice(0, 80);
      let selector = null;
      if (el.id) {
        selector = `#${el.id}`;
      } else if (el.getAttribute("data-testid")) {
        selector = `[data-testid="${el.getAttribute("data-testid")}"]`;
      } else if (el.getAttribute("aria-label")) {
        selector = `[aria-label="${el.getAttribute("aria-label")}"]`;
      }
      return {
        tag: el.tagName.toLowerCase(),
        text,
        selector,
        href: el instanceof HTMLAnchorElement ? el.getAttribute("href") ?? void 0 : void 0
      };
    }).filter((el) => el.text || el.selector);
    return {
      url: window.location.pathname,
      title: document.title,
      body_text: document.body.innerText.slice(0, 2e3),
      elements
    };
  }
  async function sendMessage(backendUrl, apiKey, sessionId, message) {
    const page_context = capturePageContext();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1e4);
    let res;
    try {
      res = await fetch(`${backendUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey, session_id: sessionId, message, page_context }),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
    }
    if (!res.ok) throw new Error(`Backend error: ${res.status}`);
    const data = await res.json();
    return { sessionId: data.session_id, message: data.message, action: data.action ?? null };
  }

  // src/actions.ts
  function resolveElement(step) {
    for (const sel of step.selectors ?? []) {
      const el = document.querySelector(sel);
      if (el instanceof HTMLElement) return el;
    }
    if (step.selector) {
      const el = document.querySelector(step.selector);
      if (el instanceof HTMLElement) return el;
    }
    if (step.text_match) {
      const needle = step.text_match.toLowerCase();
      const candidates = Array.from(
        document.querySelectorAll('button, a, [role="button"]')
      );
      for (const el of candidates) {
        if (el instanceof HTMLElement && el.textContent?.toLowerCase().includes(needle)) {
          return el;
        }
      }
    }
    return null;
  }
  function waitFor(fn, timeout) {
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
  function safeNavigate(url) {
    if (/^(javascript|data|vbscript):/i.test(url)) {
      console.warn("[Waypoint] Blocked dangerous URL:", url);
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
  async function executeStep(step, confirm, allSteps, index) {
    if (step.confirm_before) {
      const ok = await confirm(step, allSteps, index);
      if (!ok) return false;
    }
    switch (step.type) {
      case "navigate":
        if (step.url) safeNavigate(step.url);
        return false;
      case "click": {
        const el = resolveElement(step);
        if (!el) {
          console.warn(`[Waypoint] Could not resolve element for step: "${step.description}"`);
          return false;
        }
        el.click();
        await new Promise((r) => setTimeout(r, 300));
        return true;
      }
      case "wait_for_selector": {
        const sel = step.selector ?? step.selectors?.[0];
        if (sel) {
          try {
            await waitFor(() => document.querySelector(sel), step.timeout ?? 3e3);
          } catch {
            console.warn(`[Waypoint] Selector "${sel}" not found within timeout`);
            return false;
          }
        }
        return true;
      }
      case "observe":
        return false;
      default:
        return true;
    }
  }
  async function executePlan(steps, confirm) {
    for (let i = 0; i < steps.length; i++) {
      const shouldContinue = await executeStep(steps[i], confirm, steps, i);
      if (!shouldContinue) break;
    }
  }
  async function executeAction(action, confirm) {
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
        text_match: action.text_match
      });
      if (el) el.click();
      return;
    }
  }

  // src/index.ts
  (function() {
    const script = document.currentScript ?? Array.from(document.querySelectorAll("script")).find(
      (s) => s.src && s.src.includes("waypoint")
    );
    const apiKey = script?.getAttribute("data-key");
    const backendUrl = script?.getAttribute("data-backend") ?? "https://api.waypoint.ai";
    if (!apiKey) {
      console.warn("[Waypoint] No data-key attribute found on script tag.");
      return;
    }
    const STORAGE_KEY = `wp_session_${apiKey}`;
    let sessionId = localStorage.getItem(STORAGE_KEY);
    async function handleSend(message) {
      appendMessage("user", message);
      setLoading(true);
      try {
        const result = await sendMessage(backendUrl, apiKey, sessionId, message);
        sessionId = result.sessionId;
        localStorage.setItem(STORAGE_KEY, sessionId);
        setLoading(false);
        appendMessage("assistant", result.message);
        if (result.action && result.action.type !== "answer") {
          await executeAction(result.action, showConfirmation);
        }
      } catch (err) {
        setLoading(false);
        appendMessage("assistant", "Something went wrong. Please try again.");
        console.error("[Waypoint] Error:", err);
      }
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => renderBubble(handleSend));
    } else {
      renderBubble(handleSend);
    }
  })();
})();
//# sourceMappingURL=waypoint.min.js.map
