from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from huggingface_hub import InferenceClient
from dotenv import load_dotenv
import os
from typing import List
from database import SessionLocal, ChatMessage


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

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]

@app.get("/")
def read_root():
    return {"message": "Backend is running (FREE LLM)"}

@app.post("/chat")
def chat(request: ChatRequest):
    db = None

    try:
        messages = [m.model_dump() for m in request.messages]

        messages.insert(0, {
            "role": "system",
            "content": "You are a helpful study assistant. Explain simply and clearly."
        })

        output = client.chat_completion(
            model="Qwen/Qwen2.5-7B-Instruct",
            messages=messages,
            max_tokens=300
        )

        assistant_reply = output.choices[0].message.content

        db = SessionLocal()

        last_user_message = request.messages[-1]

        db.add(ChatMessage(
            role=last_user_message.role,
            content=last_user_message.content
        ))

        db.add(ChatMessage(
            role="assistant",
            content=assistant_reply
        ))

        db.commit()

        return {"reply": assistant_reply}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if db:
            db.close()


@app.get("/history")
def get_history():
    db = SessionLocal()

    messages = db.query(ChatMessage).order_by(ChatMessage.created_at.asc()).all()

    result = [
        {
            "role": msg.role,
            "content": msg.content
        }
        for msg in messages
    ]

    db.close()

    return {"messages": result}