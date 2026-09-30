from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api import router


app = FastAPI(
    title="AI Fraud & Agentic Risk Decision Engine",
    description=(
        "AI-powered fraud detection, "
        "risk decisioning and agentic investigation platform."
    ),
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "http://127.0.0.1:5174",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# API ROUTES
# ============================================================

app.include_router(router)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def home():
    return {
        "message": (
            "AI Fraud & Agentic Risk "
            "Decision Engine is running"
        ),
        "status": "healthy",
        "version": "1.0.0",
    }