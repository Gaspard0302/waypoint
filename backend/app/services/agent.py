import json
import logging

from mistralai import Mistral

from app.config import settings
from app.db.client import get_supabase
from app.models import ActionPayload

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are Waypoint, an AI navigation assistant embedded in a website.
The website has these pages and interactive elements:
{formatted_index}

The visitor asks: "{user_message}"

Respond ONLY with a JSON object (no markdown, no explanation):
- Navigate to a page: {{"type": "navigate", "url": "/path", "message": "Taking you to..."}}
- Click an element: {{"type": "click", "selector": "css-selector", "message": "Clicking..."}}
- Answer without action: {{"type": "answer", "message": "Here's how..."}}"""


def _format_index(rows: list[dict]) -> str:
    lines: list[str] = []
    for row in rows:
        route = row.get("route", "/")
        title = row.get("title", "")
        lines.append(f"{route} — {title}")
        elements = row.get("elements") or []
        if isinstance(elements, str):
            try:
                elements = json.loads(elements)
            except Exception:
                elements = []
        for el in elements[:20]:  # limit elements per page
            label = el.get("label", "")
            el_type = el.get("type", "")
            href = el.get("href", "")
            selector = el.get("selector", "")
            if el_type == "navigate" and href:
                lines.append(f"  [navigate] {label} → {href}")
            elif el_type == "click":
                lines.append(f"  [click] {label} ({selector})")
            elif el_type == "input":
                lines.append(f"  [input] {label} ({selector})")
    return "\n".join(lines)


async def get_action(site_id: str, user_message: str) -> ActionPayload:
    db = get_supabase()

    # Load all index rows for this site (latest crawl job rows)
    res = db.table("site_index").select(
        "route, title, elements"
    ).eq("site_id", site_id).order("created_at", desc=True).limit(200).execute()

    rows = res.data or []

    # Deduplicate by route, keeping most recent
    seen_routes: set[str] = set()
    unique_rows: list[dict] = []
    for row in rows:
        route = row.get("route", "/")
        if route not in seen_routes:
            seen_routes.add(route)
            unique_rows.append(row)

    formatted_index = _format_index(unique_rows)

    if not formatted_index.strip():
        formatted_index = "(No pages indexed yet — the site has not been crawled)"

    prompt = SYSTEM_PROMPT.format(
        formatted_index=formatted_index,
        user_message=user_message,
    )

    try:
        client = Mistral(api_key=settings.MISTRAL_API_KEY)
        response = client.chat.complete(
            model="mistral-small-latest",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
        )
        content = response.choices[0].message.content
        data = json.loads(content)

        action_type = data.get("type", "answer")
        message = data.get("message", "I'm not sure how to help with that.")

        if action_type == "navigate":
            return ActionPayload(type="navigate", url=data.get("url"), message=message)
        elif action_type == "click":
            return ActionPayload(type="click", selector=data.get("selector"), message=message)
        else:
            return ActionPayload(type="answer", message=message)

    except Exception as e:
        logger.error(f"Agent error for site {site_id}: {e}")
        return ActionPayload(
            type="answer",
            message="Sorry, I encountered an error while processing your request."
        )
