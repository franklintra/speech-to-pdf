from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import uuid
import aiofiles
from pathlib import Path
from ..database import get_db
from .. import models, schemas, auth, converter
from ..config import settings

router = APIRouter(prefix="/api/conversions", tags=["conversions"])

ALLOWED_EXTENSIONS = {'.wav', '.mp3', '.m4a', '.flac', '.aac', '.ogg', '.opus', '.webm', '.mp4', '.mkv', '.mov'}

def validate_file(filename: str):
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type {ext} not supported")
    return ext

async def process_conversion(conversion_id: int, audio_path: str, output_base: str, display_name: str, language: str, user_id: int, db: Session):
    """Background task to process audio conversion"""
    conversion = db.query(models.Conversion).filter(models.Conversion.id == conversion_id).first()
    if not conversion:
        return
    
    try:
        conversion.status = "processing"
        db.commit()
        
        result = await converter.transcribe_and_convert(
            audio_path=audio_path,
            output_base_path=output_base,
            display_name=display_name,
            language=language,
            model="nova-3"  # Always use nova-3
        )
        
        conversion.json_path = result["json_path"]
        conversion.txt_path = result["txt_path"]
        conversion.docx_path = result["docx_path"]
        conversion.pdf_path = result["pdf_path"]
        conversion.duration = result["duration"]
        conversion.model_used = result["model_used"]
        conversion.language = result["language"]
        conversion.status = "completed"
        
        # Deduct credits after successful transcription (skip for admin users)
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if user and conversion.duration and not user.is_admin:
            # Convert duration from seconds to minutes
            duration_minutes = conversion.duration / 60.0
            user.credits = max(0, user.credits - duration_minutes)
            db.commit()
        
    except Exception as e:
        conversion.status = "failed"
        conversion.error_message = str(e)
    
    db.commit()

