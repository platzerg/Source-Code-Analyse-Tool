from opentelemetry import trace
from dotenv import load_dotenv
import nest_asyncio
import logfire
import base64
import os
import sys
from pathlib import Path

# Load environment variables
dotenv_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path)

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
    Configure Langfuse for RAG pipeline observability and tracing.
    
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

        print("[Langfuse] Step 3: Configuring OTEL SDK directly...", flush=True)
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import BatchSpanProcessor
        from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
        from opentelemetry.sdk.resources import Resource
        
        resource = Resource.create({"service.name": "source_code_analysis_rag"})
        
        # Langfuse OTEL endpoint
        otel_endpoint = f"{LANGFUSE_HOST.rstrip('/')}/api/public/otel/v1/traces"
        
        exporter = OTLPSpanExporter(
            endpoint=otel_endpoint,
            headers={"Authorization": f"Basic {LANGFUSE_AUTH}"}
        )
        
        # BatchSpanProcessor is more efficient for production
        span_processor = BatchSpanProcessor(exporter)
        provider = TracerProvider(resource=resource)
        provider.add_span_processor(span_processor)
        trace.set_tracer_provider(provider)

        print("[Langfuse] Step 4: Applying nest_asyncio...", flush=True)
        nest_asyncio.apply()
        
        print("[Langfuse] Step 5: Configuring logfire (bridged to OTEL)...", flush=True)
        logfire.configure(
            send_to_logfire=False,
            scrubbing=logfire.ScrubbingOptions(callback=scrubbing_callback)
        )

        print("[Langfuse] Step 6: Getting tracer...", flush=True)
        tracer = trace.get_tracer("source_code_analysis_rag")
        
        print(f"[Langfuse] ✅ Tracing enabled successfully! Host: {LANGFUSE_HOST}", flush=True)
        return tracer
    except Exception as e:
        print(f"[Langfuse] ❌ Configuration failed at: {e}", flush=True)
        return None
