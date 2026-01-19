from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import shutil
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev only. In prod, specify the frontend URL.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directories
UPLOADS_DIR = "uploads"
os.makedirs(UPLOADS_DIR, exist_ok=True)

# Mount static files
app.mount("/updates", StaticFiles(directory=UPLOADS_DIR), name="uploads") 
# Note: mounted at /updates to avoid conflict with /uploads endpoint, or just convenience.
# Actually let's mount at /static/uploads to be clear.
app.mount("/static/uploads", StaticFiles(directory=UPLOADS_DIR), name="static_uploads")

# Gemini Setup
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("VITE_GEMINI_API_KEY") # Try both
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("WARNING: GEMINI_API_KEY not found.")

class ChatRequest(BaseModel):
    message: str

@app.get("/")
def read_root():
    return {"message": "Robot Interface Backend Online"}

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")
    
    try:
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(request.message)
        return {"response": response.text}
    except Exception as e:
        print(f"Gemini Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    try:
        file_location = f"{UPLOADS_DIR}/{file.filename}"
        with open(file_location, "wb+") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Return the URL to access this image
        # Assuming backend runs on localhost:8000
        # In a real app, generate a full URL or relative path
        img_url = f"http://localhost:8000/static/uploads/{file.filename}"
        
        return {"url": img_url, "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not upload file: {e}")

@app.get("/screenshots")
def get_screenshots():
    files = []
    # List files in uploads dir, sorted by creation time (newest first)
    try:
        entries = os.listdir(UPLOADS_DIR)
        for entry in entries:
            full_path = os.path.join(UPLOADS_DIR, entry)
            if os.path.isfile(full_path):
                stats = os.stat(full_path)
                files.append({
                    "filename": entry,
                    "url": f"http://localhost:8000/static/uploads/{entry}",
                    "timestamp": stats.st_mtime
                })
        
        # Sort by timestamp desc
        files.sort(key=lambda x: x["timestamp"], reverse=True)
        return files
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

@app.delete("/screenshots/{filename}")
def delete_screenshot(filename: str):
    file_path = os.path.join(UPLOADS_DIR, filename)
    if os.path.exists(file_path):
        os.remove(file_path)
        return {"message": "Deleted"}
    else:
        raise HTTPException(status_code=404, detail="File not found")
