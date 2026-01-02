import argparse
from file_watcher import LocalFileWatcher

def main():
    parser = argparse.ArgumentParser(description='Local Files RAG Pipeline')
    parser.add_argument('--directory', type=str, default='../data', help='Directory to watch')
    parser.add_argument('--interval', type=int, default=60, help='Check interval')
    parser.add_argument('--mode', type=str, choices=['continuous', 'single'], default='continuous')
    # Ignore unknown arguments from docker_entrypoint
    args, unknown = parser.parse_known_args()
    
    watcher = LocalFileWatcher(watch_directory=args.directory)
    
    if args.mode == 'single':
        print("Running single check cycle...")
        watcher.check_for_changes()
    else:
        watcher.watch_for_changes(interval_seconds=args.interval)

if __name__ == "__main__":
    main()
