from typing import Dict, Any, Optional
from app.core.http_client import HTTPClient

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
        try:
            data = await self.client.get(f"/repos/{owner}/{repo_name}")
            return {
                "stars": data.get("stargazers_count", 0),
                "open_issues": data.get("open_issues_count", 0),
                "description": data.get("description", ""),
                "last_push": data.get("pushed_at", "")
            }
        except Exception as e:
            print(f"GitHub API Error: {e}")
            return {}

    async def get_readme(self, owner: str, repo_name: str) -> str:
        try:
            data = await self.client.get(f"/repos/{owner}/{repo_name}/readme")
            return data.get("download_url", "")
        except Exception:
            return ""

