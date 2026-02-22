from datetime import datetime
from typing import Literal
from pydantic import BaseModel


class CrawlJobResponse(BaseModel):
    id: str
    site_id: str
    status: str
    triggered_by: str
    started_at: datetime | None
    finished_at: datetime | None
    error: str | None
    created_at: datetime


class ChatRequest(BaseModel):
    api_key: str
    session_id: str | None = None
    message: str


class ActionPayload(BaseModel):
    type: Literal["navigate", "click", "answer"]
    url: str | None = None
    selector: str | None = None
    message: str


class ChatResponse(BaseModel):
    session_id: str
    message: str
    action: ActionPayload | None
