# backend/main.py
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import shutil
import google.generativeai as genai
from dotenv import load_dotenv
from typing import Optional

# Load environment variables from .env (for local dev)
load_dotenv()


app = FastAPI()

# Configure CORS (add your frontend origins here)
FRONTEND_ORIGINS = [
    "http://localhost:5173",
    "https://robot-interface-rho.vercel.app",
    
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directories
UPLOADS_DIR = "uploads"
KNOWLEDGE_DIR = "knowledge"
os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(KNOWLEDGE_DIR, exist_ok=True)

def get_knowledge_context():
    """Simple RAG helper: read .md and .txt files from knowledge dir."""
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

# Serve uploaded files
app.mount("/static/uploads", StaticFiles(directory=UPLOADS_DIR), name="static_uploads")

# Gemini / Google Gen AI setup
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("VITE_GEMINI_API_KEY")
if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY, transport="rest")
    except Exception as e:
        print(f"Error configuring genai: {e}")
else:
    print("WARNING: GEMINI_API_KEY not found. Chat endpoints will return a helpful message.")

SYSTEM_INSTRUCTION = (
    "You are the AI assistant for a Robot Interface. "
    "Your goal is to provide concise, accurate, and necessary information only. "
    "Use the provided knowledge base context to answer questions about the robot and identify species. "
    "If an image is provided, analyze it carefully. "
    "If the species information is in the knowledge base, use that as the primary source. "
    "Otherwise, use your general knowledge but mention if the data is from your general training rather than the local knowledge base."
)

class ChatRequest(BaseModel):
    message: str
    image_url: Optional[str] = None

@app.get("/")
def read_root():
    return {"message": "Robot Interface Backend Online"}

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    if not GEMINI_API_KEY or GEMINI_API_KEY == "YOUR_API_KEY_HERE":
        return {"response": "⚠️ System Alert: Backend is connected, but GEMINI_API_KEY is missing. Please configure it."}

    try:
        context = get_knowledge_context()

        # Initialize model wrapper
        model = genai.GenerativeModel(
            model_name="gemini-3-flash-preview",
            system_instruction=SYSTEM_INSTRUCTION
        )

        full_prompt = f"Knowledge Base Context:\n{context}\n\nUser Question: {request.message}"
        parts = [full_prompt]

        if request.image_url:
            filename = request.image_url.split("/")[-1]
            file_path = os.path.join(UPLOADS_DIR, filename)
            if os.path.exists(file_path):
                import base64
                with open(file_path, "rb") as f:
                    img_data = base64.b64encode(f.read()).decode("utf-8")
                parts.append({"mime_type": "image/jpeg", "data": img_data})
            else:
                print(f"Warning: Image file not found at {file_path}")

        response = model.generate_content(parts, request_options={"timeout": 15})

        # Robust extraction of text from the response
        text_out = None
        if hasattr(response, "text") and response.text:
            text_out = response.text
        elif getattr(response, "parts", None):
            text_parts = []
            for p in response.parts:
                if getattr(p, "text", None):
                    text_parts.append(p.text)
            text_out = "\n".join(text_parts)
        else:
            text_out = str(response)

        return {"response": text_out}

    except Exception as e:
        print(f"Gemini Error: {e}")
        return {"response": f"❌ API Error: {str(e)}"}

@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    try:
        file_location = f"{UPLOADS_DIR}/{file.filename}"
        with open(file_location, "wb+") as buffer:
            shutil.copyfileobj(file.file, buffer)
        img_url = f"/static/uploads/{file.filename}"
        return {"url": img_url, "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not upload file: {e}")

@app.get("/screenshots")
def get_screenshots():
    files = []
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
                    errors.append(f"{entry}: {e}")
        return {"message": f"Deleted {deleted_count} files", "errors": errors if errors else None}
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

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=int(os.getenv("PORT", 8000)))
