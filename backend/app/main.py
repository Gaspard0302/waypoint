from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import chat, index

app = FastAPI(
    title="Waypoint API",
    version="0.1.0",
    docs_url=None if settings.ENVIRONMENT == "production" else "/docs",
    redoc_url=None if settings.ENVIRONMENT == "production" else "/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(index.router, prefix="/v1")


@app.get("/health")
async def health() -> dict:
    return {"ok": True, "environment": settings.ENVIRONMENT}
