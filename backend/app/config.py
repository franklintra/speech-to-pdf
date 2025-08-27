import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")
    SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here-change-this-in-production")
    ALGORITHM = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "43200"))  # 30 days
    
    DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")
    
    UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
    MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", "104857600"))  # 100MB
    
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    
    # Credits warning threshold in minutes
    CREDITS_WARNING_THRESHOLD = float(os.getenv("CREDITS_WARNING_THRESHOLD", "10.0"))
    
    # Create directories if they don't exist
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    os.makedirs(os.path.join(UPLOAD_DIR, "audio"), exist_ok=True)
    os.makedirs(os.path.join(UPLOAD_DIR, "docs"), exist_ok=True)
    os.makedirs(os.path.join(UPLOAD_DIR, "pdfs"), exist_ok=True)

settings = Settings()