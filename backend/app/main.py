from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import crawl, reindex, chat

app = FastAPI(
    title="Waypoint API",
    version="0.1.0",
    docs_url=None if settings.ENVIRONMENT == "production" else "/docs",
    redoc_url=None if settings.ENVIRONMENT == "production" else "/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(crawl.router)
app.include_router(reindex.router)
app.include_router(chat.router)


@app.get("/health")
async def health() -> dict:
    return {"ok": True, "environment": settings.ENVIRONMENT}
