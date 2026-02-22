import { renderBubble, appendMessage, setLoading } from "./ui";
import { sendMessage } from "./api";
import { executeAction } from "./actions";

(function () {
  const script =
    (document.currentScript as HTMLScriptElement | null) ??
    Array.from(document.querySelectorAll("script")).find(
      (s) => s.src && s.src.includes("waypoint")
    );

  const apiKey = script?.getAttribute("data-key");
  const backendUrl =
    script?.getAttribute("data-backend") ?? "https://api.waypoint.ai";

  if (!apiKey) {
    console.warn("[Waypoint] No data-key attribute found on script tag.");
    return;
  }

  let sessionId: string | null = null;

  async function handleSend(message: string): Promise<void> {
    appendMessage("user", message);
    setLoading(true);

    try {
      const result = await sendMessage(backendUrl, apiKey!, sessionId, message);
      sessionId = result.sessionId;
      setLoading(false);
      appendMessage("assistant", result.message);
      if (result.action && result.action.type !== "answer") {
        executeAction(result.action);
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
