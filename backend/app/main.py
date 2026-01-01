from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router as api_router
from app.core.observability import configure_langfuse

# Global tracer instance (None if Langfuse not configured)
tracer = None

app = FastAPI(
    title="Product Catalog API",
    description="E-commerce product catalog API - Module 1 Exercise",
    version="0.2.0",
)

# Initialize Langfuse tracer (optional - returns None if not configured)
print("[Main] Initializing Langfuse...", flush=True)
tracer = configure_langfuse()
print(f"[Main] Langfuse initialization complete. Tracer: {tracer}", flush=True)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

