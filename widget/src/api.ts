export interface ActionStep {
  type: "navigate" | "click" | "wait_for_selector" | "observe";
  url?: string;
  selector?: string;
  selectors?: string[];
  text_match?: string;
  timeout?: number;
  description: string;
  confirm_before?: boolean;
}

export interface Action {
  type: "navigate" | "click" | "answer" | "plan";
  url?: string;
  selector?: string;
  selectors?: string[];
  text_match?: string;
  message: string;
  steps?: ActionStep[];
}

export interface PageContextElement {
  tag: string;
  text: string;
  selector: string | null;
  href?: string;
}

export interface PageContext {
  url: string;
  title: string;
  body_text: string;
  elements: PageContextElement[];
}

export interface ChatResult {
  sessionId: string;
  message: string;
  action: Action | null;
}

export function capturePageContext(): PageContext {
  const elements = Array.from(
    document.querySelectorAll('button, a[href], input, [role="button"]')
  ).slice(0, 40).map(el => {
    const text = (
      el.textContent ||
      el.getAttribute("aria-label") ||
      (el as HTMLInputElement).placeholder ||
      ""
    ).trim().slice(0, 80);

    let selector: string | null = null;
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
      href: el instanceof HTMLAnchorElement ? (el.getAttribute("href") ?? undefined) : undefined,
    };
  }).filter(el => el.text || el.selector);

  return {
    url: window.location.pathname,
    title: document.title,
    body_text: document.body.innerText.slice(0, 2000),
    elements,
  };
}

export async function sendMessage(
  backendUrl: string,
  apiKey: string,
  sessionId: string | null,
  message: string
): Promise<ChatResult> {
  const page_context = capturePageContext();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  let res: Response;
  try {
    res = await fetch(`${backendUrl}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: apiKey, session_id: sessionId, message, page_context }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) throw new Error(`Backend error: ${res.status}`);

  const data = await res.json();
  return { sessionId: data.session_id, message: data.message, action: data.action ?? null };
}
