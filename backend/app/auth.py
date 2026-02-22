from fastapi import Header, HTTPException
from app.db.client import get_supabase


async def get_current_user(authorization: str = Header(...)) -> dict:
    token = authorization.removeprefix("Bearer ")
    try:
        result = get_supabase().auth.get_user(token)
        return result.user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


async def get_site_by_api_key(key: str) -> dict:
    res = get_supabase().table("sites").select("*").eq("api_key", key).maybe_single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Invalid API key")
    return res.data
