from fastapi import APIRouter, Header, HTTPException

from app.auth import get_site_by_api_key
from app.db.client import get_supabase
from app.models import IndexRequest, IndexResponse, RouteNode

router = APIRouter()


async def _get_site_from_auth_header(authorization: str) -> dict:
    api_key = authorization.removeprefix("Bearer ").strip()
    return await get_site_by_api_key(api_key)


@router.post("/sites/{site_id}/index", response_model=IndexResponse)
async def post_site_index(
    site_id: str,
    body: IndexRequest,
    authorization: str = Header(...),
):
    site = await _get_site_from_auth_header(authorization)
    if site["id"] != site_id:
        raise HTTPException(status_code=403, detail="API key does not match site")

    db = get_supabase()

    # Replace the entire index for this site
    db.table("site_index").delete().eq("site_id", site_id).execute()

    if body.routes:
        rows = [
            {
                "site_id": site_id,
                "route": r.route,
                "title": r.title,
                "purpose": r.purpose,
                "elements": [e.model_dump() for e in r.elements],
                "depth": 0,  # not used in skill-based indexing, kept for schema compat
            }
            for r in body.routes
        ]
        db.table("site_index").insert(rows).execute()

    return IndexResponse(indexed=len(body.routes), site_id=site_id)


@router.get("/sites/{site_id}/index", response_model=list[RouteNode])
async def get_site_index_by_key(
    site_id: str,
    authorization: str = Header(...),
):
    site = await _get_site_from_auth_header(authorization)
    if site["id"] != site_id:
        raise HTTPException(status_code=403, detail="API key does not match site")

    db = get_supabase()
    res = (
        db.table("site_index")
        .select("route,title,purpose,elements")
        .eq("site_id", site_id)
        .order("created_at", desc=False)
        .execute()
    )

    return [
        RouteNode(
            route=row["route"],
            title=row.get("title"),
            purpose=row.get("purpose"),
            elements=row.get("elements") or [],
        )
        for row in (res.data or [])
    ]
