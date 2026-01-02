from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta, timezone
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from google.oauth2.credentials import Credentials
from google.oauth2.service_account import Credentials as ServiceAccountCredentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.auth.exceptions import RefreshError
import random
import time
import json
import sys
import os
import io
from pathlib import Path

# Add shared parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from common.text_processor import extract_text_from_file
from common.db_handler import process_file_for_rag, delete_document_by_file_id
from common.state_manager import get_state_manager

# If modifying these scopes, delete any existing token.json.
SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly',
          'https://www.googleapis.com/auth/drive.readonly']

class GoogleDriveWatcher:
    def __init__(self, credentials_path: str = 'credentials.json', token_path: str = 'token.json', folder_id: str = None, config_path: str = None):
        """
        Initialize the Google Drive watcher.
        """
        self.credentials_path = credentials_path
        self.token_path = token_path
        self.folder_id = folder_id
        self.service = None
        self.known_files = {}  # Store file IDs and their last modified time
        self.initialized = False
        
        # Initialize state manager
        self.state_manager = get_state_manager('google_drive')
        
        # Load configuration
        self.config_path = config_path or os.path.join(os.path.dirname(os.path.abspath(__file__)), 'config.json')
        self.load_config()
        
    def load_config(self) -> None:
        """Load configuration and state."""
        try:
            if os.path.exists(self.config_path):
                with open(self.config_path, 'r') as f:
                    self.config = json.load(f)
            else:
                self.config = {}
        except Exception as e:
            print(f"Error loading config: {e}")
            self.config = {}

        # Default configuration
        if "supported_mime_types" not in self.config:
            self.config["supported_mime_types"] = ["application/pdf", "text/plain", "text/html", "text/csv"]
        if "text_processing" not in self.config:
            self.config["text_processing"] = {"default_chunk_size": 400, "default_chunk_overlap": 0}

        # Load state from database
        if self.state_manager:
            state = self.state_manager.load_state()
            self.last_check_time = state.get('last_check_time') or datetime.strptime('1970-01-01T00:00:00.000Z', '%Y-%m-%dT%H:%M:%S.%fZ').replace(tzinfo=timezone.utc)
            self.known_files = state.get('known_files', {})
            print(f"[Google Drive] Loaded state from DB: {len(self.known_files)} known files")
        else:
            self.last_check_time = datetime.now(timezone.utc) - timedelta(days=365)
            self.known_files = {}

        # Overrides
        env_folder_id = os.getenv('RAG_WATCH_FOLDER_ID')
        if env_folder_id:
            self.folder_id = env_folder_id
            
    def save_state(self) -> None:
        """Save state to database."""
        if self.state_manager:
            self.state_manager.save_state(
                last_check_time=self.last_check_time,
                known_files=self.known_files
            )

    def authenticate(self) -> None:
        """Authenticate with Google Drive."""
        creds = None
        # Service Account
        service_account_json = os.getenv('GOOGLE_DRIVE_CREDENTIALS_JSON')
        if service_account_json:
            try:
                service_account_info = json.loads(service_account_json)
                creds = ServiceAccountCredentials.from_service_account_info(service_account_info, scopes=SCOPES)
                print("[Google Drive] Using service account auth")
            except Exception as e:
                print(f"[Google Drive] Service account error: {e}")

        # Local OAuth2
        if not creds and os.path.exists(self.token_path):
            try:
                creds = Credentials.from_authorized_user_info(json.loads(open(self.token_path).read()), SCOPES)
            except Exception:
                pass

        if not creds or (creds.expired and creds.refresh_token):
            if creds and creds.expired and creds.refresh_token:
                try:
                    creds.refresh(Request())
                except RefreshError:
                    creds = self._oauth2_flow()
            else:
                creds = self._oauth2_flow()

        self.service = build('drive', 'v3', credentials=creds)

    def _oauth2_flow(self) -> Credentials:
        if not os.path.exists(self.credentials_path):
            raise FileNotFoundError("Missing credentials.json for Google Drive OAuth2 flow")
        flow = InstalledAppFlow.from_client_secrets_file(self.credentials_path, SCOPES)
        creds = flow.run_local_server(port=0)
        with open(self.token_path, 'w') as token:
            token.write(creds.to_json())
        return creds

    def get_folder_contents(self, folder_id: str, time_str: str) -> List[Dict[str, Any]]:
        query = f"(modifiedTime > '{time_str}' or createdTime > '{time_str}') and '{folder_id}' in parents"
        results = self.service.files().list(q=query, pageSize=100, fields="nextPageToken, files(id, name, mimeType, webViewLink, modifiedTime, createdTime, trashed)").execute()
        items = results.get('files', [])
        
        # Subfolders
        folder_query = f"'{folder_id}' in parents and mimeType = 'application/vnd.google-apps.folder'"
        folder_results = self.service.files().list(q=folder_query, fields="files(id)").execute()
        for sub in folder_results.get('files', []):
            items.extend(self.get_folder_contents(sub['id'], time_str))
        return items

    def process_file(self, file: Dict[str, Any]) -> None:
        file_id = file['id']
        file_name = file['name']
        mime_type = file['mimeType']
        is_trashed = file.get('trashed', False)

        if is_trashed:
            print(f"[Google Drive] Removing trashed file: {file_name}")
            delete_document_by_file_id(file_id)
            self.known_files.pop(file_id, None)
            return

        # Simple MIME check
        supported = self.config.get("supported_mime_types", [])
        if not any(mime_type.startswith(t.split('/')[0]) or mime_type == t for t in supported):
            return

        # Download
        try:
            request = self.service.files().get_media(fileId=file_id)
            if mime_type in self.config.get('export_mime_types', {}):
                request = self.service.files().export_media(fileId=file_id, mimeType=self.config['export_mime_types'][mime_type])
            
            fh = io.BytesIO()
            downloader = MediaIoBaseDownload(fh, request)
            done = False
            while not done:
                _, done = downloader.next_chunk()
            fh.seek(0)
            content = fh.read()
            
            text = extract_text_from_file(content, mime_type, file_name, self.config)
            if text:
                link = file.get('webViewLink', '')
                process_file_for_rag(content, text, file_id, link, file_name, mime_type, self.config)
                self.known_files[file_id] = file.get('modifiedTime')
                print(f"[Google Drive] Processed: {file_name}")
        except Exception as e:
            print(f"[Google Drive] Error processing {file_name}: {e}")

    def watch_for_changes(self, interval_seconds: int = 60) -> None:
        print(f"[Google Drive] Starting watcher (Interval: {interval_seconds}s)")
        if not self.service: self.authenticate()
        
        while True:
            try:
                time_str = self.last_check_time.strftime('%Y-%m-%dT%H:%M:%S.%fZ')
                if self.folder_id:
                    files = self.get_folder_contents(self.folder_id, time_str)
                else:
                    query = f"modifiedTime > '{time_str}' or createdTime > '{time_str}'"
                    files = self.service.files().list(q=query, pageSize=100, fields="files(id, name, mimeType, webViewLink, modifiedTime, createdTime, trashed)").execute().get('files', [])
                
                for f in files:
                    self.process_file(f)
                
                self.last_check_time = datetime.now(timezone.utc)
                self.save_state()
                time.sleep(interval_seconds)
            except KeyboardInterrupt:
                break
            except Exception as e:
                print(f"[Google Drive] Loop error: {e}")
                time.sleep(10)
