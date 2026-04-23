import { useState } from "react";

function App() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;

    setLoading(true);
    setReply("");

    try {
      const response = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();

      if (data.reply) {
        setReply(data.reply);
      } else if (data.detail) {
        setReply("Error: " + data.detail);
      } else {
        setReply("Unknown error.");
      }
    } catch (error) {
      setReply("Error connecting to backend.");
    }

    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "700px", margin: "40px auto", fontFamily: "Arial" }}>
      <h1>Study Assistant</h1>

      <textarea
        rows="5"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ask your question..."
        style={{ width: "100%", padding: "10px", fontSize: "16px" }}
      />

      <button
        onClick={sendMessage}
        style={{ marginTop: "10px", padding: "10px 20px", fontSize: "16px" }}
      >
        Send
      </button>

      {loading && <p>Thinking...</p>}

      {reply && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            background: "#f2f2f2",
            borderRadius: "8px",
          }}
        >
          <h3>Assistant:</h3>
          <p>{reply}</p>
        </div>
      )}
    </div>
  );
}

export default App;