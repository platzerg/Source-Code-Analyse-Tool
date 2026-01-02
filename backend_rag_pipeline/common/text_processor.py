import os
import io
import csv
import tempfile
from typing import List, Dict, Any
import pypdf
from openai import OpenAI
from dotenv import load_dotenv
from pathlib import Path
from opentelemetry import trace

# Initialize tracer
tracer = trace.get_tracer("source_code_analysis_rag")

# Check if we're in production
is_production = os.getenv("ENVIRONMENT") == "production"

if not is_production:
    # Development: prioritize .env file
    project_root = Path(__file__).resolve().parent.parent
    dotenv_path = project_root / '.env'
    load_dotenv(dotenv_path, override=True)
else:
    # Production: use cloud platform env vars only
    load_dotenv()

# Initialize OpenAI client
api_key = os.getenv("EMBEDDING_API_KEY", "") or "ollama"
openai_client = OpenAI(api_key=api_key, base_url=os.getenv("EMBEDDING_BASE_URL"))

def chunk_text(text: str, chunk_size: int = 400, overlap: int = 0) -> List[str]:
    """Split text into chunks of specified size with optional overlap."""
    if not text:
        return []
    # Remove null bytes which Postgres doesn't like in text columns
    text = text.replace('\u0000', '')
    text = text.replace('\r', '')
    chunks = []
    for i in range(0, len(text), chunk_size - overlap):
        chunk = text[i:i + chunk_size]
        if chunk:
            chunks.append(chunk)
    return chunks

def extract_text_from_pdf(file_content: bytes) -> str:
    """Extract text from a PDF file."""
    with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
        temp_file.write(file_content)
        temp_file_path = temp_file.name
    try:
        with open(temp_file_path, 'rb') as file:
            pdf_reader = pypdf.PdfReader(file)
            text = ""
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n\n"
        return text
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

def extract_text_from_file(file_content: bytes, mime_type: str, file_name: str, config: Dict[str, Any] = None) -> str:
    """Extract text from a file based on its MIME type."""
    supported_mime_types = []
    if config and 'supported_mime_types' in config:
        supported_mime_types = config['supported_mime_types']
    
    if 'application/pdf' in mime_type:
        return extract_text_from_pdf(file_content)
    elif mime_type.startswith('image'):
        return file_name
    elif config and any(mime_type.startswith(t) for t in supported_mime_types):
        return file_content.decode('utf-8', errors='replace')
    else:
        return file_content.decode('utf-8', errors='replace')

def create_embeddings(texts: List[str]) -> List[List[float]]:
    """Create embeddings for a list of text chunks using OpenAI."""
    if not texts:
        return []
    
    with tracer.start_as_current_span("create_embeddings") as span:
        model = os.getenv("EMBEDDING_MODEL_CHOICE", "text-embedding-3-small")
        span.set_attribute("embedding.model", model)
        span.set_attribute("embedding.chunk_count", len(texts))
        
        response = openai_client.embeddings.create(
            model=model,
            input=texts
        )
        return [item.embedding for item in response.data]

def is_tabular_file(mime_type: str, config: Dict[str, Any] = None) -> bool:
    """Check if a file is tabular based on its MIME type."""
    tabular_mime_types = ['csv', 'xlsx', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    if config and 'tabular_mime_types' in config:
        tabular_mime_types = config['tabular_mime_types']
    return any(mime_type.startswith(t) for t in tabular_mime_types)

def extract_schema_from_csv(file_content: bytes) -> List[str]:
    """Extract column names from a CSV file."""
    try:
        text_content = file_content.decode('utf-8', errors='replace')
        csv_reader = csv.reader(io.StringIO(text_content))
        return next(csv_reader)
    except Exception as e:
        print(f"Error extracting schema from CSV: {e}")
        return []

def extract_rows_from_csv(file_content: bytes) -> List[Dict[str, Any]]:
    """Extract rows from a CSV file as a list of dictionaries."""
    try:
        text_content = file_content.decode('utf-8', errors='replace')
        csv_reader = csv.DictReader(io.StringIO(text_content))
        return list(csv_reader)
    except Exception as e:
        print(f"Error extracting rows from CSV: {e}")
        return []
