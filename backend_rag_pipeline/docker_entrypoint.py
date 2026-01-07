import os
import sys
import argparse
import asyncio
import time
from pathlib import Path

from common.observability import configure_langfuse

# Add core directories to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Global tracer
tracer = None

def main():
    global tracer
    # Initialize Langfuse observability (mirrors backend)
    tracer = configure_langfuse()
    
    parser = argparse.ArgumentParser(description='RAG Pipeline Entrypoint')
    parser.add_argument('--pipeline', type=str, choices=['local', 'git', 'google_drive'], default=os.getenv('RAG_PIPELINE_TYPE', 'local'))
    parser.add_argument('--mode', type=str, choices=['continuous', 'single'], default=os.getenv('RUN_MODE', 'continuous'))
    parser.add_argument('--directory', type=str, default=os.getenv('RAG_WATCH_DIRECTORY', 'data'))
    parser.add_argument('--interval', type=int, default=int(os.getenv('RAG_POLL_INTERVAL', '60')))
    parser.add_argument('--folder-id', type=str, default=os.getenv('RAG_WATCH_FOLDER_ID', ''))
    
    args = parser.parse_args()
    
    if args.pipeline == 'local':
        local_files_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'Local_Files')
        sys.path.insert(0, local_files_dir)
        os.chdir(local_files_dir)
        
        from Local_Files import main as local_main
        local_main.main()
    elif args.pipeline == 'git':
        import repo_watcher as git_watcher
        watcher = git_watcher.GitRepositoryWatcher(repos_dir="repos")
        if args.mode == 'single':
            asyncio.run(watcher.run_once())
        else:
            asyncio.run(watcher.watch(interval=args.interval))
    elif args.pipeline == 'google_drive':
        from Google_Drive import main as gdrive_main
        gdrive_main.main()

if __name__ == "__main__":
    main()
