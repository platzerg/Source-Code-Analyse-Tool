"""
Database State Manager for RAG Pipeline
Handles persistence of pipeline state (last_check_time, known_files) in database.
"""
import os
import json
import logging
import asyncio
import asyncpg
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Union
from supabase import create_client, Client

class StateManager:
    def __init__(self, pipeline_id: str, pipeline_type: str):
        self.pipeline_id = pipeline_id
        self.pipeline_type = pipeline_type
        self.database_provider = os.getenv("DATABASE_PROVIDER", "supabase").lower()
        self.logger = logging.getLogger(__name__)
        
        # Init Supabase if needed
        self.supabase: Optional[Client] = None
        if self.database_provider == "supabase":
            supabase_url = os.getenv('SUPABASE_URL')
            supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
            if not supabase_url or not supabase_key:
                raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are required")
            self.supabase = create_client(supabase_url, supabase_key)
        
        # Pool for Postgres
        self._pg_pool: Optional[asyncpg.Pool] = None

    async def _get_pg_pool(self) -> asyncpg.Pool:
        if self._pg_pool is None:
            # Import here to avoid circular dependencies if any
            from common.db_handler import get_pg_pool
            self._pg_pool = await get_pg_pool()
        return self._pg_pool

    async def load_state_async(self) -> Dict[str, Any]:
        try:
            if self.database_provider == "postgres":
                pool = await self._get_pg_pool()
                async with pool.acquire() as conn:
                    row = await conn.fetchrow(
                        "SELECT * FROM rag_pipeline_state WHERE pipeline_id = $1", 
                        self.pipeline_id
                    )
                    if row:
                        record = dict(row)
                        last_check_time = None
                        if record.get('last_check_time'):
                            last_check_time = record['last_check_time']
                            if isinstance(last_check_time, str):
                                try:
                                    last_check_time = datetime.fromisoformat(last_check_time.replace('Z', '+00:00'))
                                except ValueError:
                                    pass
                        
                        known_files = record.get('known_files')
                        if isinstance(known_files, str):
                            known_files = json.loads(known_files)
                        
                        return {
                            'last_check_time': last_check_time,
                            'known_files': known_files or {},
                            'exists': True
                        }
            else:
                if not self.supabase: return {'last_check_time': None, 'known_files': {}, 'exists': False}
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
    
    def load_state(self) -> Dict[str, Any]:
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # This is tricky if already in a loop, but repo_watcher is usually sync
                return asyncio.run(self.load_state_async())
            else:
                return asyncio.run(self.load_state_async())
        except RuntimeError:
            return asyncio.run(self.load_state_async())

    async def save_state_async(self, last_check_time: Optional[datetime] = None, 
                   known_files: Optional[Dict[str, str]] = None) -> bool:
        try:
            # Prepare datetime objects for database
            last_run_dt = datetime.now(timezone.utc)
            last_check_time_dt = None
            
            if last_check_time is not None:
                if last_check_time.tzinfo is None:
                    last_check_time_dt = last_check_time.replace(tzinfo=timezone.utc)
                else:
                    last_check_time_dt = last_check_time

            if self.database_provider == "postgres":
                pool = await self._get_pg_pool()
                # Use UPSERT for Postgres - pass datetime objects directly
                async with pool.acquire() as conn:
                    await conn.execute(
                        """
                        INSERT INTO rag_pipeline_state (pipeline_id, pipeline_type, last_run, last_check_time, known_files)
                        VALUES ($1, $2, $3, $4, $5)
                        ON CONFLICT (pipeline_id) DO UPDATE 
                        SET last_run = EXCLUDED.last_run, 
                            last_check_time = EXCLUDED.last_check_time, 
                            known_files = EXCLUDED.known_files
                        """,
                        self.pipeline_id, self.pipeline_type, last_run_dt, 
                        last_check_time_dt, json.dumps(known_files or {})
                    )
                return True
            else:
                # For Supabase, use ISO strings
                data = {
                    'pipeline_id': self.pipeline_id,
                    'pipeline_type': self.pipeline_type,
                    'last_run': last_run_dt.isoformat()
                }
                if last_check_time_dt is not None:
                    data['last_check_time'] = last_check_time_dt.isoformat()
                if known_files is not None:
                    data['known_files'] = known_files
                    
                if not self.supabase: return False
                state = await self.load_state_async()
                if state['exists']:
                    response = self.supabase.table('rag_pipeline_state').update(data).eq('pipeline_id', self.pipeline_id).execute()
                else:
                    response = self.supabase.table('rag_pipeline_state').insert(data).execute()
                return bool(response.data)
        except Exception as e:
            self.logger.error(f"Error saving state to database: {e}")
            return False


    def save_state(self, last_check_time: Optional[datetime] = None, 
                   known_files: Optional[Dict[str, str]] = None) -> bool:
        return asyncio.run(self.save_state_async(last_check_time, known_files))
    
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
