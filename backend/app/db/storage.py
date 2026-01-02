import json
import os
import shutil
from typing import Any, List, Dict, Union
from threading import Lock

# Simple in-memory lock for thread safety during simple file writes
_file_locks: Dict[str, Lock] = {}

def _get_lock(file_path: str) -> Lock:
    if file_path not in _file_locks:
        _file_locks[file_path] = Lock()
    return _file_locks[file_path]

def load_json(file_path: str, default: Any = None) -> Any:
    """
    Robustly load JSON data from a file.
    Returns `default` if file doesn't exist or is corrupted (after backup check).
    """
    if not os.path.exists(file_path):
        return default if default is not None else []

    lock = _get_lock(file_path)
    with lock:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except json.JSONDecodeError:
            print(f"Error: Corrupted JSON file: {file_path}")
            # Optional: Attempt to restore from .bak if exists?
            return default if default is not None else []
        except Exception as e:
            print(f"Error loading {file_path}: {e}")
            return default if default is not None else []

def save_json(file_path: str, data: Any) -> bool:
    """
    Robustly save data to a JSON file (atomic write).
    Creates a .bak file before overwriting.
    """
    lock = _get_lock(file_path)
    with lock:
        try:
            # 1. Create Backup if exists
            if os.path.exists(file_path):
                shutil.copy2(file_path, f"{file_path}.bak")

            # 2. Atomic Write Attempt
            temp_path = f"{file_path}.tmp"
            try:
                with open(temp_path, "w", encoding="utf-8") as f:
                    json.dump(data, f, indent=4, ensure_ascii=False)
                
                # 3. Rename with fallback
                try:
                    os.replace(temp_path, file_path)
                except OSError as e:
                    print(f"Warning: Atomic rename failed ({e}). Falling back to copy.", flush=True)
                    shutil.copy2(temp_path, file_path)
                    os.remove(temp_path)
                    
            except (OSError, PermissionError) as e:
                print(f"Warning: Failed to create temp file ({e}). Writing directly to {file_path}.", flush=True)
                # Fallback: Write directly to target file
                with open(file_path, "w", encoding="utf-8") as f:
                    json.dump(data, f, indent=4, ensure_ascii=False)
                    
            return True
        except Exception as e:
            print(f"Error saving to {file_path}: {e}", flush=True)
            return False
