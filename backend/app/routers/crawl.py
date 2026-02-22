from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException

from app.auth import get_current_user
from app.db.client import get_supabase
from app.models import CrawlJobResponse
from app.services.crawler import crawl_site

router = APIRouter()


def _verify_site_owner(site_id: str, user: dict) -> dict:
    db = get_supabase()
    res = db.table("sites").select("*").eq("id", site_id).eq("user_id", user.id).maybe_single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Site not found")
    return res.data


@router.post("/sites/{site_id}/crawl", response_model=CrawlJobResponse)
async def trigger_crawl(
    site_id: str,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user),
):
    site = _verify_site_owner(site_id, user)

    db = get_supabase()
    job_res = db.table("crawl_jobs").insert({
        "site_id": site_id,
        "status": "pending",
        "triggered_by": "manual",
    }).execute()

    job = job_res.data[0]
    background_tasks.add_task(crawl_site, site_id, job["id"], site["url"])

    return CrawlJobResponse(
        id=job["id"],
        site_id=job["site_id"],
        status=job["status"],
        triggered_by=job["triggered_by"],
        started_at=job.get("started_at"),
        finished_at=job.get("finished_at"),
        error=job.get("error"),
        created_at=job["created_at"],
    )


@router.get("/sites/{site_id}/crawl-jobs", response_model=list[CrawlJobResponse])
async def list_crawl_jobs(
    site_id: str,
    user: dict = Depends(get_current_user),
):
    _verify_site_owner(site_id, user)

    db = get_supabase()
    res = db.table("crawl_jobs").select("*").eq("site_id", site_id).order("created_at", desc=True).execute()

    return [
        CrawlJobResponse(
            id=job["id"],
            site_id=job["site_id"],
            status=job["status"],
            triggered_by=job["triggered_by"],
            started_at=job.get("started_at"),
            finished_at=job.get("finished_at"),
            error=job.get("error"),
            created_at=job["created_at"],
        )
        for job in (res.data or [])
    ]
