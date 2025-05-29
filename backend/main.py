from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os
import uuid
import validators
import bleach
import yt_dlp
import cv2
import assemblyai as aai
import openai
from typing import Optional, List
import asyncio
import subprocess
import json
from slugify import slugify

# Initialize FastAPI app
app = FastAPI(title="Pjesëza API", description="AI-Powered Video Editing Platform")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security configurations
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "pjeseza-super-secret-key-2025"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Database configuration
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "pjeseza_db")

# AI API configurations (Free tiers)
# Set these in environment or use free tiers
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
ASSEMBLYAI_API_KEY = os.getenv("ASSEMBLYAI_API_KEY", "")

if ASSEMBLYAI_API_KEY:
    aai.settings.api_key = ASSEMBLYAI_API_KEY

if OPENAI_API_KEY:
    openai.api_key = OPENAI_API_KEY

# MongoDB client
mongo_client = None
db = None

@app.on_event("startup")
async def startup_db_client():
    global mongo_client, db
    mongo_client = AsyncIOMotorClient(MONGO_URL)
    db = mongo_client[DB_NAME]
    
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("username", unique=True)
    
    # Create default admin user
    admin_exists = await db.users.find_one({"role": "admin"})
    if not admin_exists:
        admin_user = {
            "_id": str(uuid.uuid4()),
            "username": "admin",
            "email": "admin@pjeseza.com",
            "password": pwd_context.hash("admin123"),
            "role": "admin",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "language_preference": "en"
        }
        await db.users.insert_one(admin_user)

@app.on_event("shutdown")
async def shutdown_db_client():
    if mongo_client:
        mongo_client.close()

# Pydantic models
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    language_preference: str = "en"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class VideoClipRequest(BaseModel):
    youtube_url: str
    start_time: Optional[float] = 0
    end_time: Optional[float] = None
    clip_name: Optional[str] = None

class User(BaseModel):
    id: str
    username: str
    email: str
    role: str
    is_active: bool
    created_at: datetime
    language_preference: str

# Utility functions
def sanitize_input(text: str) -> str:
    """Sanitize user input to prevent XSS attacks"""
    return bleach.clean(text, tags=[], attributes={}, strip=True)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"_id": user_id})
    if user is None:
        raise credentials_exception
    
    return user

async def get_current_active_user(current_user: dict = Depends(get_current_user)):
    if not current_user["is_active"]:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

async def get_admin_user(current_user: dict = Depends(get_current_active_user)):
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

# YouTube video processing functions
def get_video_info(url: str) -> dict:
    """Get video information from YouTube URL"""
    try:
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            return {
                "title": info.get("title", ""),
                "duration": info.get("duration", 0),
                "thumbnail": info.get("thumbnail", ""),
                "description": info.get("description", "")[:500],  # Limit description
                "view_count": info.get("view_count", 0),
                "uploader": info.get("uploader", "")
            }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error extracting video info: {str(e)}")

def download_video_segment(url: str, start_time: float = 0, end_time: Optional[float] = None) -> str:
    """Download a segment of YouTube video"""
    try:
        output_path = f"/tmp/clip_{uuid.uuid4().hex[:8]}.mp4"
        
        ydl_opts = {
            'format': 'best[height<=720]',  # Limit quality for free processing
            'outtmpl': output_path,
            'quiet': True,
        }
        
        # Add time range if specified
        if start_time > 0 or end_time:
            if end_time:
                duration = end_time - start_time
                cmd = f'ffmpeg -ss {start_time} -i "$(yt-dlp -g {url})" -t {duration} -c copy {output_path}'
            else:
                cmd = f'ffmpeg -ss {start_time} -i "$(yt-dlp -g {url})" -c copy {output_path}'
            
            subprocess.run(cmd, shell=True, check=True)
        else:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])
        
        return output_path
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error downloading video: {str(e)}")

# API Routes

@app.get("/")
async def root():
    return {"message": "Pjesëza API - AI-Powered Video Editing Platform"}

@app.post("/api/auth/register", response_model=Token)
async def register(user: UserCreate):
    # Sanitize inputs
    username = sanitize_input(user.username)
    email = user.email.lower()
    
    # Validate input
    if len(username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
    if len(user.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    # Check if user already exists
    existing_user = await db.users.find_one({
        "$or": [{"email": email}, {"username": username}]
    })
    if existing_user:
        raise HTTPException(status_code=400, detail="Email or username already registered")
    
    # Create new user
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user.password)
    
    new_user = {
        "_id": user_id,
        "username": username,
        "email": email,
        "password": hashed_password,
        "role": "user",
        "is_active": True,
        "created_at": datetime.utcnow(),
        "language_preference": user.language_preference
    }
    
    await db.users.insert_one(new_user)
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_id}, expires_delta=access_token_expires
    )
    
    user_response = {
        "id": user_id,
        "username": username,
        "email": email,
        "role": "user",
        "language_preference": user.language_preference
    }
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response
    }

@app.post("/api/auth/login", response_model=Token)
async def login(user_credentials: UserLogin):
    # Find user
    user = await db.users.find_one({"email": user_credentials.email.lower()})
    
    if not user or not verify_password(user_credentials.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user["is_active"]:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["_id"]}, expires_delta=access_token_expires
    )
    
    user_response = {
        "id": user["_id"],
        "username": user["username"],
        "email": user["email"],
        "role": user["role"],
        "language_preference": user["language_preference"]
    }
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response
    }

@app.get("/api/auth/me")
async def get_current_user_info(current_user: dict = Depends(get_current_active_user)):
    return {
        "id": current_user["_id"],
        "username": current_user["username"],
        "email": current_user["email"],
        "role": current_user["role"],
        "language_preference": current_user["language_preference"],
        "created_at": current_user["created_at"]
    }

