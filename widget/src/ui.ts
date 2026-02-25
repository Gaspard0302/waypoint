import { ActionStep } from "./api";

const STYLES = `
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

const HTML = `
  <button id="wp-bubble" aria-label="Open Waypoint">💬</button>
  <div id="wp-panel" hidden>
    <div id="wp-header">
      <span>Waypoint</span>
      <button id="wp-close" aria-label="Close">×</button>
    </div>
    <div id="wp-messages"></div>
    <div id="wp-input-row">
      <input id="wp-input" placeholder="Ask anything..." autocomplete="off" />
      <button id="wp-send" aria-label="Send">→</button>
    </div>
  </div>
`;

let shadow: ShadowRoot;
let messagesEl: HTMLElement;
let inputEl: HTMLInputElement;
let sendBtn: HTMLButtonElement;
let panelEl: HTMLElement;

export function renderBubble(
  onSend: (message: string) => void
): void {
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

  const bubble = shadow.getElementById("wp-bubble") as HTMLButtonElement;
  panelEl = shadow.getElementById("wp-panel") as HTMLElement;
  const closeBtn = shadow.getElementById("wp-close") as HTMLButtonElement;
  messagesEl = shadow.getElementById("wp-messages") as HTMLElement;
  inputEl = shadow.getElementById("wp-input") as HTMLInputElement;
  sendBtn = shadow.getElementById("wp-send") as HTMLButtonElement;

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

export function appendMessage(role: "user" | "assistant", text: string): void {
  const div = document.createElement("div");
  div.className = `wp-msg ${role}`;
  div.textContent = text;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

export function showConfirmation(
  step: ActionStep,
  allSteps: ActionStep[],
  currentIndex: number
): Promise<boolean> {
  return new Promise(resolve => {
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
      li.className = "wp-confirm-step" +
        (isCurrent ? " current" + (s.confirm_before ? " risky" : "") : "");

      const icon = document.createElement("span");
      icon.className = "wp-confirm-step-icon";
      if (isDone) {
        icon.textContent = "✓";
      } else if (isCurrent) {
        icon.textContent = s.confirm_before ? "⚠" : "›";
      } else {
        icon.textContent = "·";
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

let loadingEl: HTMLElement | null = null;

export function setLoading(active: boolean): void {
  if (active) {
    if (loadingEl) return;
    loadingEl = document.createElement("div");
    loadingEl.className = "wp-msg loading";
    loadingEl.textContent = "…";
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
