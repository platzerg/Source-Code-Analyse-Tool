from opentelemetry import trace
from dotenv import load_dotenv
import nest_asyncio
import logfire
import base64
import os
import sys

load_dotenv()

def scrubbing_callback(match: logfire.ScrubMatch):
    """Preserve the Langfuse session ID and other important identifiers."""
    if (
        match.path == ("attributes", "langfuse.session.id")
        and match.pattern_match.group(0) == "session"
    ):
        # Return the original value to prevent redaction
        return match.value
    
    # Also preserve user IDs
    if match.path == ("attributes", "langfuse.user.id"):
        return match.value

def configure_langfuse():
    """
    Configure Langfuse for API observability and tracing.
    
    Returns:
        trace.Tracer or None: A tracer instance if Langfuse is configured, None otherwise
    """
    try:
        print("[Langfuse] Step 1: Reading environment variables...", flush=True)
        LANGFUSE_PUBLIC_KEY = os.getenv("LANGFUSE_PUBLIC_KEY")
        LANGFUSE_SECRET_KEY = os.getenv("LANGFUSE_SECRET_KEY")
        LANGFUSE_HOST = os.getenv("LANGFUSE_HOST", "https://cloud.langfuse.com")
        
        # If Langfuse credentials are not provided, return None
        if not LANGFUSE_PUBLIC_KEY or not LANGFUSE_SECRET_KEY:
            print("[Langfuse] Credentials not found. Tracing disabled.", flush=True)
            return None
        
        print(f"[Langfuse] Step 2: Credentials found. Host: {LANGFUSE_HOST}", flush=True)
        LANGFUSE_AUTH = base64.b64encode(f"{LANGFUSE_PUBLIC_KEY}:{LANGFUSE_SECRET_KEY}".encode()).decode()

        print("[Langfuse] Step 3: Setting OTEL environment variables...", flush=True)
        os.environ["OTEL_EXPORTER_OTLP_ENDPOINT"] = f"{LANGFUSE_HOST}/api/public/otel"
        os.environ["OTEL_EXPORTER_OTLP_HEADERS"] = f"Authorization=Basic {LANGFUSE_AUTH}"

        print("[Langfuse] Step 4: Applying nest_asyncio...", flush=True)
        nest_asyncio.apply()
        
        print("[Langfuse] Step 5: Configuring logfire...", flush=True)
        logfire.configure(
            service_name='source_code_analysis_api',
            send_to_logfire=False,
            scrubbing=logfire.ScrubbingOptions(callback=scrubbing_callback)
        )

        print("[Langfuse] Step 6: Getting tracer...", flush=True)
        tracer = trace.get_tracer("source_code_analysis_api")
        
        print(f"[Langfuse] ✅ Tracing enabled successfully! Host: {LANGFUSE_HOST}", flush=True)
        return tracer
    except Exception as e:
        print(f"[Langfuse] ❌ Configuration failed at: {e}", flush=True)
        print(f"[Langfuse] Error type: {type(e).__name__}", flush=True)
        print(f"[Langfuse] Continuing without tracing...", flush=True)
        import traceback
        traceback.print_exc()
        return None
