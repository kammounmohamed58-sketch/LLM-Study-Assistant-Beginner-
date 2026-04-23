from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from huggingface_hub import InferenceClient
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = InferenceClient(token=os.getenv("HF_TOKEN"))

class ChatRequest(BaseModel):
    message: str

@app.get("/")
def read_root():
    return {"message": "Backend is running (FREE LLM)"}

@app.post("/chat")
def chat(request: ChatRequest):
    try:
        output = client.chat_completion(
           model="Qwen/Qwen2.5-7B-Instruct",
            messages=[
                {"role": "system", "content": "You are a helpful study assistant. Explain simply and clearly."},
                {"role": "user", "content": request.message}
            ],
            max_tokens=300
        )

        return {"reply": output.choices[0].message.content}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))