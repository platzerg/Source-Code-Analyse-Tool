import os
import time
import sys
import logging
import asyncio
import json
from typing import List, Dict, Any, Optional
from datetime import datetime

# Add root and common to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'common'))

from common.db_handler import (
    supabase, 
    DATABASE_PROVIDER, 
    get_pg_pool, 
    process_file_for_rag_async
)
from common.git_cloner import GitCloner
from common.code_parser import CodeParser

class GitRepositoryWatcher:
    def __init__(self, repos_dir: str = "repos"):
        self.cloner = GitCloner(repos_dir)
        self.parser = CodeParser()
        self.config = {
            "supported_mime_types": ["text/plain", "application/x-javascript", "text/x-python"],
            "text_processing": {
                "default_chunk_size": 1500,
                "default_chunk_overlap": 150
            }
        }
        self.logger = logging.getLogger("repo_watcher")

    async def fetch_pending_repositories(self) -> List[Dict[str, Any]]:
        """Fetch repositories with status 'pending'."""
        try:
            if DATABASE_PROVIDER == "postgres":
                pool = await get_pg_pool()
                async with pool.acquire() as conn:
                    rows = await conn.fetch("SELECT * FROM repositories WHERE status = 'pending'")
                    return [dict(r) for r in rows]
            else:
                if not supabase: return []
                response = supabase.table("repositories").select("*").eq("status", "pending").execute()
                return response.data
        except Exception as e:
            self.logger.error(f"Error fetching pending repositories: {e}")
            return []

    async def update_repo_status(self, repo_id: int, status: str, error_message: str = None):
        """Update repository status in the database."""
        try:
            updates = {"status": status, "updated_at": datetime.now().isoformat()}
            if status == 'analyzed' or status == 'Cloned': # Cloned is used by some UI parts
                updates["last_analyzed_at"] = datetime.now().isoformat()
            if error_message:
                updates["repo_scan"] = error_message # Storing error info in repo_scan for now
            
            if DATABASE_PROVIDER == "postgres":
                pool = await get_pg_pool()
                async with pool.acquire() as conn:
                    # Construct SQL dynamically
                    columns = ", ".join([f"{k} = ${i+1}" for i, k in enumerate(updates.keys())])
                    values = list(updates.values())
                    repo_id_idx = len(values) + 1
                    sql = f"UPDATE repositories SET {columns} WHERE id = ${repo_id_idx}"
                    await conn.execute(sql, *values, repo_id)
            else:
                if not supabase: return
                supabase.table("repositories").update(updates).eq("id", repo_id).execute()
        except Exception as e:
            self.logger.error(f"Error updating repository {repo_id} status: {e}")

    async def analyze_repository(self, repo_data: Dict[str, Any]):
        """Analyze a single repository: clone, parse, and embed."""
        repo_id = repo_data['id']
        repo_url = repo_data['url']
        repo_name = repo_data['name']
        branch = repo_data.get('main_branch', 'main')

        print(f"\n--- Starting Analysis for {repo_name} ({repo_url}) ---")
        await self.update_repo_status(repo_id, "cloning")

        # 1. Clone
        repo_path = self.cloner.clone_or_update(repo_url, repo_name, branch)
        if not repo_path:
            await self.update_repo_status(repo_id, "error", "Failed to clone repository")
            return

        # 2. Parse and Embed
        await self.update_repo_status(repo_id, "analyzing")
        try:
            code_files = self.parser.get_repo_files(repo_path)
            print(f"Found {len(code_files)} code files to analyze.")

            processed_count = 0
            for file_path in code_files:
                rel_path = os.path.relpath(file_path, repo_path)
                code_content = self.parser.extract_code(file_path)
                
                if not code_content:
                    continue

                # Prepare RAG metadata
                file_id = f"repo_{repo_id}_{rel_path}"
                file_url = f"{repo_url}/blob/{branch}/{rel_path}"
                
                # Use core RAG logic to embed and store
                success = await process_file_for_rag_async(
                    file_content=code_content.encode('utf-8'),
                    text=code_content,
                    file_id=file_id,
                    file_url=file_url,
                    file_title=f"{repo_name}/{rel_path}",
                    mime_type="text/plain", 
                    config=self.config
                )
                
                if success:
                    processed_count += 1

            await self.update_repo_status(repo_id, "cloned")
            print(f"Successfully analyzed {repo_name}. Processed {processed_count} files.")

        except Exception as e:
            print(f"Error during analysis of {repo_name}: {e}")
            await self.update_repo_status(repo_id, "error", str(e))

    async def run_once(self):
        """Perform one check and analysis cycle."""
        repos = await self.fetch_pending_repositories()
        if not repos:
            # print("No pending repositories found.")
            return

        print(f"Detected {len(repos)} pending repositories.")
        for repo in repos:
            await self.analyze_repository(repo)

    async def watch(self, interval: int = 15):
        """Continuously watch for new repositories."""
        print(f"Git Repository Watcher started. Polling every {interval}s (Provider: {DATABASE_PROVIDER})...")
        while True:
            await self.run_once()
            await asyncio.sleep(interval)

async def main():
    logging.basicConfig(level=logging.INFO)
    watcher = GitRepositoryWatcher()
    await watcher.watch()

if __name__ == "__main__":
    asyncio.run(main())
