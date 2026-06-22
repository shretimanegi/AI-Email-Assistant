import logging
import json
from typing import Any, Optional
import redis
from app.config import settings

logger = logging.getLogger(__name__)

class RedisCacheService:
    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None
        self.local_cache = {}  # Mock fallback
        try:
            self.redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
            # Ping to verify connection
            self.redis_client.ping()
            logger.info("Connected to Redis successfully.")
        except Exception as e:
            logger.warning(f"Could not connect to Redis: {e}. Falling back to in-memory dictionary.")
            self.redis_client = None

    def get(self, key: str) -> Optional[Any]:
        if self.redis_client:
            try:
                val = self.redis_client.get(key)
                return json.loads(val) if val else None
            except Exception as e:
                logger.error(f"Redis get failed: {e}")
                return None
        return self.local_cache.get(key)

    def set(self, key: str, value: Any, expire_seconds: int = 3600) -> bool:
        if self.redis_client:
            try:
                self.redis_client.setex(key, expire_seconds, json.dumps(value))
                return True
            except Exception as e:
                logger.error(f"Redis setex failed: {e}")
                return False
        self.local_cache[key] = value
        return True

    def delete(self, key: str) -> bool:
        if self.redis_client:
            try:
                self.redis_client.delete(key)
                return True
            except Exception as e:
                logger.error(f"Redis delete failed: {e}")
                return False
        if key in self.local_cache:
            del self.local_cache[key]
            return True
        return False

redis_cache = RedisCacheService()
