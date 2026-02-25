from datetime import datetime
from typing import Any, Literal
from pydantic import BaseModel


class SiteIndexRow(BaseModel):
    id: str
    site_id: str
    route: str
    title: str | None
    purpose: str | None
    summary: str | None
    elements: list[Any]
    created_at: datetime


class RouteElement(BaseModel):
    label: str
    selector: str
    action: str
    href: str | None = None
    risk: Literal["low", "medium", "high"] | None = None


class RouteNode(BaseModel):
    route: str
    title: str | None = None
    purpose: str | None = None
    summary: str | None = None
    elements: list[RouteElement] = []


class IndexRequest(BaseModel):
    routes: list[RouteNode]


class IndexResponse(BaseModel):
    indexed: int
    site_id: str


class PageContextElement(BaseModel):
    tag: str
    text: str | None = None
    selector: str | None = None
    href: str | None = None


class PageContext(BaseModel):
    url: str | None = None
    title: str | None = None
    body_text: str | None = None
    elements: list[PageContextElement] = []


class ChatRequest(BaseModel):
    api_key: str
    session_id: str | None = None
    message: str
    page_context: PageContext | None = None


class ActionStep(BaseModel):
    type: Literal["navigate", "click", "wait_for_selector", "observe"]
    url: str | None = None
    selector: str | None = None
    selectors: list[str] = []
    text_match: str | None = None
    timeout: int = 3000
    description: str
    confirm_before: bool = False


class ActionPayload(BaseModel):
    type: Literal["navigate", "click", "answer", "plan"]
    url: str | None = None
    selector: str | None = None
    message: str
    steps: list[ActionStep] | None = None


class ChatResponse(BaseModel):
    session_id: str
    message: str
    action: ActionPayload | None
