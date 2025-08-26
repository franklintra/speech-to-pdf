from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from .database import engine, Base
from .routers import auth, conversions, admin
from .config import settings
from .rate_limiter import limiter

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Speech to PDF API", version="1.0.0")

# Add rate limiter to the app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(conversions.router)
app.include_router(admin.router)

@app.get("/")
def read_root():
    return {"message": "Speech to PDF API", "version": "1.0.0"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}