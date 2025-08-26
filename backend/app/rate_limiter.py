from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from fastapi import Request
import hashlib

def get_client_identifier(request: Request) -> str:
    """
    Get a unique identifier for the client making the request.
    Uses IP address as the primary identifier.
    """
    # Get the client's IP address
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        # Use the first IP in the X-Forwarded-For header (real client IP)
        ip = forwarded.split(',')[0].strip()
    else:
        # Fall back to direct client IP
        ip = request.client.host if request.client else "unknown"
    
    # Add the endpoint path to make rate limits endpoint-specific
    path = request.url.path
    identifier = f"{ip}:{path}"
    
    return identifier

# Create a limiter instance with custom key function
limiter = Limiter(
    key_func=get_client_identifier,
    default_limits=["200 per hour"],  # Global default limit
    storage_uri="memory://",  # Use in-memory storage (can be changed to Redis for distributed systems)
)

# Login-specific rate limit decorator
login_rate_limit = limiter.limit("5 per minute")  # Allow 5 login attempts per minute per IP