@router.post("/upload", response_model=schemas.ConversionResponse)
async def upload_audio(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    display_name: Optional[str] = Form(None),
    language: Optional[str] = Form(None),
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    # Check if user has credits (skip for admin users with unlimited credits)
    if not current_user.is_admin and current_user.credits <= 0:
        raise HTTPException(
            status_code=402, 
            detail="Insufficient credits. Please contact administrator to add more credits."
        )
    
    # Validate file
    validate_file(file.filename)
    
    # Check file size
    if file.size > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large")
    
    # Generate unique filename
    file_id = str(uuid.uuid4())
    ext = Path(file.filename).suffix.lower()
    audio_filename = f"{file_id}{ext}"
    audio_path = os.path.join(settings.UPLOAD_DIR, "audio", audio_filename)
    
    # Save uploaded file
    async with aiofiles.open(audio_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    # Create conversion record
    conversion = models.Conversion(
        user_id=current_user.id,
        original_filename=file.filename,
        display_name=display_name or file.filename,
        audio_path=audio_path,
        status="pending",
        language=language,
        model_used="nova-3"  # Always use nova-3
    )
    db.add(conversion)
    db.commit()
    db.refresh(conversion)
    
    # Start background processing
    output_base = os.path.join(settings.UPLOAD_DIR, "docs", file_id)
    background_tasks.add_task(
        process_conversion,
        conversion.id,
        audio_path,
        output_base,
        conversion.display_name,
        language,
        current_user.id,
        db
    )
    
    return schemas.ConversionResponse(
        id=conversion.id,
        display_name=conversion.display_name,
        original_filename=conversion.original_filename,
        status=conversion.status,
        duration=conversion.duration,
        model_used=conversion.model_used,
        language=conversion.language,
        error_message=conversion.error_message,
        created_at=conversion.created_at,
        updated_at=conversion.updated_at,
        has_docx=bool(conversion.docx_path),
        has_pdf=bool(conversion.pdf_path),
        has_txt=bool(conversion.txt_path)
    )

@router.get("/", response_model=schemas.ConversionListResponse)
async def list_conversions(
    skip: int = 0,
    limit: int = 100,
    search_user: Optional[str] = None,  # Search by username for admins
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    # Base query with join to get user info
    query = db.query(models.Conversion).join(models.User, models.Conversion.user_id == models.User.id)
    
    # Admins see all conversions (with optional user search), regular users see only their own
    if current_user.is_admin:
        if search_user:
            # Search by username or email
            query = query.filter(
                (models.User.username.ilike(f"%{search_user}%")) | 
                (models.User.email.ilike(f"%{search_user}%"))
            )
    else:
        query = query.filter(models.Conversion.user_id == current_user.id)
    
    total = query.count()
    conversions = query.order_by(models.Conversion.created_at.desc()).offset(skip).limit(limit).all()
    
    conversion_responses = []
    for conv in conversions:
        response_data = {
            "id": conv.id,
            "display_name": conv.display_name,
            "original_filename": conv.original_filename,
            "status": conv.status,
            "duration": conv.duration,
            "model_used": conv.model_used,
            "language": conv.language,
            "error_message": conv.error_message,
            "created_at": conv.created_at,
            "updated_at": conv.updated_at,
            "has_docx": bool(conv.docx_path and os.path.exists(conv.docx_path)),
            "has_pdf": bool(conv.pdf_path and os.path.exists(conv.pdf_path)),
            "has_txt": bool(conv.txt_path and os.path.exists(conv.txt_path))
        }
        
        # Include user info for admins
        if current_user.is_admin and conv.user:
            response_data["user"] = schemas.UserInfo(
                id=conv.user.id,
                username=conv.user.username,
                email=conv.user.email,
                credits=conv.user.credits
            )
        
        conversion_responses.append(schemas.ConversionResponse(**response_data))
    
    return schemas.ConversionListResponse(conversions=conversion_responses, total=total)

@router.get("/{conversion_id}", response_model=schemas.ConversionResponse)
async def get_conversion(
    conversion_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    conversion = db.query(models.Conversion).filter(
        models.Conversion.id == conversion_id
    ).first()
    
    if not conversion:
        raise HTTPException(status_code=404, detail="Conversion not found")
    
    # Check access rights: user must be the owner or an admin
    if conversion.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return schemas.ConversionResponse(
        id=conversion.id,
        display_name=conversion.display_name,
        original_filename=conversion.original_filename,
        status=conversion.status,
        duration=conversion.duration,
        model_used=conversion.model_used,
        language=conversion.language,
        error_message=conversion.error_message,
        created_at=conversion.created_at,
        updated_at=conversion.updated_at,
        has_docx=bool(conversion.docx_path and os.path.exists(conversion.docx_path)),
        has_pdf=bool(conversion.pdf_path and os.path.exists(conversion.pdf_path)),
        has_txt=bool(conversion.txt_path and os.path.exists(conversion.txt_path))
    )

@router.patch("/{conversion_id}", response_model=schemas.ConversionResponse)
async def update_conversion(
    conversion_id: int,
    update: schemas.ConversionUpdate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    conversion = db.query(models.Conversion).filter(
        models.Conversion.id == conversion_id
    ).first()
    
    if not conversion:
        raise HTTPException(status_code=404, detail="Conversion not found")
    
    # Check access rights: user must be the owner or an admin
    if conversion.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Access denied")
    
    conversion.display_name = update.display_name
    db.commit()
    db.refresh(conversion)
    
    return schemas.ConversionResponse(
        id=conversion.id,
        display_name=conversion.display_name,
        original_filename=conversion.original_filename,
        status=conversion.status,
        duration=conversion.duration,
        model_used=conversion.model_used,
        language=conversion.language,
        error_message=conversion.error_message,
        created_at=conversion.created_at,
        updated_at=conversion.updated_at,
        has_docx=bool(conversion.docx_path and os.path.exists(conversion.docx_path)),
        has_pdf=bool(conversion.pdf_path and os.path.exists(conversion.pdf_path)),
        has_txt=bool(conversion.txt_path and os.path.exists(conversion.txt_path))
    )

@router.delete("/{conversion_id}")
async def delete_conversion(
    conversion_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    conversion = db.query(models.Conversion).filter(
        models.Conversion.id == conversion_id
    ).first()
    
    if not conversion:
        raise HTTPException(status_code=404, detail="Conversion not found")
    
    # Check access rights: user must be the owner or an admin
    if conversion.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Delete files
    for path_attr in ['audio_path', 'json_path', 'txt_path', 'docx_path', 'pdf_path']:
        path = getattr(conversion, path_attr)
        if path and os.path.exists(path):
            try:
                os.remove(path)
            except Exception:
                pass
    
    db.delete(conversion)
    db.commit()
    
    return {"detail": "Conversion deleted successfully"}

@router.get("/{conversion_id}/download/{file_type}")
async def download_file(
    conversion_id: int,
    file_type: str,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if file_type not in ["docx", "pdf", "txt"]:
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    # First try to find the conversion
    conversion = db.query(models.Conversion).filter(
        models.Conversion.id == conversion_id
    ).first()
    
    if not conversion:
        raise HTTPException(status_code=404, detail="Conversion not found")
    
    # Check access rights: user must be the owner or an admin
    if conversion.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=403, 
            detail="Access denied. You can only download your own files."
        )
    
    file_path = None
    media_type = None
    filename = None
    
    if file_type == "docx":
        file_path = conversion.docx_path
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        filename = f"{conversion.display_name}.docx"
    elif file_type == "pdf":
        file_path = conversion.pdf_path
        media_type = "application/pdf"
        filename = f"{conversion.display_name}.pdf"
    elif file_type == "txt":
        file_path = conversion.txt_path
        media_type = "text/plain"
        filename = f"{conversion.display_name}.txt"
    
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"{file_type.upper()} file not found")
    
    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=filename
    )