from fastapi import APIRouter, BackgroundTasks

from app.auth import get_site_by_api_key
from app.db.client import get_supabase
from app.services.crawler import crawl_site

router = APIRouter()


@router.post("/reindex")
async def reindex(key: str, background_tasks: BackgroundTasks):
    site = await get_site_by_api_key(key)

    db = get_supabase()
    job_res = db.table("crawl_jobs").insert({
        "site_id": site["id"],
        "status": "pending",
        "triggered_by": "webhook",
    }).execute()

    job = job_res.data[0]
    background_tasks.add_task(crawl_site, site["id"], job["id"], site["url"])

    return {"ok": True, "job_id": job["id"]}
