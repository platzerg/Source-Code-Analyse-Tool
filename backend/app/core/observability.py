from opentelemetry import trace
from dotenv import load_dotenv
import nest_asyncio
import logfire
import base64
import os
import sys
from app.core.config import get_settings

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
        settings = get_settings()
        
        # Check if Langfuse is enabled via configuration flag
        if not settings.enable_langfuse:
            print("[Langfuse] Disabled via ENABLE_LANGFUSE=false. Tracing disabled.", flush=True)
            return None
        
        print("[Langfuse] Step 1: Reading configuration...", flush=True)
        
        # If Langfuse credentials are not provided, return None
        if not settings.is_langfuse_configured:
            print("[Langfuse] Credentials not found. Tracing disabled.", flush=True)
            print("[Langfuse] Set ENABLE_LANGFUSE=true and provide credentials to enable.", flush=True)
            return None
        
        print(f"[Langfuse] Step 2: Credentials found. Host: {settings.langfuse_host}", flush=True)
        LANGFUSE_AUTH = base64.b64encode(
            f"{settings.langfuse_public_key}:{settings.langfuse_secret_key}".encode()
        ).decode()

        print("[Langfuse] Step 3: Setting OTEL environment variables...", flush=True)
        os.environ["OTEL_EXPORTER_OTLP_ENDPOINT"] = f"{settings.langfuse_host}/api/public/otel"
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

        print(f"[Langfuse] [OK] Tracing enabled successfully! Host: {settings.langfuse_host}", flush=True)
        return tracer
    except Exception as e:
        print(f"[Langfuse] [ERROR] Configuration failed at: {e}", flush=True)
        print(f"[Langfuse] Error type: {type(e).__name__}", flush=True)
        print(f"[Langfuse] Continuing without tracing...", flush=True)
        import traceback
        traceback.print_exc()
        return None
