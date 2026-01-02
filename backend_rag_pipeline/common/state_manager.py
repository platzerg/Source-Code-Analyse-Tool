"""
Database State Manager for RAG Pipeline
Handles persistence of pipeline state (last_check_time, known_files) in Supabase database.
"""
import os
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Union
from supabase import create_client, Client

class StateManager:
    def __init__(self, pipeline_id: str, pipeline_type: str):
        self.pipeline_id = pipeline_id
        self.pipeline_type = pipeline_type
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are required")
        self.supabase: Client = create_client(supabase_url, supabase_key)
        self.logger = logging.getLogger(__name__)
        
    def load_state(self) -> Dict[str, Any]:
        try:
            response = self.supabase.table('rag_pipeline_state').select('*').eq('pipeline_id', self.pipeline_id).execute()
            if response.data and len(response.data) > 0:
                record = response.data[0]
                last_check_time = None
                if record.get('last_check_time'):
                    try:
                        last_check_time = datetime.fromisoformat(record['last_check_time'].replace('Z', '+00:00'))
                    except (ValueError, AttributeError):
                        self.logger.warning(f"Invalid last_check_time format in database: {record.get('last_check_time')}")
                return {
                    'last_check_time': last_check_time,
                    'known_files': record.get('known_files') or {},
                    'exists': True
                }
            return {'last_check_time': None, 'known_files': {}, 'exists': False}
        except Exception as e:
            self.logger.error(f"Error loading state from database: {e}")
            return {'last_check_time': None, 'known_files': {}, 'exists': False}
    
    def save_state(self, last_check_time: Optional[datetime] = None, 
                   known_files: Optional[Dict[str, str]] = None) -> bool:
        try:
            data = {
                'pipeline_id': self.pipeline_id,
                'pipeline_type': self.pipeline_type,
                'last_run': datetime.now(timezone.utc).isoformat()
            }
            if last_check_time is not None:
                if last_check_time.tzinfo is None:
                    last_check_time = last_check_time.replace(tzinfo=timezone.utc)
                data['last_check_time'] = last_check_time.isoformat()
            if known_files is not None:
                data['known_files'] = known_files
            state = self.load_state()
            if state['exists']:
                response = self.supabase.table('rag_pipeline_state').update(data).eq('pipeline_id', self.pipeline_id).execute()
            else:
                response = self.supabase.table('rag_pipeline_state').insert(data).execute()
            return bool(response.data)
        except Exception as e:
            self.logger.error(f"Error saving state to database: {e}")
            return False
    
    def update_last_check_time(self, last_check_time: datetime) -> bool:
        return self.save_state(last_check_time=last_check_time)

def get_state_manager(pipeline_type: str) -> Optional[StateManager]:
    pipeline_id = os.getenv('RAG_PIPELINE_ID')
    if not pipeline_id:
        return None
    try:
        return StateManager(pipeline_id, pipeline_type)
    except Exception as e:
        logging.error(f"Failed to create StateManager: {e}")
        return None

def load_state_from_config(config_path: str) -> Dict[str, Any]:
    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
        last_check_time_str = config.get('last_check_time', '1970-01-01T00:00:00.000Z')
        try:
            last_check_time = datetime.strptime(last_check_time_str, '%Y-%m-%dT%H:%M:%S.%fZ')
        except ValueError:
            last_check_time = datetime.strptime('1970-01-01T00:00:00.000Z', '%Y-%m-%dT%H:%M:%S.%fZ')
        return {'last_check_time': last_check_time, 'known_files': {}, 'exists': True}
    except Exception:
        return {'last_check_time': datetime.strptime('1970-01-01T00:00:00.000Z', '%Y-%m-%dT%H:%M:%S.%fZ'), 'known_files': {}, 'exists': False}

def save_state_to_config(config_path: str, last_check_time: datetime, config: Dict[str, Any]) -> bool:
    try:
        config['last_check_time'] = last_check_time.strftime('%Y-%m-%dT%H:%M:%S.%fZ')
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)
        return True
    except Exception as e:
        logging.error(f"Error saving state to config: {e}")
        return False
