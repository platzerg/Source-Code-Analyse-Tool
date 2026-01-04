from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router as api_router
from app.api.auth import router as auth_router
from app.core.observability import configure_langfuse
from app.core.redis_client import init_redis, close_redis

# Global tracer instance (None if Langfuse not configured)
tracer = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("[Main] Initializing Langfuse...", flush=True)
    global tracer
    tracer = configure_langfuse()
    print(f"[Main] Langfuse initialization complete. Tracer: {tracer}", flush=True)
    
    print("[Main] Initializing Redis...", flush=True)
    await init_redis()
    print("[Main] Redis initialization complete.", flush=True)
    
    yield
    
    # Shutdown
    print("[Main] Shutting down Redis...", flush=True)
    await close_redis()
    print("[Main] Redis shutdown complete.", flush=True)

app = FastAPI(
    title="Source Code Analysis Tool API",
    description="AI-powered source code analysis and project management",
    version="2.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(api_router, prefix="/api/v1")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
