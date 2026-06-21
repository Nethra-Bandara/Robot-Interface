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

load_dotenv()

app = FastAPI()

# ─── WebRTC Signaling ────────────────────────────────────────────────────────

class SignalingManager:
    def __init__(self):
        self.broadcaster: WebSocket | None = None
        self.viewers: dict[int, WebSocket] = {}  # viewerId → WebSocket

    async def connect_broadcaster(self, ws: WebSocket):
        await ws.accept()
        self.broadcaster = ws
        print("Broadcaster connected")

    async def connect_viewer(self, ws: WebSocket):
        await ws.accept()
        self.viewers[id(ws)] = ws
        print(f"Viewer {id(ws)} connected. Total viewers: {len(self.viewers)}")

    def disconnect_broadcaster(self):
        self.broadcaster = None
        print("Broadcaster disconnected")

    def disconnect_viewer(self, ws: WebSocket):
        self.viewers.pop(id(ws), None)
        print(f"Viewer {id(ws)} disconnected. Total viewers: {len(self.viewers)}")

    async def send_to_broadcaster(self, message: dict):
        if self.broadcaster:
            try:
                await self.broadcaster.send_json(message)
            except Exception:
                self.broadcaster = None

    async def send_to_viewer(self, viewer_id: int, message: dict):
        ws = self.viewers.get(viewer_id)
        if ws:
            try:
                await ws.send_json(message)
            except Exception:
                self.viewers.pop(viewer_id, None)

    async def broadcast_to_viewers(self, message: dict):
        dead = []
        for vid, ws in self.viewers.items():
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(vid)
        for vid in dead:
            self.viewers.pop(vid, None)


signaling = SignalingManager()


@app.websocket("/ws/broadcaster")
async def broadcaster_ws(websocket: WebSocket):
    await signaling.connect_broadcaster(websocket)

    async def ping():
        while True:
            await asyncio.sleep(20)
            try:
                await websocket.send_json({"type": "ping"})
            except Exception:
                break

    ping_task = asyncio.create_task(ping())
    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")
            if msg_type == "ping":
                continue

            elif msg_type == "offer":
                # Forward offer to specific viewer
                viewer_id = data.get("viewerId")
                if viewer_id:
                    await signaling.send_to_viewer(viewer_id, {
                        "type": "offer",
                        "offer": data.get("offer")
                    })

            elif msg_type == "ice-broadcaster":
                # Forward ICE to specific viewer
                viewer_id = data.get("viewerId")
                if viewer_id:
                    await signaling.send_to_viewer(viewer_id, {
                        "type": "ice-broadcaster",
                        "candidate": data.get("candidate")
                    })

    except WebSocketDisconnect:
        signaling.disconnect_broadcaster()
    finally:
        ping_task.cancel()


@app.websocket("/ws/viewer")
async def viewer_ws(websocket: WebSocket):
    await signaling.connect_viewer(websocket)
    viewer_id = id(websocket)

    async def ping():
        while True:
            await asyncio.sleep(20)
            try:
                await websocket.send_json({"type": "ping"})
            except Exception:
                break

    ping_task = asyncio.create_task(ping())
    await asyncio.sleep(0.5)

    try:
        # Tell broadcaster about new viewer, passing the viewerId
        if signaling.broadcaster:
            await signaling.send_to_broadcaster({
                "type": "new-viewer",
                "viewerId": viewer_id
            })

        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")
            if msg_type == "ping":
                continue

            elif msg_type == "answer":
                await signaling.send_to_broadcaster({
                    "type": "answer",
                    "answer": data.get("answer"),
                    "viewerId": viewer_id
                })

            elif msg_type == "ice-viewer":
                await signaling.send_to_broadcaster({
                    "type": "ice-viewer",
                    "candidate": data.get("candidate"),
                    "viewerId": viewer_id
                })

    except WebSocketDisconnect:
        signaling.disconnect_viewer(websocket)
    finally:
        ping_task.cancel()
# ─── CORS ────────────────────────────────────────────────────────────────────

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

