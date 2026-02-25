import uuid
from datetime import datetime, timezone

from fastapi import APIRouter

from app.auth import get_site_by_api_key
from app.db.client import get_supabase
from app.models import ChatRequest, ChatResponse
from app.services.agent import get_action

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    site = await get_site_by_api_key(req.api_key)
    db = get_supabase()

    # Resolve or create session
    if req.session_id:
        session_res = db.table("sessions").select("id").eq("id", req.session_id).eq("site_id", site["id"]).maybe_single().execute()
        if session_res.data:
            session_id = req.session_id
            db.table("sessions").update({"last_active": datetime.now(timezone.utc).isoformat()}).eq("id", session_id).execute()
        else:
            # Session not found, create new
            session_id = None

    if not req.session_id or not session_res.data:
        new_session = db.table("sessions").insert({
            "site_id": site["id"],
        }).execute()
        session_id = new_session.data[0]["id"]

    # Get action from agent (history fetch happens before current message is stored)
    action = await get_action(site["id"], req.message, session_id, page_context=req.page_context)

    # Store user message
    db.table("messages").insert({
        "session_id": session_id,
        "role": "user",
        "content": req.message,
    }).execute()

    # Store assistant message
    db.table("messages").insert({
        "session_id": session_id,
        "role": "assistant",
        "content": action.message,
        "action": action.model_dump() if action else None,
    }).execute()

    return ChatResponse(
        session_id=session_id,
        message=action.message,
        action=action,
    )
