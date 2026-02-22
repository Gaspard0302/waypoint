export interface Action {
  type: "navigate" | "click" | "answer";
  url?: string;
  selector?: string;
  message: string;
}

export interface ChatResult {
  sessionId: string;
  message: string;
  action: Action | null;
}

export async function sendMessage(
  backendUrl: string,
  apiKey: string,
  sessionId: string | null,
  message: string
): Promise<ChatResult> {
  const res = await fetch(`${backendUrl}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      session_id: sessionId,
      message,
    }),
  });

  if (!res.ok) {
    throw new Error(`Backend error: ${res.status}`);
  }

  const data = await res.json();
  return {
    sessionId: data.session_id,
    message: data.message,
    action: data.action ?? null,
  };
}
