import asyncio
import json
import logging
from urllib.parse import urljoin, urlparse

from app.db.client import get_supabase

logger = logging.getLogger(__name__)

MAX_PAGES = 50
MAX_DEPTH = 3


def _same_domain(base_url: str, link: str) -> bool:
    base = urlparse(base_url)
    target = urlparse(link)
    return target.netloc == "" or target.netloc == base.netloc


def _normalize_url(base_url: str, href: str) -> str | None:
    if not href or href.startswith("#") or href.startswith("javascript:") or href.startswith("mailto:"):
        return None
    return urljoin(base_url, href)


def _build_selector(tag: str, attrs: dict) -> str:
    aria_label = attrs.get("aria-label", "").strip()
    if aria_label:
        return f'{tag}[aria-label="{aria_label}"]'

    data_testid = attrs.get("data-testid", "").strip()
    if data_testid:
        return f'{tag}[data-testid="{data_testid}"]'

    elem_id = attrs.get("id", "").strip()
    if elem_id:
        return f"#{elem_id}"

    elem_type = attrs.get("type", "").strip()
    if elem_type:
        return f"{tag}[type='{elem_type}']"

    text = attrs.get("text", "").strip()[:30]
    if text:
        safe_text = text.replace('"', '\\"')
        return f'{tag}:contains("{safe_text}")'

    return tag


async def _extract_elements(page) -> list[dict]:
    elements = []
    try:
        handles = await page.query_selector_all(
            "a, button, [role='button'], [role='link'], input, select, textarea"
        )
        for handle in handles[:100]:  # limit to first 100 per page
            try:
                tag = await handle.evaluate("el => el.tagName.toLowerCase()")
                aria_label = await handle.get_attribute("aria-label") or ""
                data_testid = await handle.get_attribute("data-testid") or ""
                elem_id = await handle.get_attribute("id") or ""
                elem_type = await handle.get_attribute("type") or ""
                href = await handle.get_attribute("href") or ""
                text = (await handle.inner_text()).strip()[:60] if tag != "input" else ""

                attrs = {
                    "aria-label": aria_label,
                    "data-testid": data_testid,
                    "id": elem_id,
                    "type": elem_type,
                    "text": text,
                }
                selector = _build_selector(tag, attrs)

                label = aria_label or text or elem_type or tag

                if tag == "a" and href:
                    elements.append({
                        "label": label,
                        "type": "navigate",
                        "selector": selector,
                        "href": href,
                    })
                elif tag in ("button",) or attrs.get("role") in ("button", "link"):
                    elements.append({
                        "label": label,
                        "type": "click",
                        "selector": selector,
                    })
                elif tag in ("input", "select", "textarea"):
                    elements.append({
                        "label": label or elem_type or tag,
                        "type": "input",
                        "selector": selector,
                    })
            except Exception:
                continue
    except Exception as e:
        logger.warning(f"Element extraction error: {e}")
    return elements


async def _collect_links(page, start_url: str) -> list[str]:
    links = []
    try:
        anchors = await page.query_selector_all("a[href]")
        for anchor in anchors:
            try:
                href = await anchor.get_attribute("href")
                normalized = _normalize_url(start_url, href or "")
                if normalized and _same_domain(start_url, normalized):
                    links.append(normalized)
            except Exception:
                continue
    except Exception as e:
        logger.warning(f"Link collection error: {e}")
    return links


async def crawl_site(site_id: str, job_id: str, start_url: str) -> None:
    db = get_supabase()

    # Mark job as running
    db.table("crawl_jobs").update({
        "status": "running",
        "started_at": "now()",
    }).eq("id", job_id).execute()

    try:
        from playwright.async_api import async_playwright

        async with async_playwright() as pw:
            browser = await pw.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent="Waypoint-Crawler/1.0 (+https://waypoint.ai/bot)"
            )
            page = await context.new_page()

            queue: list[tuple[str, int]] = [(start_url, 0)]
            visited: set[str] = set()

            while queue and len(visited) < MAX_PAGES:
                url, depth = queue.pop(0)

                # Normalize by stripping trailing slash for dedup
                clean_url = url.rstrip("/")
                if clean_url in visited:
                    continue
                visited.add(clean_url)

                try:
                    await page.goto(url, wait_until="networkidle", timeout=15000)
                except Exception as e:
                    logger.warning(f"Failed to load {url}: {e}")
                    continue

                title = await page.title()
                parsed = urlparse(url)
                route = parsed.path or "/"

                elements = await _extract_elements(page)

                # Delete any existing index row for this route + crawl job combo
                db.table("site_index").insert({
                    "site_id": site_id,
                    "crawl_job_id": job_id,
                    "route": route,
                    "title": title,
                    "depth": depth,
                    "elements": json.dumps(elements),
                }).execute()

                if depth < MAX_DEPTH:
                    links = await _collect_links(page, start_url)
                    for link in links:
                        clean_link = link.rstrip("/")
                        if clean_link not in visited:
                            queue.append((link, depth + 1))

            await browser.close()

        db.table("crawl_jobs").update({
            "status": "done",
            "finished_at": "now()",
        }).eq("id", job_id).execute()

    except Exception as e:
        logger.error(f"Crawl failed for site {site_id}: {e}")
        db.table("crawl_jobs").update({
            "status": "failed",
            "finished_at": "now()",
            "error": str(e)[:500],
        }).eq("id", job_id).execute()
