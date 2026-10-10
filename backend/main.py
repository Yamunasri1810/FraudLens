"""
FraudLens - FastAPI Application Entrypoint
Full-Stack AI Credit Card Fraud Detection Platform Backend API
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from backend.config import ALLOWED_ORIGINS
from backend.routers import (
    health,
    overview,
    analytics,
    models,
    alerts,
    predict,
    evaluation,
    capacity,
)

app = FastAPI(
    title="FraudLens API",
    description="Production-style Decision Support Backend for AI Credit Card Fraud Detection & Prioritization",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware with restricted origins (supports localhost, custom domain, and Vercel deployments)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if ALLOWED_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(health.router)
app.include_router(overview.router)
app.include_router(analytics.router)
app.include_router(models.router)
app.include_router(alerts.router)
app.include_router(predict.router)
app.include_router(evaluation.router)
app.include_router(capacity.router)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": "InternalServerError",
            "message": str(exc),
            "path": str(request.url.path),
        }
    )

@app.get("/")
def root():
    return {
        "service": "FraudLens API",
        "status": "online",
        "documentation": "/docs",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    from backend.config import PORT
    uvicorn.run("backend.main:app", host="0.0.0.0", port=PORT, reload=True)