# ─── Directories ─────────────────────────────────────────────────────────────

UPLOADS_DIR = "uploads"
KNOWLEDGE_DIR = "knowledge"
os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(KNOWLEDGE_DIR, exist_ok=True)

# ─── Database ────────────────────────────────────────────────────────────────

DB_FILE = "data.db"

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT status FROM telemetry_history LIMIT 1")
        print("Migrating schema: dropping old telemetry_history table...")
        cursor.execute("DROP TABLE telemetry_history")
    except sqlite3.OperationalError:
        pass

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS telemetry_history (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp   DATETIME DEFAULT CURRENT_TIMESTAMP,
            temperature REAL,
            humidity    REAL,
            pressure    REAL,
            gps_lat     REAL,
            gps_lon     REAL,
            roll        REAL,
            pitch       REAL,
            yaw         REAL
        )
    ''')

    # ── NEW: table to persist the last known mode ──
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS robot_mode (
            id         INTEGER PRIMARY KEY CHECK (id = 1),
            domain     TEXT    NOT NULL DEFAULT 'land',
            mode_num   INTEGER,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    # Seed one row so UPDATE always finds something
    cursor.execute('''
        INSERT OR IGNORE INTO robot_mode (id, domain, mode_num) VALUES (1, 'land', 1)
    ''')

    conn.commit()
    conn.close()

init_db()

# ─── MQTT ────────────────────────────────────────────────────────────────────

MQTT_BROKER        = "002277b56cde45b29a96d3dd3ef81785.s1.eu.hivemq.cloud"
MQTT_PORT          = 8883
MQTT_USER          = "robot_interface"
MQTT_PASS          = "Pwd12345"
MQTT_TOPIC         = "robot/telemetry"
MQTT_TOPIC_COMMAND = "robot/commands"
MQTT_TOPIC_MODE    = "robot/mode"
MQTT_TOPIC_MOVEMENT = "robot/movement"
MQTT_TOPIC_CAMERA   = "robot/camera_control"

client = None


# ── NEW: mode handler (called from on_mqtt_message) ──────────────────────────
def handle_set_mode(domain: str, mode_num):
    """
    Persist the new mode to DB, then re-publish it on the dedicated
    robot/mode topic so the RPi (and any other subscriber) receives it cleanly.
    """
    # 1. Persist
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE robot_mode
            SET domain = ?, mode_num = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = 1
        ''', (domain, mode_num))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"⚠️  DB error saving mode: {e}")

    # 2. Re-publish on dedicated topic so RPi picks it up
    mode_payload = json.dumps({"domain": domain, "mode": mode_num})
    if client:
        client.publish(MQTT_TOPIC_MODE, mode_payload)
        print(f"📡 Mode published → {MQTT_TOPIC_MODE}: {mode_payload}")
    else:
        print("⚠️  MQTT client not ready; mode not re-published")


def on_mqtt_connect(client, userdata, flags, reason_code, properties):
    if reason_code == 0:
        print("Backend connected to MQTT Broker!")
        client.subscribe(MQTT_TOPIC)
        client.subscribe(MQTT_TOPIC_COMMAND)
        client.subscribe(MQTT_TOPIC_MOVEMENT)
        client.subscribe(MQTT_TOPIC_CAMERA)
        print(f"Subscribed to: {MQTT_TOPIC}, {MQTT_TOPIC_COMMAND}, {MQTT_TOPIC_MOVEMENT}, {MQTT_TOPIC_CAMERA}")    
    else:
        print(f"Backend MQTT connection failed with code: {reason_code}")


