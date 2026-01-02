import os
import time
import sys
import logging
from typing import List, Dict, Any
from datetime import datetime

# Add root and common to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'common'))

from common.db_handler import supabase, process_file_for_rag
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

    def fetch_pending_repositories(self) -> List[Dict[str, Any]]:
        """Fetch repositories with status 'pending'."""
        try:
            response = supabase.table("repositories").select("*").eq("status", "pending").execute()
            return response.data
        except Exception as e:
            print(f"Error fetching pending repositories: {e}")
            return []

    def update_repo_status(self, repo_id: int, status: str, error_message: str = None):
        """Update repository status in the database."""
        try:
            updates = {"status": status, "updated_at": datetime.now().isoformat()}
            if status == 'analyzed':
                updates["last_analyzed_at"] = datetime.now().isoformat()
            if error_message:
                updates["repo_scan"] = error_message # Storing error info in repo_scan for now
            
            supabase.table("repositories").update(updates).eq("id", repo_id).execute()
        except Exception as e:
            print(f"Error updating repository {repo_id} status: {e}")

    def analyze_repository(self, repo_data: Dict[str, Any]):
        """Analyze a single repository: clone, parse, and embed."""
        repo_id = repo_data['id']
        repo_url = repo_data['url']
        repo_name = repo_data['name']
        branch = repo_data.get('main_branch', 'main')

        print(f"\n--- Starting Analysis for {repo_name} ({repo_url}) ---")
        self.update_repo_status(repo_id, "cloning")

        # 1. Clone
        repo_path = self.cloner.clone_or_update(repo_url, repo_name, branch)
        if not repo_path:
            self.update_repo_status(repo_id, "error", "Failed to clone repository")
            return

        # 2. Parse and Embed
        self.update_repo_status(repo_id, "analyzing")
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
                success = process_file_for_rag(
                    file_content=code_content.encode('utf-8'),
                    text=code_content,
                    file_id=file_id,
                    file_url=file_url,
                    file_title=f"{repo_name}/{rel_path}",
                    mime_type="text/plain", # Defaulting to text for code
                    config=self.config
                )
                
                if success:
                    processed_count += 1

            self.update_repo_status(repo_id, "analyzed")
            print(f"Successfully analyzed {repo_name}. Processed {processed_count} files.")

        except Exception as e:
            print(f"Error during analysis of {repo_name}: {e}")
            self.update_repo_status(repo_id, "error", str(e))

    def run_once(self):
        """Perform one check and analysis cycle."""
        repos = self.fetch_pending_repositories()
        if not repos:
            print("No pending repositories found.")
            return

        print(f"Detected {len(repos)} pending repositories.")
        for repo in repos:
            self.analyze_repository(repo)

    def watch(self, interval: int = 60):
        """Continuously watch for new repositories."""
        print(f"Git Repository Watcher started. Polling every {interval}s...")
        while True:
            self.run_once()
            time.sleep(interval)

if __name__ == "__main__":
    watcher = GitRepositoryWatcher()
    watcher.watch()
