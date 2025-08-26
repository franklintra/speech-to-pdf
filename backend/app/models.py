from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    credits = Column(Float, default=0.0)  # Credits in minutes
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    conversions = relationship("Conversion", back_populates="user", cascade="all, delete-orphan")

class Conversion(Base):
    __tablename__ = "conversions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    original_filename = Column(String, nullable=False)
    display_name = Column(String, nullable=False)  # User can rename
    audio_path = Column(String)
    docx_path = Column(String)
    pdf_path = Column(String)
    json_path = Column(String)
    txt_path = Column(String)
    
    duration = Column(Float)
    model_used = Column(String)
    language = Column(String)
    
    status = Column(String, default="pending")  # pending, processing, completed, failed
    error_message = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="conversions")