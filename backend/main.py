from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from huggingface_hub import InferenceClient
from dotenv import load_dotenv
import os
from typing import List
from database import SessionLocal, ChatMessage, ChatSession


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
    session_id: int | None = None
    messages: List[Message]

@app.get("/")
def read_root():
    return {"message": "Backend is running (FREE LLM)"}

@app.post("/chat")
def chat(request: ChatRequest):
    db = SessionLocal()

    try:
        if request.session_id:
            session = db.query(ChatSession).filter(ChatSession.id == request.session_id).first()
        else:
            first_message = request.messages[-1].content[:50]
            session = ChatSession(title=first_message)
            db.add(session)
            db.commit()
            db.refresh(session)

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
        last_user_message = request.messages[-1]

        db.add(ChatMessage(
            session_id=session.id,
            role=last_user_message.role,
            content=last_user_message.content
        ))

        db.add(ChatMessage(
            session_id=session.id,
            role="assistant",
            content=assistant_reply
        ))

        db.commit()

        return {
            "reply": assistant_reply,
            "session_id": session.id
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        db.close()
@app.get("/sessions")
def get_sessions():
    db = SessionLocal()

    sessions = db.query(ChatSession).order_by(ChatSession.created_at.desc()).all()

    result = [
        {
            "id": session.id,
            "title": session.title
        }
        for session in sessions
    ]

    db.close()

    return {"sessions": result}


@app.get("/sessions/{session_id}/messages")
def get_session_messages(session_id: int):
    db = SessionLocal()

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )

    result = [
        {
            "role": msg.role,
            "content": msg.content
        }
        for msg in messages
    ]

    db.close()

    return {"messages": result}        



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