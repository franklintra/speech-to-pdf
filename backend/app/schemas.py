from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    is_admin: bool = False
    credits: Optional[float] = 60.0

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None
    credits: Optional[float] = None

class UserLogin(BaseModel):
    username: str
    password: str

class User(BaseModel):
    id: int
    email: str
    username: str
    is_active: bool
    is_admin: bool
    credits: float
    created_at: datetime
    created_by: Optional[int] = None
    
    class Config:
        from_attributes = True

class UserListResponse(BaseModel):
    users: List[User]
    total: int

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class ConversionCreate(BaseModel):
    display_name: str
    language: str = "fr"
    model: str = "nova-3"

class ConversionUpdate(BaseModel):
    display_name: str

class UserInfo(BaseModel):
    id: int
    username: str
    email: str
    credits: float
    
    class Config:
        from_attributes = True

class ConversionResponse(BaseModel):
    id: int
    display_name: str
    original_filename: str
    status: str
    duration: Optional[float]
    model_used: Optional[str]
    language: Optional[str]
    error_message: Optional[str]
    created_at: datetime
    updated_at: datetime
    has_docx: bool = False
    has_pdf: bool = False
    has_txt: bool = False
    user: Optional[UserInfo] = None  # Include user info for admins
    
    class Config:
        from_attributes = True

class ConversionListResponse(BaseModel):
    conversions: List[ConversionResponse]
    total: int