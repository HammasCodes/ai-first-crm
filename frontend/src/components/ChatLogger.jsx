import { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  sendChatMessage,
  addUserMessage,
  clearChat,
} from "../features/chatSlice";
import { FaRobot } from "react-icons/fa";

export default function ChatLogger() {
  const dispatch = useDispatch();
  const { messages, loading } = useSelector((s) => s.chat);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    const msg = input.trim();
    if (!msg || loading) return;
    dispatch(addUserMessage(msg));
    dispatch(sendChatMessage({ message: msg }));
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const renderContent = (text) => {
    // Basic markdown-ish rendering for code blocks
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, i) => {
      if (part.startsWith("```")) {
        const code = part.replace(/```(?:json)?\n?/g, "").replace(/```$/, "");
        return <pre key={i}>{code}</pre>;
      }
      // Bold
      const boldParts = part.split(/(\*\*.*?\*\*)/g);
      return boldParts.map((bp, j) => {
        if (bp.startsWith("**") && bp.endsWith("**")) {
          return <strong key={`${i}-${j}`}>{bp.slice(2, -2)}</strong>;
        }
        return <span key={`${i}-${j}`}>{bp}</span>;
      });
    });
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2><span className="icon"><FaRobot /></span> AI Chat Logger</h2>
        <button className="btn btn-ghost" onClick={() => dispatch(clearChat())}>
          Clear Chat
        </button>
      </div>
      <div className="chat-container">
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="empty-state">
              <div className="icon"><FaRobot size={40} /></div>
              <p>Start by describing an HCP interaction in natural language.</p>
              <p style={{ fontSize: "0.8rem", marginTop: 8, color: "var(--gray-400)" }}>
                Example: &quot;I met Dr. Sharma at City Care Hospital today. We discussed CardioMax.&quot;
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`chat-bubble ${msg.role}`}>
              {renderContent(msg.content)}
            </div>
          ))}
          {loading && (
            <div className="chat-bubble assistant">
              <span className="spinner" style={{ marginRight: 8 }}></span>
              <span className="loading-dots">Thinking</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div className="chat-input-area">
          <input
            id="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe an interaction or ask a question..."
            disabled={loading}
          />
          <button className="btn btn-primary" onClick={send} disabled={loading || !input.trim()} id="chat-send-btn">
            {loading ? <span className="spinner"></span> : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
