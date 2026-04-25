import { useState } from "react";
import "./App.css";

function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const newMessages = [...messages, { role: "user", content: message }];

    setMessages(newMessages);
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await response.json();

      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: data.reply || "Error: " + JSON.stringify(data.detail),
        },
      ]);
    } catch (error) {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Error connecting to backend." },
      ]);
    }

    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>Study AI</h2>
        <p>LLM Study Assistant</p>
      </aside>

      <main className="chat-container">
        <header className="chat-header">
          <h1>Study Assistant</h1>
          <p>Ask questions, revise lessons, and learn faster.</p>
        </header>

        <section className="messages">
          {messages.length === 0 && (
            <div className="welcome">
              <h2>Welcome 👋</h2>
              <p>Ask me anything about your courses.</p>
            </div>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`message-row ${msg.role === "user" ? "user-row" : "assistant-row"
                }`}
            >
              <div className={`message-bubble ${msg.role}`}>
                <strong>{msg.role === "user" ? "You" : "Assistant"}</strong>
                <p>{msg.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="message-row assistant-row">
              <div className="message-bubble assistant">
                <strong>Assistant</strong>
                <p>Thinking...</p>
              </div>
            </div>
          )}
        </section>

        <div className="input-area">
          {/* 🔥 Smart buttons */}
          <div style={{ marginBottom: "10px", display: "flex", gap: "10px" }}>
            <button onClick={() => setMessage("Explain this simply: " + message)}>
              Explain
            </button>

            <button onClick={() => setMessage("Summarize: " + message)}>
              Summarize
            </button>

            <button onClick={() => setMessage("Generate a quiz about: " + message)}>
              Quiz
            </button>
          </div>

          <textarea
            rows="2"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your question..."
          />

          <button onClick={sendMessage} disabled={loading}>
            Send
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;