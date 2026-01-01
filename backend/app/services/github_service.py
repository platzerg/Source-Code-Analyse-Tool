from typing import Dict, Any, Optional
from app.core.http_client import HTTPClient
from contextlib import nullcontext

class GitHubService:
    def __init__(self, token: str = ""):
        headers = {
            "Accept": "application/vnd.github.v3+json"
        }
        if token:
            headers["Authorization"] = f"token {token}"
            
        self.client = HTTPClient(
            base_url="https://api.github.com",
            headers=headers
        )

    async def get_repo_details(self, owner: str, repo_name: str) -> Dict[str, Any]:
        """
        Fetch repository details (stars, issues, etc.) from GitHub.
        """
        # Import tracer from main module
        from app.main import tracer
        
        print(f"[GitHub] Fetching details for {owner}/{repo_name}...", flush=True)
        print(f"[GitHub] Tracer available: {tracer is not None}", flush=True)
        
        # Use tracer context if available, otherwise use nullcontext
        span_context = tracer.start_as_current_span(f"GitHub-API-{owner}/{repo_name}") if tracer else nullcontext()
        
        with span_context as span:
            try:
                if tracer and span:
                    print(f"[GitHub] Creating span for {owner}/{repo_name}", flush=True)
                    span.set_attribute("github.owner", owner)
                    span.set_attribute("github.repo", repo_name)
                    span.set_attribute("api.endpoint", f"/repos/{owner}/{repo_name}")
                
                data = await self.client.get(f"/repos/{owner}/{repo_name}")
                print(f"[GitHub] API response received: {len(data)} keys", flush=True)
                
                result = {
                    "stars": data.get("stargazers_count", 0),
                    "open_issues": data.get("open_issues_count", 0),
                    "description": data.get("description", ""),
                    "last_push": data.get("pushed_at", "")
                }
                
                print(f"[GitHub] Stars: {result['stars']}, Issues: {result['open_issues']}", flush=True)
                
                if tracer and span:
                    span.set_attribute("output.stars", result["stars"])
                    span.set_attribute("output.open_issues", result["open_issues"])
                    print(f"[GitHub] Span attributes set successfully", flush=True)
                
                return result
            except Exception as e:
                if tracer and span:
                    span.set_attribute("error", str(e))
                    span.set_attribute("error.type", type(e).__name__)
                print(f"[GitHub] API Error: {e}", flush=True)
                return {}

    async def get_readme(self, owner: str, repo_name: str) -> str:
        try:
            data = await self.client.get(f"/repos/{owner}/{repo_name}/readme")
            return data.get("download_url", "")
        except Exception:
            return ""

