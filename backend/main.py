# backend/main.py
from fastapi import FastAPI, UploadFile, File, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import shutil
import google.generativeai as genai
from dotenv import load_dotenv
from typing import Optional, List
import sqlite3
import json
import threading
import paho.mqtt.client as mqtt
import asyncio


# Load environment variables from .env (for local dev)
load_dotenv()

app = FastAPI()

# ─── WebRTC Signaling ────────────────────────────────────────────────────────

class SignalingManager:
    def __init__(self):
        self.broadcaster: WebSocket | None = None
        self.viewers: list[WebSocket] = []

    async def connect_broadcaster(self, ws: WebSocket):
        await ws.accept()
        self.broadcaster = ws
        print("Broadcaster connected")

    async def connect_viewer(self, ws: WebSocket):
        await ws.accept()
        self.viewers.append(ws)
        print(f"Viewer connected. Total viewers: {len(self.viewers)}")

    def disconnect_broadcaster(self):
        self.broadcaster = None
        print("Broadcaster disconnected")

    def disconnect_viewer(self, ws: WebSocket):
        if ws in self.viewers:
            self.viewers.remove(ws)
        print(f"Viewer disconnected. Total viewers: {len(self.viewers)}")

    async def send_to_broadcaster(self, message: dict):
        if self.broadcaster:
            await self.broadcaster.send_json(message)

    async def send_to_viewer(self, ws: WebSocket, message: dict):
        await ws.send_json(message)

    async def broadcast_to_viewers(self, message: dict):
        for viewer in self.viewers:
            try:
                await viewer.send_json(message)
            except Exception:
                pass

signaling = SignalingManager()


@app.websocket("/ws/broadcaster")
async def broadcaster_ws(websocket: WebSocket):
    await signaling.connect_broadcaster(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type == "offer":
                # Broadcaster sends offer → forward to all viewers
                await signaling.broadcast_to_viewers(data)

            elif msg_type == "ice-broadcaster":
                # Broadcaster's ICE candidates → forward to all viewers
                await signaling.broadcast_to_viewers({
                    "type": "ice-broadcaster",
                    "candidate": data.get("candidate")
                })

    except WebSocketDisconnect:
        signaling.disconnect_broadcaster()


@app.websocket("/ws/viewer")
async def viewer_ws(websocket: WebSocket):
    await signaling.connect_viewer(websocket)
    try:
        # If broadcaster is already live, ask it to re-offer to this new viewer
        if signaling.broadcaster:
            await signaling.send_to_broadcaster({"type": "new-viewer"})

        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type == "answer":
                # Viewer's answer → forward to broadcaster
                await signaling.send_to_broadcaster({
                    "type": "answer",
                    "answer": data.get("answer"),
                    "viewerId": id(websocket)
                })

            elif msg_type == "ice-viewer":
                # Viewer's ICE candidates → forward to broadcaster
                await signaling.send_to_broadcaster({
                    "type": "ice-viewer",
                    "candidate": data.get("candidate"),
                    "viewerId": id(websocket)
                })

    except WebSocketDisconnect:
        signaling.disconnect_viewer(websocket)



# Configure CORS (add your frontend origins here)
FRONTEND_ORIGINS = [
    "http://localhost:5173",
    "https://robot-interface-rho.vercel.app",    
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://robot-interface-rho.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directories
UPLOADS_DIR = "uploads"
KNOWLEDGE_DIR = "knowledge"
os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(KNOWLEDGE_DIR, exist_ok=True)

# Database Setup
DB_FILE = "data.db"
def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # Automatic migration: drop old table if it has the "status" column
    try:
        cursor.execute("SELECT status FROM telemetry_history LIMIT 1")
        print("Migrating schema: dropping old telemetry_history table...")
        cursor.execute("DROP TABLE telemetry_history")
    except sqlite3.OperationalError:
        pass

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS telemetry_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            battery REAL,
            temperature REAL,
            humidity REAL,
            signal REAL,
            pressure REAL,
            gps_lat REAL, gps_lon REAL,
            roll REAL,
            pitch REAL,
            yaw REAL
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# Background MQTT Subscriber
MQTT_BROKER = "002277b56cde45b29a96d3dd3ef81785.s1.eu.hivemq.cloud"
MQTT_PORT = 8883
MQTT_USER = "robot_interface"
MQTT_PASS = "Pwd12345"
MQTT_TOPIC = "robot/telemetry"
MQTT_TOPIC_COMMAND = "robot/commands"

client = None

def on_mqtt_connect(client, userdata, flags, reason_code, properties):
    if reason_code == 0:
        print("Backend connected to MQTT Broker!")
        client.subscribe(MQTT_TOPIC)
    else:
        print(f"Backend MQTT connection failed with code: {reason_code}")

def on_mqtt_message(client, userdata, message):
    try:
        payload = json.loads(message.payload.decode("utf-8"))
        battery = payload.get("battery", None)
        temperature = payload.get("temp", None)  # RPi script currently sends 'temp'
        if temperature is None:
            temperature = payload.get("temperature", None)
        humidity = payload.get("humidity", None)
        speed = payload.get("speed", None)
        signal = payload.get("signal", None)
        pressure = payload.get("pressure", None)
        
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        # Insert the new record
        cursor.execute('''
            INSERT INTO telemetry_history (battery, temperature, humidity, speed, signal, pressure)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (battery, temperature, humidity, speed, signal, pressure))
        
        # Delete any records older than 7 days
        cursor.execute('''
            DELETE FROM telemetry_history 
            WHERE timestamp <= datetime('now', '-7 days')
        ''')
        
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error processing MQTT message: {e}")

def start_mqtt_listener():
    global client
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.username_pw_set(MQTT_USER, MQTT_PASS)
    client.tls_set()
    client.on_connect = on_mqtt_connect
    client.on_message = on_mqtt_message
    
    try:
        client.connect(MQTT_BROKER, MQTT_PORT)
        client.loop_forever()
    except Exception as e:
        print(f"Failed to start MQTT listener: {e}")

# Run MQTT in a background thread
mqtt_thread = threading.Thread(target=start_mqtt_listener, daemon=True)
mqtt_thread.start()

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

@app.post("/command")
async def send_command(command: dict):
    if client is None:
        raise HTTPException(status_code=500, detail="MQTT Client not initialized")
    payload = json.dumps(command)
    client.publish(MQTT_TOPIC_COMMAND, payload)
    return {"status": "sent", "command": command}

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

@app.get("/telemetry/history")
def get_telemetry_history(limit: int = 100):
    try:
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM telemetry_history 
            ORDER BY timestamp DESC 
            LIMIT ?
        ''', (limit,))
        rows = cursor.fetchall()
        conn.close()
        
        history = []
        for row in rows:
            history.append(dict(row))
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == '__main__':
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

