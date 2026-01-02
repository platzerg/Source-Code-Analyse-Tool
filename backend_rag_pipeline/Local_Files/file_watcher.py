from typing import Dict, Any, List, Optional
from datetime import datetime
import mimetypes
import time
import json
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from common.text_processor import extract_text_from_file
from common.db_handler import delete_document_by_file_id, process_file_for_rag
from common.state_manager import get_state_manager, load_state_from_config, save_state_to_config

class LocalFileWatcher:
    def __init__(self, watch_directory: str = None, config_path: str = None):
        self.state_manager = get_state_manager('local_files')
        self.known_files = {}
        self.initialized = False
        self.config = {}
        self.config_path = config_path or os.path.join(os.path.dirname(os.path.abspath(__file__)), 'config.json')
        self.load_config()
        self.watch_directory = watch_directory or self.config.get('watch_directory', 'data')
        self.watch_directory = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), self.watch_directory))
        mimetypes.init()
        print(f"Local File Watcher initialized. Watching directory: {self.watch_directory}")
    
    def load_config(self) -> None:
        try:
            with open(self.config_path, 'r') as f:
                self.config = json.load(f)
        except Exception:
            self.config = {
                "supported_mime_types": ["application/pdf", "text/plain", "text/csv"],
                "text_processing": {"default_chunk_size": 400, "default_chunk_overlap": 0},
                "last_check_time": "1970-01-01T00:00:00.000Z"
            }
        
        if self.state_manager:
            state = self.state_manager.load_state()
            self.last_check_time = state.get('last_check_time') or datetime.strptime('1970-01-01T00:00:00.000Z', '%Y-%m-%dT%H:%M:%S.%fZ')
            self.known_files = state.get('known_files', {})
        else:
            state = load_state_from_config(self.config_path)
            self.last_check_time = state.get('last_check_time')
            self.known_files = {}

    def save_state(self) -> None:
        if self.state_manager:
            self.state_manager.save_state(last_check_time=self.last_check_time, known_files=self.known_files)
        else:
            save_state_to_config(self.config_path, self.last_check_time, self.config)

    def get_mime_type(self, file_path: str) -> str:
        mime_type, _ = mimetypes.guess_type(file_path)
        return mime_type or 'text/plain'

    def get_changes(self) -> List[Dict[str, Any]]:
        changed_files = []
        for root, _, files in os.walk(self.watch_directory):
            for file_name in files:
                file_path = os.path.join(root, file_name)
                mod_time = datetime.fromtimestamp(os.path.getmtime(file_path))
                if file_path not in self.known_files or mod_time > self.last_check_time:
                    changed_files.append({
                        'id': file_path, 'name': file_name, 'mimeType': self.get_mime_type(file_path),
                        'webViewLink': f"file://{file_path}", 'modifiedTime': mod_time.isoformat()
                    })
        self.last_check_time = datetime.now()
        return changed_files

    def check_for_changes(self) -> Dict[str, Any]:
        print("Checking for changes...")
        changes = self.get_changes()
        for file in changes:
            self.process_file(file)
        self.save_state()
        return {'files_processed': len(changes)}

    def process_file(self, file: Dict[str, Any]) -> None:
        file_path = file['id']
        with open(file_path, 'rb') as f:
            content = f.read()
        text = extract_text_from_file(content, file['mimeType'], file['name'], self.config)
        if text:
            process_file_for_rag(content, text, file_path, file['webViewLink'], file['name'], file['mimeType'], self.config)
            self.known_files[file_path] = file['modifiedTime']

    def watch_for_changes(self, interval_seconds: int = 60) -> None:
        while True:
            self.check_for_changes()
            time.sleep(interval_seconds)
