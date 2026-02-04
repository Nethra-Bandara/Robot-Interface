import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("No API Key found in .env")
else:
    genai.configure(api_key=api_key)
    try:
        print("Listing available models...")
        with open("models.txt", "w", encoding="utf-8") as f:
            for m in genai.list_models():
                if 'generateContent' in m.supported_generation_methods:
                    f.write(m.name + "\n")
                    print(m.name)
    except Exception as e:
        print(f"Error listing models: {e}")
