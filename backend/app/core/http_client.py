import aiohttp
import asyncio
from typing import Optional, Dict, Any

class HTTPClient:
    """
    A robust async HTTP client with timeout, retries, and error handling.
    """
    def __init__(self, base_url: str = "", timeout: int = 10, retries: int = 3, headers: Optional[Dict] = None):
        self.base_url = base_url
        self.timeout = aiohttp.ClientTimeout(total=timeout)
        self.retries = retries
        self.default_headers = headers or {}

    async def _request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        url = f"{self.base_url}{endpoint}"
        
        # Merge default headers with request-specific headers
        headers = {**self.default_headers, **kwargs.pop('headers', {})}
        
        for attempt in range(self.retries):
            try:
                async with aiohttp.ClientSession(timeout=self.timeout) as session:
                    async with session.request(method, url, headers=headers, **kwargs) as response:
                        response.raise_for_status()
                        return await response.json()
            except (aiohttp.ClientError, asyncio.TimeoutError) as e:
                if attempt == self.retries - 1:
                    print(f"Request failed after {self.retries} attempts: {e}")
                    raise e
                await asyncio.sleep(1 * (attempt + 1)) # Exponential backoff
        return {}

    async def get(self, endpoint: str, params: Optional[Dict] = None, headers: Optional[Dict] = None) -> Dict[str, Any]:
        return await self._request("GET", endpoint, params=params, headers=headers)

    async def post(self, endpoint: str, json_data: Optional[Dict] = None, headers: Optional[Dict] = None) -> Dict[str, Any]:
        return await self._request("POST", endpoint, json=json_data, headers=headers)

