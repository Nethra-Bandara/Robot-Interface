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
    allow_origins=["https://your-vercel-app.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directories
UPLOADS_DIR = "uploads"
KNOWLEDGE_DIR = "knowledge"
os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(KNOWLEDGE_DIR, exist_ok=True)

# Helper function for RAG (Simple version: reads all files in knowledge dir)
def get_knowledge_context():
    context = ""
    try:
        if os.path.exists(KNOWLEDGE_DIR):
            for filename in os.listdir(KNOWLEDGE_DIR):
                if filename.endswith(".md") or filename.endswith(".txt"):
                    with open(os.path.join(KNOWLEDGE_DIR, filename), "r", encoding="utf-8") as f:
                        context += f"\n--- {filename} ---\n"
                        context += f.read() + "\n"
    except Exception as e:
        print(f"Error reading knowledge base: {e}")
    return context

# Mount static files
app.mount("/static/uploads", StaticFiles(directory=UPLOADS_DIR), name="static_uploads")

# Gemini Setup
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("VITE_GEMINI_API_KEY")
if GEMINI_API_KEY:
    GEMINI_API_KEY = GEMINI_API_KEY.replace("GEMINI_API_KEY=", "").strip() 
SYSTEM_INSTRUCTION = (
    "You are the AI assistant for a Robot Interface. "
    "Your goal is to provide concise, accurate, and necessary information only. "
    "Use the provided knowledge base context to answer questions about the robot and identify species. "
    "If an image is provided, analyze it carefully. "
    "If the species information is in the knowledge base, use that as the primary source. "
    "Otherwise, use your general knowledge but mention if the data is from your general training rather than the local knowledge base."
)

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY, transport="rest")
else:
    print("WARNING: GEMINI_API_KEY not found.")

class ChatRequest(BaseModel):
    message: str
    image_url: str = None

@app.get("/")
def read_root():
    return {"message": "Robot Interface Backend Online"}

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    if not GEMINI_API_KEY or GEMINI_API_KEY == "YOUR_API_KEY_HERE":
        return {
            "response": "⚠️ **System Alert**: Backend is connected, but `GEMINI_API_KEY` is missing. Please configure it."
        }
    
    try:
        # Retrieve context from knowledge base
        context = get_knowledge_context()
        
        # Initialize model with system instruction
        model = genai.GenerativeModel(
            model_name='gemini-3-flash-preview',
            system_instruction=SYSTEM_INSTRUCTION
        )
        
        # Combine context and user message
        full_prompt = f"Knowledge Base Context:\n{context}\n\nUser Question: {request.message}"
        
        parts = [full_prompt]
        
        if request.image_url:
            # The image_url is usually relative like /static/uploads/filename.png
            filename = request.image_url.split("/")[-1]
            file_path = os.path.join(UPLOADS_DIR, filename)
            
            if os.path.exists(file_path):
                import base64
                with open(file_path, "rb") as f:
                    img_data = base64.b64encode(f.read()).decode("utf-8")
                
                parts.append({
                    "mime_type": "image/jpeg",
                    "data": img_data
                })
            else:
                print(f"Warning: Image file not found at {file_path}")
        
        response = model.generate_content(parts, request_options={"timeout": 15})
        return {"response": response.text}
    except Exception as e:
        print(f"Gemini Error: {e}")
        return {"response": f"❌ **API Error**: {str(e)}"}

@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    try:
        file_location = f"{UPLOADS_DIR}/{file.filename}"
        with open(file_location, "wb+") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Return the URL to access this image
        # Return relative path so frontend can construct full URL with correct host
        img_url = f"/static/uploads/{file.filename}"
        
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
                    "url": f"/static/uploads/{entry}",
                    "timestamp": stats.st_mtime
                })
        
        # Sort by timestamp desc
        files.sort(key=lambda x: x["timestamp"], reverse=True)
        return files
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

@app.delete("/screenshots")
def delete_all_screenshots():
    try:
        if not os.path.exists(UPLOADS_DIR):
            return {"message": "Uploads directory does not exist, nothing to delete"}
            
        entries = os.listdir(UPLOADS_DIR)
        deleted_count = 0
        errors = []
        
        for entry in entries:
            file_path = os.path.join(UPLOADS_DIR, entry)
            if os.path.isfile(file_path):
                try:
                    os.remove(file_path)
                    deleted_count += 1
                except Exception as e:
                    print(f"Error removing {entry}: {e}")
                    errors.append(f"{entry}: {e}")
        
        return {
            "message": f"Deleted {deleted_count} files", 
            "errors": errors if errors else None
        }
    except Exception as e:
        print(f"Global deletion error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/screenshots/{filename}")
def delete_screenshot(filename: str):
    file_path = os.path.join(UPLOADS_DIR, filename)
    if os.path.exists(file_path):
        os.remove(file_path)
        return {"message": "Deleted"}
    else:
        raise HTTPException(status_code=404, detail="File not found")

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000)