@app.post("/api/video/info")
async def get_youtube_video_info(
    video_url: dict,
    current_user: dict = Depends(get_current_active_user)
):
    url = video_url.get("url", "")
    
    # Validate YouTube URL
    if not validators.url(url) or "youtube.com" not in url and "youtu.be" not in url:
        raise HTTPException(status_code=400, detail="Invalid YouTube URL")
    
    try:
        video_info = get_video_info(url)
        
        # Store video info in database
        video_record = {
            "_id": str(uuid.uuid4()),
            "user_id": current_user["_id"],
            "youtube_url": url,
            "video_info": video_info,
            "created_at": datetime.utcnow()
        }
        
        await db.videos.insert_one(video_record)
        
        return {
            "success": True,
            "video_info": video_info,
            "video_id": video_record["_id"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/video/clip")
async def create_video_clip(
    clip_request: VideoClipRequest,
    current_user: dict = Depends(get_current_active_user)
):
    # Validate YouTube URL
    if not validators.url(clip_request.youtube_url):
        raise HTTPException(status_code=400, detail="Invalid YouTube URL")
    
    try:
        # Get video info first
        video_info = get_video_info(clip_request.youtube_url)
        
        # Validate time parameters
        if clip_request.start_time < 0:
            raise HTTPException(status_code=400, detail="Start time cannot be negative")
        
        if clip_request.end_time and clip_request.end_time <= clip_request.start_time:
            raise HTTPException(status_code=400, detail="End time must be greater than start time")
        
        if clip_request.end_time and clip_request.end_time > video_info["duration"]:
            raise HTTPException(status_code=400, detail="End time exceeds video duration")
        
        # Create clip record in database
        clip_id = str(uuid.uuid4())
        clip_name = sanitize_input(clip_request.clip_name) if clip_request.clip_name else f"Clip {clip_id[:8]}"
        
        clip_record = {
            "_id": clip_id,
            "user_id": current_user["_id"],
            "youtube_url": clip_request.youtube_url,
            "clip_name": clip_name,
            "start_time": clip_request.start_time,
            "end_time": clip_request.end_time,
            "video_info": video_info,
            "status": "processing",
            "created_at": datetime.utcnow()
        }
        
        await db.clips.insert_one(clip_record)
        
        # For demo purposes, we'll simulate processing
        # In production, this would be handled by a background task
        clip_record["status"] = "completed"
        clip_record["download_url"] = f"/api/video/download/{clip_id}"
        
        await db.clips.update_one(
            {"_id": clip_id},
            {"$set": {"status": "completed", "download_url": clip_record["download_url"]}}
        )
        
        return {
            "success": True,
            "clip_id": clip_id,
            "message": "Clip created successfully",
            "clip": {
                "id": clip_id,
                "name": clip_name,
                "start_time": clip_request.start_time,
                "end_time": clip_request.end_time,
                "status": "completed",
                "download_url": clip_record["download_url"]
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/video/clips")
async def get_user_clips(current_user: dict = Depends(get_current_active_user)):
    clips = await db.clips.find({"user_id": current_user["_id"]}).sort("created_at", -1).to_list(100)
    
    clips_response = []
    for clip in clips:
        clips_response.append({
            "id": clip["_id"],
            "name": clip["clip_name"],
            "youtube_url": clip["youtube_url"],
            "start_time": clip["start_time"],
            "end_time": clip["end_time"],
            "status": clip["status"],
            "created_at": clip["created_at"],
            "video_info": clip["video_info"]
        })
    
    return {"clips": clips_response}

# Admin routes
@app.get("/api/admin/users")
async def get_all_users(admin_user: dict = Depends(get_admin_user)):
    users = await db.users.find({}, {"password": 0}).sort("created_at", -1).to_list(1000)
    return {"users": users}

@app.get("/api/admin/stats")
async def get_admin_stats(admin_user: dict = Depends(get_admin_user)):
    total_users = await db.users.count_documents({})
    total_clips = await db.clips.count_documents({})
    total_videos = await db.videos.count_documents({})
    
    return {
        "total_users": total_users,
        "total_clips": total_clips,
        "total_videos": total_videos,
        "active_users": await db.users.count_documents({"is_active": True})
    }

# AI Features (Mock implementations using free tiers)
@app.post("/api/ai/auto-caption")
async def auto_caption_video(
    video_data: dict,
    current_user: dict = Depends(get_current_active_user)
):
    # Mock implementation - in production this would use AssemblyAI
    return {
        "success": True,
        "captions": [
            {"start": 0, "end": 3, "text": "Welcome to this amazing video"},
            {"start": 3, "end": 6, "text": "Let me show you something incredible"},
            {"start": 6, "end": 10, "text": "This is auto-generated content"}
        ],
        "languages_available": ["en", "sq", "es", "fr", "de", "it"]
    }

@app.post("/api/ai/generate-script")
async def generate_video_script(
    prompt_data: dict,
    current_user: dict = Depends(get_current_active_user)
):
    # Mock implementation - in production this would use OpenAI
    topic = sanitize_input(prompt_data.get("topic", ""))
    language = prompt_data.get("language", "en")
    
    scripts = {
        "en": f"Here's an engaging script about {topic}: Start with a hook, provide valuable content, and end with a strong call to action.",
        "sq": f"Këtu është një skript tërheqës për {topic}: Filloni me një hok, ofroni përmbajtje të vlefshme dhe përfundoni me një thirrje të fortë për veprim."
    }
    
    return {
        "success": True,
        "script": scripts.get(language, scripts["en"]),
        "word_count": len(scripts.get(language, scripts["en"]).split()),
        "estimated_duration": "30-60 seconds"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
