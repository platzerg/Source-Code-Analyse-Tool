import os
import shutil
from typing import Optional
from git import Repo
import logging

logger = logging.getLogger(__name__)

class GitCloner:
    def __init__(self, base_repo_dir: str):
        self.base_repo_dir = os.path.abspath(base_repo_dir)
        os.makedirs(self.base_repo_dir, exist_ok=True)

    def clone_or_update(self, repo_url: str, repo_name: str, branch: str = "main") -> Optional[str]:
        """
        Clones a repository or updates it if it already exists.
        Returns the path to the repository.
        """
        target_dir = os.path.join(self.base_repo_dir, repo_name)
        
        try:
            if os.path.exists(target_dir):
                print(f"Repository {repo_name} already exists. Updating...")
                repo = Repo(target_dir)
                origin = repo.remotes.origin
                origin.pull()
                print(f"Successfully updated {repo_name}")
            else:
                print(f"Cloning {repo_url} into {target_dir}...")
                Repo.clone_from(repo_url, target_dir, branch=branch, depth=1)
                print(f"Successfully cloned {repo_name}")
            
            return target_dir
        except Exception as e:
            print(f"Error cloning/updating repository {repo_name}: {e}")
            return None

    def cleanup(self, repo_name: str):
        """Removes the cloned repository directory."""
        target_dir = os.path.join(self.base_repo_dir, repo_name)
        if os.path.exists(target_dir):
            shutil.rmtree(target_dir)
            print(f"Cleaned up {repo_name}")