def on_mqtt_message(client, userdata, message):
    try:
        payload = json.loads(message.payload.decode("utf-8"))
        topic   = message.topic

        # ── Commands channel ─────────────────────────────────────────────────
        if topic == MQTT_TOPIC_COMMAND:
            action = payload.get("action")

            if action == "set_mode":
                value    = payload.get("value", {})
                domain   = value.get("domain")    # "land" | "water"
                mode_num = value.get("mode")      # 1 | 2 | 3 | None
                print(f"🎮 set_mode received: domain={domain}, mode={mode_num}")
                handle_set_mode(domain, mode_num)

            else:
                # Unknown command — log it
                print(f"📨 Unknown command received: {payload}")


        # ── Movement channel ────────────────────────────────────────────────
        elif topic == MQTT_TOPIC_MOVEMENT:
            direction = payload.get("direction")
            print(f"🕹️  Movement received: {direction}")
            # No DB persistence needed; RPi subscribes to robot/movement directly.
            # This block exists only for backend-side logging/debugging.

        elif topic == MQTT_TOPIC_CAMERA:
            cam_direction = payload.get("direction")
            print(f"📷 Camera direction received: {cam_direction}")

        # ── Telemetry channel ────────────────────────────────────────────────
        elif topic == MQTT_TOPIC:
            temperature = payload.get("temp") or payload.get("temperature")
            humidity    = payload.get("humidity")
            pressure    = payload.get("pressure")

            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO telemetry_history
                    (temperature, humidity,pressure)
                VALUES (?, ?, ?)
            ''', (temperature, humidity, pressure))
            cursor.execute('''
                DELETE FROM telemetry_history
                WHERE timestamp <= datetime('now', '-7 days')
            ''')
            conn.commit()
            conn.close()

    except json.JSONDecodeError as e:
        print(f"⚠️  Bad JSON on {message.topic}: {e}")
    except Exception as e:
        print(f"⚠️  Error handling message on {message.topic}: {e}")


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

mqtt_thread = threading.Thread(target=start_mqtt_listener, daemon=True)
mqtt_thread.start()

# ─── Knowledge base helper ───────────────────────────────────────────────────

def get_knowledge_context():
    context = ""
    try:
        if os.path.exists(KNOWLEDGE_DIR):
            for filename in os.listdir(KNOWLEDGE_DIR):
                if filename.endswith(".md") or filename.endswith(".txt"):
                    with open(os.path.join(KNOWLEDGE_DIR, filename), "r", encoding="utf-8") as f:
                        context += f"\n--- {filename} ---\n" + f.read() + "\n"
    except Exception as e:
        print(f"Error reading knowledge base: {e}")
    return context

# ─── Static files ────────────────────────────────────────────────────────────

app.mount("/static/uploads", StaticFiles(directory=UPLOADS_DIR), name="static_uploads")

# ─── Gemini setup ────────────────────────────────────────────────────────────

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("VITE_GEMINI_API_KEY")
if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY, transport="rest")
    except Exception as e:
        print(f"Error configuring genai: {e}")
else:
    print("WARNING: GEMINI_API_KEY not found.")

SYSTEM_INSTRUCTION = (
    "You are the AI assistant for the Wildlife Robot Interface. Your role is to help users identify species "
    "and answer questions about wildlife observations. Be conversational, authentic, and friendly. "
    "\n\n"
    "IMPORTANT GUIDELINES:\n"
    "1. **Be Concise**: Keep answers to 2-3 sentences maximum unless more detail is requested.\n"
    "2. **Be Conversational**: Speak naturally, like a knowledgeable friend. Avoid robotic or overly formal language.\n"
    "3. **Prioritize Knowledge Base**: If species info is in the knowledge base, use it first. Otherwise, use your general knowledge.\n"
    "4. **For Species**: Give the common name first, then scientific name if relevant. Mention key distinguishing features.\n"
    "5. **Keep Formatting Simple**: Use minimal markdown. No excessive bold or bullet lists unless absolutely necessary.\n"
    "6. **Be Honest**: If the knowledge base doesn't have info, say so naturally (e.g., 'This isn't in our local database, but...')\n"
)

def format_response(text):
    """
    Clean up response formatting: reduce excessive markdown, make text more readable.
    """
    if not text:
        return text
    # Remove excessive ** (bold) markup - keep only for key terms
    # Replace ** ** with emphasis without markdown
    text = text.replace('**', '')
    # Replace excessive bullet points with simpler format if needed
    lines = text.split('\n')
    cleaned = []
    for line in lines:
        # Remove markdown list bullets, simplify
        line = line.lstrip('* ')
        cleaned.append(line)
    result = '\n'.join(cleaned).strip()
    return result

class ChatRequest(BaseModel):
    message: str
    image_url: Optional[str] = None

# ─── API Routes ──────────────────────────────────────────────────────────────

@app.get("/")
def read_root():
    return {"message": "Robot Interface Backend Online"}


@app.post("/command")
async def send_command(command: dict):
    """
    Generic command endpoint.
    For set_mode actions the backend also persists the mode and
    re-publishes it on robot/mode for the RPi to consume.
    """
    if client is None:
        raise HTTPException(status_code=500, detail="MQTT Client not initialized")

    # Publish raw command to robot/commands (existing behaviour)
    payload = json.dumps(command)
    client.publish(MQTT_TOPIC_COMMAND, payload)

    # If this is a mode command, also handle it server-side immediately
    if command.get("action") == "set_mode":
        value    = command.get("value", {})
        domain   = value.get("domain")
        mode_num = value.get("mode")
        handle_set_mode(domain, mode_num)

    return {"status": "sent", "command": command}


# ── NEW: get the last saved mode ─────────────────────────────────────────────
@app.get("/mode")
def get_current_mode():
    """Returns the last known domain + mode number saved in the DB."""
    try:
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT domain, mode_num, updated_at FROM robot_mode WHERE id = 1")
        row = cursor.fetchone()
        conn.close()
        if row:
            return dict(row)
        return {"domain": "land", "mode_num": 1, "updated_at": None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    if not GEMINI_API_KEY or GEMINI_API_KEY == "YOUR_API_KEY_HERE":
        return {"response": "⚠️ System Alert: Backend is connected, but GEMINI_API_KEY is missing. Please configure it."}

    try:
        context = get_knowledge_context()
        model   = genai.GenerativeModel(
            model_name="gemini-3-flash-preview",
            system_instruction=SYSTEM_INSTRUCTION
        )
        full_prompt = f"Knowledge Base Context:\n{context}\n\nUser Question: {request.message}"
        parts = [full_prompt]

        if request.image_url:
            filename  = request.image_url.split("/")[-1]
            file_path = os.path.join(UPLOADS_DIR, filename)
            if os.path.exists(file_path):
                import base64
                with open(file_path, "rb") as f:
                    img_data = base64.b64encode(f.read()).decode("utf-8")
                parts.append({"mime_type": "image/jpeg", "data": img_data})
            else:
                print(f"Warning: Image file not found at {file_path}")

        response = model.generate_content(parts, request_options={"timeout": 15})

        text_out = None
        if hasattr(response, "text") and response.text:
            text_out = response.text
        elif getattr(response, "parts", None):
            text_out = "\n".join(p.text for p in response.parts if getattr(p, "text", None))
        else:
            text_out = str(response)

        # Format response for better readability
        text_out = format_response(text_out)
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
        return {"url": f"/static/uploads/{file.filename}", "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not upload file: {e}")


@app.get("/screenshots")
def get_screenshots():
    try:
        files = []
        for entry in os.listdir(UPLOADS_DIR):
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
        deleted_count = 0
        errors = []
        for entry in os.listdir(UPLOADS_DIR):
            file_path = os.path.join(UPLOADS_DIR, entry)
            if os.path.isfile(file_path):
                try:
                    os.remove(file_path)
                    deleted_count += 1
                except Exception as e:
                    errors.append(f"{entry}: {e}")
        return {"message": f"Deleted {deleted_count} files", "errors": errors or None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/screenshots/{filename}")
def delete_screenshot(filename: str):
    file_path = os.path.join(UPLOADS_DIR, filename)
    if os.path.exists(file_path):
        os.remove(file_path)
        return {"message": "Deleted"}
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
        return [dict(row) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == '__main__':
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)