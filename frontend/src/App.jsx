import { useState } from "react";

function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const newMessages = [
      ...messages,
      { role: "user", content: message }
    ];

    setMessages(newMessages);
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: newMessages,
        }),
      });

      const data = await response.json();

      if (data.reply) {
        setMessages([
          ...newMessages,
          { role: "assistant", content: data.reply }
        ]);
      } else if (data.detail) {
        setMessages([
          ...newMessages,
          { role: "assistant", content: "Error: " + data.detail }
        ]);
      } else {
        setMessages([
          ...newMessages,
          { role: "assistant", content: "Unknown error." }
        ]);
      }
    } catch (error) {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Error connecting to backend." }
      ]);
    }

    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "700px", margin: "40px auto", fontFamily: "Arial" }}>
      <h1>Study Assistant</h1>

      <div>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              margin: "10px 0",
              padding: "12px",
              borderRadius: "8px",
              background: msg.role === "user" ? "#d1e7dd" : "#f2f2f2",
            }}
          >
            <strong>{msg.role === "user" ? "You" : "Assistant"}:</strong>
            <p>{msg.content}</p>
          </div>
        ))}
      </div>

      <textarea
        rows="3"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ask your question..."
        style={{ width: "100%", padding: "10px", fontSize: "16px" }}
      />

      <button
        onClick={sendMessage}
        disabled={loading}
        style={{ marginTop: "10px", padding: "10px 20px", fontSize: "16px" }}
      >
        {loading ? "Thinking..." : "Send"}
      </button>
    </div>
  );
}

export default App;